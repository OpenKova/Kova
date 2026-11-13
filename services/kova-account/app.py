"""First-party Kova identity/profile service; no agent or provider credentials."""

from __future__ import annotations

import hashlib
import hmac
import io
import ipaddress
import base64
import gzip
import json
import os
import re
import secrets
import sqlite3
import threading
import time
import zlib
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator, Mapping
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request as UrlRequest, urlopen

import jwt
import psycopg
from psycopg.rows import dict_row
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from jwt import PyJWKClient
from pydantic import BaseModel, Field
from admin_dashboard import router as admin_dashboard_router

GOOGLE_ISSUERS = {"https://accounts.google.com", "accounts.google.com"}
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,24}$")
RESERVED_USERNAMES = {"admin", "administrator", "api", "kova", "root", "support", "system"}
CHALLENGE_TTL_SECONDS = 300
SESSION_TTL_SECONDS = 60 * 60 * 24 * 30
AUTH_RATE_WINDOW_SECONDS = 60
AUTH_RATE_LIMITS = {"challenge": 15, "google": 10, "google_native": 10, "exchange": 10}
TELEMETRY_MAX_BYTES = 1_048_576
DIAGNOSTICS_MAX_BYTES = 4_000_000
DIAGNOSTICS_RETENTION_SECONDS = 14 * 24 * 60 * 60


def _database_path() -> Path:
    return Path(os.environ.get("DATABASE_PATH", "./kova-accounts.sqlite3"))


def _service_token_secret() -> bytes:
    return os.environ.get("KOVA_ACCOUNT_SESSION_PEPPER", "").encode("utf-8")

app = FastAPI(title="Kova Account Service", docs_url=None, redoc_url=None)
_jwk_client: PyJWKClient | None = None


class GoogleLogin(BaseModel):
    challenge_id: str = Field(min_length=32, max_length=128)
    id_token: str = Field(min_length=100, max_length=16384)
    code_challenge: str = Field(pattern=r"^[A-Za-z0-9_-]{43}$")


class NativeGoogleLogin(BaseModel):
    challenge_id: str = Field(min_length=32, max_length=128)
    google_code: str = Field(min_length=16, max_length=4096)
    code_verifier: str = Field(min_length=43, max_length=128)
    redirect_uri: str = Field(min_length=20, max_length=256)


class UsernameUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=24)


class CodeExchange(BaseModel):
    code: str = Field(min_length=32, max_length=128)
    code_verifier: str = Field(min_length=43, max_length=128)
    challenge_id: str = Field(min_length=32, max_length=128)


class _PostgresConnection:
    """Match the small SQLite connection surface used by this API."""

    def __init__(self, connection: psycopg.Connection) -> None:
        self._connection = connection
        self._transaction = False

    def execute(self, sql: str, params: tuple = ()):
        statement = sql.replace("BEGIN IMMEDIATE", "BEGIN").replace("?", "%s")
        begins_transaction = statement.lstrip().upper().startswith("BEGIN")
        cursor = self._connection.execute(statement, params)
        if begins_transaction:
            self._transaction = True
        elif not self._transaction:
            self._connection.commit()
        return cursor

    def executescript(self, script: str) -> None:
        for statement in script.split(";"):
            if statement.strip():
                self.execute(statement)

    def commit(self) -> None:
        self._connection.commit()
        self._transaction = False

    def rollback(self) -> None:
        self._connection.rollback()
        self._transaction = False

    def close(self) -> None:
        self._connection.close()


_POSTGRES_SCHEMA_READY = False
_POSTGRES_SCHEMA_LOCK = threading.Lock()


def _database():
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if database_url:
        db = _PostgresConnection(psycopg.connect(
            database_url,
            connect_timeout=10,
            prepare_threshold=None,
            row_factory=dict_row,
        ))
        _ensure_postgres_schema(db)
        return db
    if os.environ.get("VERCEL"):
        raise HTTPException(503, "DATABASE_URL must be configured for the deployed account service.")

    database = _database_path()
    database.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(database, timeout=10, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA busy_timeout=10000")
    db.execute("PRAGMA journal_mode=WAL")
    db.executescript(_SCHEMA_SQL)
    return db


_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    google_sub TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    google_name TEXT NOT NULL,
    picture_url TEXT,
    username TEXT,
    username_key TEXT UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS challenges (
    id_hash TEXT PRIMARY KEY,
    nonce_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_codes (
    code_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    challenge_id_hash TEXT NOT NULL,
    code_challenge TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_account_id ON sessions(account_id);
CREATE TABLE IF NOT EXISTS shared_metrics_packages (
    package_id TEXT PRIMARY KEY,
    install_hash TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    received_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS shared_metrics_received_at ON shared_metrics_packages(received_at);
CREATE TABLE IF NOT EXISTS diagnostics_bundles (
    token_hash TEXT PRIMARY KEY,
    bundle BYTEA NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS diagnostics_expires_at ON diagnostics_bundles(expires_at);
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    client_hash TEXT NOT NULL,
    action TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    request_count INTEGER NOT NULL,
    PRIMARY KEY(client_hash, action, window_start)
);
"""


def _ensure_postgres_schema(db: _PostgresConnection) -> None:
    global _POSTGRES_SCHEMA_READY
    if _POSTGRES_SCHEMA_READY:
        return
    with _POSTGRES_SCHEMA_LOCK:
        if not _POSTGRES_SCHEMA_READY:
            db.executescript(_SCHEMA_SQL)
            _POSTGRES_SCHEMA_READY = True


@contextmanager
def _connection() -> Iterator[sqlite3.Connection | _PostgresConnection]:
    db = _database()
    try:
        yield db
    finally:
        db.close()


def _digest(value: str) -> str:
    secret = _service_token_secret()
    if len(secret) < 32:
        raise HTTPException(503, "Kova account service secret must contain at least 32 bytes.")
    return hmac.new(secret, value.encode("utf-8"), hashlib.sha256).hexdigest()


def _profile(row: Mapping[str, Any]) -> dict[str, object]:
    return {
        "email": row["email"],
        "google_name": row["google_name"],
        "id": row["id"],
        "picture_url": row["picture_url"],
        "username": row["username"],
    }


def _client_address(request: Request) -> str:
    if request.headers.get("x-vercel-id"):
        forwarded = (request.headers.get("x-vercel-forwarded-for")
                     or request.headers.get("x-forwarded-for", "")).strip()
    else:
        forwarded = request.headers.get("cf-connecting-ip", "").strip()
    for candidate in forwarded.split(","):
        try:
            return ipaddress.ip_address(candidate.strip()).compressed
        except ValueError:
            continue
    remote = request.client.host if request.client else "unknown"
    try:
        return ipaddress.ip_address(remote).compressed
    except ValueError:
        return remote[:255]


def _enforce_auth_rate_limit(request: Request, action: str) -> None:
    limit = AUTH_RATE_LIMITS[action]
    now = int(time.time())
    window_start = now - now % AUTH_RATE_WINDOW_SECONDS
    client_hash = _digest(f"auth-rate:{_client_address(request)}")
    with _connection() as db:
        db.execute("BEGIN IMMEDIATE")
        db.execute(
            "DELETE FROM auth_rate_limits WHERE window_start<?",
            (window_start - 3600,),
        )
        increment = "request_count=request_count+1"
        if isinstance(db, _PostgresConnection):
            increment = "request_count=auth_rate_limits.request_count+1"
        row = db.execute(
            "INSERT INTO auth_rate_limits(client_hash,action,window_start,request_count) VALUES(?,?,?,1) "
            f"ON CONFLICT(client_hash,action,window_start) DO UPDATE SET {increment} RETURNING request_count",
            (client_hash, action, window_start),
        ).fetchone()
        db.commit()
    if row["request_count"] > limit:
        retry_after = window_start + AUTH_RATE_WINDOW_SECONDS - now
        raise HTTPException(
            429,
            "Too many sign-in attempts. Wait before trying again.",
            headers={"Retry-After": str(retry_after)},
        )


def _enforce_ingest_rate_limit(request: Request, action: str, limit: int) -> None:
    """Bound public, data-only ingestion by a keyed digest of the source address."""
    now = int(time.time())
    window_start = now - now % AUTH_RATE_WINDOW_SECONDS
    client_hash = _digest(f"ingest:{action}:{_client_address(request)}")
    with _connection() as db:
        db.execute("BEGIN IMMEDIATE")
        db.execute("DELETE FROM auth_rate_limits WHERE window_start<?", (window_start - 3600,))
        increment = "request_count=request_count+1"
        if isinstance(db, _PostgresConnection):
            increment = "request_count=auth_rate_limits.request_count+1"
        row = db.execute(
            "INSERT INTO auth_rate_limits(client_hash,action,window_start,request_count) VALUES(?,?,?,1) "
            f"ON CONFLICT(client_hash,action,window_start) DO UPDATE SET {increment} RETURNING request_count",
            (client_hash, action, window_start),
        ).fetchone()
        db.commit()
    if row["request_count"] > limit:
        raise HTTPException(429, "Too many uploads. Try again shortly.",
                            headers={"Retry-After": str(window_start + AUTH_RATE_WINDOW_SECONDS - now)})


async def _bounded_body(request: Request, maximum: int) -> bytes:
    """Read a request body only up to the route's explicit transport limit."""
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > maximum:
            raise HTTPException(413, "Upload exceeds the size limit.")
    return bytes(body)


def _gunzip_bounded(body: bytes, maximum: int) -> bytes:
    """Decompress gzip without allowing a small body to expand without a bound."""
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(body)) as stream:
            decoded = stream.read(maximum + 1)
    except (OSError, EOFError, zlib.error) as exc:
        raise HTTPException(400, "Upload is not valid gzip data.") from exc
    if len(decoded) > maximum:
        raise HTTPException(413, "Uncompressed upload exceeds the size limit.")
    return decoded


def _google_claims(encoded: str, nonce: str) -> dict[str, object]:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        raise HTTPException(503, "Google sign-in is not configured on this service.")
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient("https://www.googleapis.com/oauth2/v3/certs", cache_jwk_set=True)
    try:
        key = _jwk_client.get_signing_key_from_jwt(encoded)
        claims = jwt.decode(
            encoded,
            key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=tuple(GOOGLE_ISSUERS),
            options={"require": ["exp", "iat", "iss", "sub", "aud", "nonce"]},
        )
    except (jwt.PyJWTError, jwt.PyJWKClientError) as exc:
        raise HTTPException(401, "Google sign-in could not be verified.") from exc
    if claims.get("nonce") != nonce:
        raise HTTPException(401, "Google sign-in challenge did not match.")
    if claims.get("email_verified") is not True and claims.get("email_verified") != "true":
        raise HTTPException(403, "Use a Google account with a verified email address.")
    if not isinstance(claims.get("sub"), str) or not claims.get("sub"):
        raise HTTPException(401, "Google did not return a valid account identity.")
    if not isinstance(claims.get("email"), str) or not claims["email"].strip():
        raise HTTPException(401, "Google did not return an email address.")
    return claims


def _exchange_google_code(payload: NativeGoogleLogin) -> GoogleLogin:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        raise HTTPException(503, "Google OAuth is not configured on the Kova account service.")
    if not re.fullmatch(r"[A-Za-z0-9._~-]{43,128}", payload.code_verifier):
        raise HTTPException(400, "Google sign-in proof is invalid.")
    try:
        redirect = urlsplit(payload.redirect_uri)
        port = redirect.port
    except ValueError as exc:
        raise HTTPException(400, "Google sign-in redirect is invalid.") from exc
    if (redirect.scheme != "http" or redirect.hostname != "127.0.0.1" or not port
            or redirect.username or redirect.password or redirect.path not in ("", "/")
            or redirect.query or redirect.fragment):
        raise HTTPException(400, "Google sign-in redirect must use the local Kova callback.")

    request = UrlRequest(
        "https://oauth2.googleapis.com/token",
        data=urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "code": payload.google_code,
            "code_verifier": payload.code_verifier,
            "grant_type": "authorization_code",
            "redirect_uri": payload.redirect_uri,
        }).encode("ascii"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=15) as response:
            tokens = json.loads(response.read())
    except HTTPError as exc:
        try:
            failure = json.loads(exc.read())
        except (UnicodeDecodeError, json.JSONDecodeError):
            failure = {}
        error = failure.get("error") if isinstance(failure, dict) else None
        if error == "invalid_client":
            raise HTTPException(503, "Google rejected the OAuth client configuration.") from exc
        raise HTTPException(401, "Google rejected the sign-in code. Start sign-in again.") from exc
    except (TimeoutError, URLError, OSError) as exc:
        raise HTTPException(502, "Kova could not reach Google's sign-in service. Try again.") from exc
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(502, "Google returned an invalid sign-in response.") from exc
    id_token = tokens.get("id_token") if isinstance(tokens, dict) else None
    if not isinstance(id_token, str):
        raise HTTPException(401, "Google did not return an identity token.")
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(payload.code_verifier.encode("ascii")).digest()
    ).rstrip(b"=").decode("ascii")
    return GoogleLogin(
        challenge_id=payload.challenge_id,
        id_token=id_token,
        code_challenge=code_challenge,
    )


def _safe_picture(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    try:
        from urllib.parse import urlparse

        parsed = urlparse(value)
        if parsed.scheme != "https" or parsed.hostname is None:
            return None
        host = parsed.hostname.lower()
        if host not in {"googleusercontent.com", "lh3.googleusercontent.com"} and not host.endswith(".googleusercontent.com"):
            return None
        try:
            ipaddress.ip_address(host)
            return None
        except ValueError:
            return value[:2048]
    except ValueError:
        return None


def _account_for_token(authorization: str | None = Header(default=None)) -> Mapping[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Sign in to your Kova account.")
    token = authorization.removeprefix("Bearer ").strip()
    if len(token) < 40 or len(token) > 256:
        raise HTTPException(401, "Kova account session is invalid.")
    with _connection() as db:
        row = db.execute(
            "SELECT a.* FROM sessions s JOIN accounts a ON a.id=s.account_id "
            "WHERE s.token_hash=? AND s.expires_at>?",
            (_digest(token), int(time.time())),
        ).fetchone()
    if row is None:
        raise HTTPException(401, "Kova account session expired. Sign in again.")
    return row


Account = Depends(_account_for_token)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
def ready() -> dict[str, str]:
    if not os.environ.get("GOOGLE_CLIENT_ID", "").strip() or not os.environ.get("GOOGLE_CLIENT_SECRET", "").strip():
        raise HTTPException(503, "Google sign-in is not configured on this service.")
    _digest("readiness-probe")
    with _connection() as db:
        db.execute("SELECT 1").fetchone()
    return {"status": "ready"}


@app.post("/v1/telemetry", status_code=202)
async def ingest_shared_metrics(request: Request) -> dict[str, bool]:
    """Durably accept only bounded, opt-in aggregate metrics packages."""
    _enforce_ingest_rate_limit(request, "metrics", 60)
    body = await _bounded_body(request, TELEMETRY_MAX_BYTES)
    if request.headers.get("content-encoding", "").lower() == "gzip":
        body = _gunzip_bounded(body, TELEMETRY_MAX_BYTES)
    try:
        payload = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(400, "Metrics package is not valid JSON.") from exc
    if not isinstance(payload, dict):
        raise HTTPException(400, "Metrics package must be a JSON object.")
    package_id, install_id = payload.get("package_id"), payload.get("install_id")
    if not isinstance(package_id, str) or not re.fullmatch(
            r"[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}",
            package_id, re.IGNORECASE):
        raise HTTPException(400, "Metrics package identifier is invalid.")
    if not isinstance(install_id, str) or not 1 <= len(install_id) <= 128:
        raise HTTPException(400, "Metrics installation identifier is invalid.")
    if payload.get("schema_version") != "hermes.shared_metrics.v4":
        raise HTTPException(400, "Metrics package schema is unsupported.")
    resource = payload.get("resource")
    metrics = payload.get("metrics")
    if (not isinstance(resource, dict) or set(resource) != {
            "hermes_version", "os_family", "architecture", "install_method"}
            or any(not isinstance(value, str) or not value or len(value) > 256
                   for value in resource.values())):
        raise HTTPException(400, "Metrics package resource is invalid.")
    if not isinstance(metrics, list) or not 1 <= len(metrics) <= 1024:
        raise HTTPException(400, "Metrics package measurements are invalid.")
    for metric in metrics:
        dimensions = metric.get("dimensions") if isinstance(metric, dict) else None
        if (not isinstance(metric, dict) or set(metric) != {"name", "type", "dimensions", "value"}
                or not isinstance(metric.get("name"), str) or len(metric["name"]) > 160
                or metric.get("type") != "counter" or not isinstance(dimensions, dict)
                or len(dimensions) > 32
                or any(not isinstance(key, str) or len(key) > 80
                       or not isinstance(value, (str, int, float, bool))
                       or isinstance(value, str) and len(value) > 256
                       for key, value in dimensions.items())
                or isinstance(metric.get("value"), bool)
                or not isinstance(metric.get("value"), int) or metric["value"] < 0):
            raise HTTPException(400, "Metrics package contains an invalid measurement.")
    expected_fields = {
        "schema_version", "package_id", "install_id", "period_start", "period_end",
        "generated_at", "resource", "metrics",
    }
    if set(payload) != expected_fields or any(
            not isinstance(payload.get(key), str) or len(payload[key]) > 64
            for key in ("period_start", "period_end", "generated_at")):
        raise HTTPException(400, "Metrics package fields are invalid.")
    payload.pop("install_id", None)
    serialized = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    now = int(time.time())
    with _connection() as db:
        db.execute(
            "INSERT INTO shared_metrics_packages(package_id,install_hash,payload_json,received_at) "
            "VALUES(?,?,?,?) ON CONFLICT(package_id) DO NOTHING",
            (package_id, _digest(f"metrics-install:{install_id}"), serialized, now),
        )
        db.execute("DELETE FROM shared_metrics_packages WHERE received_at<?", (now - 90 * 86400,))
    return {"accepted": True}


@app.post("/v1/diagnostics", status_code=201)
async def ingest_diagnostics(request: Request) -> dict[str, object]:
    """Store an explicitly user-approved, redacted gzip bundle behind a bearer link."""
    _enforce_ingest_rate_limit(request, "diagnostics", 4)
    if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/gzip":
        raise HTTPException(415, "Diagnostics must be sent as a gzip bundle.")
    bundle = await _bounded_body(request, DIAGNOSTICS_MAX_BYTES)
    if not bundle.startswith(b"\x1f\x8b"):
        raise HTTPException(400, "Diagnostics bundle is not valid gzip data.")
    _gunzip_bounded(bundle, DIAGNOSTICS_MAX_BYTES)
    now = int(time.time())
    expires = now + DIAGNOSTICS_RETENTION_SECONDS
    token = secrets.token_urlsafe(32)
    token_hash = _digest(f"diagnostics:{token}")
    with _connection() as db:
        db.execute("DELETE FROM diagnostics_bundles WHERE expires_at<=?", (now,))
        db.execute(
            "INSERT INTO diagnostics_bundles(token_hash,bundle,created_at,expires_at) VALUES(?,?,?,?)",
            (token_hash, bundle, now, expires),
        )
    base = os.environ.get("PUBLIC_BASE_URL", "https://telemetry.neuralstudio.in").rstrip("/")
    expires_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires))
    return {
        "upload_id": token[:12],
        "view_url": f"{base}/v1/diagnostics/{token}",
        "expires_at": expires_iso,
    }


@app.get("/v1/diagnostics/{token}")
def read_diagnostics(token: str) -> Response:
    """Download a diagnostics bundle with its unguessable, expiring bearer link."""
    if len(token) < 40 or len(token) > 64:
        raise HTTPException(404, "Diagnostics bundle not found or expired.")
    with _connection() as db:
        row = db.execute(
            "SELECT bundle FROM diagnostics_bundles WHERE token_hash=? AND expires_at>?",
            (_digest(f"diagnostics:{token}"), int(time.time())),
        ).fetchone()
    if row is None:
        raise HTTPException(404, "Diagnostics bundle not found or expired.")
    return Response(bytes(row["bundle"]), media_type="application/gzip",
                    headers={"Content-Disposition": 'attachment; filename="kova-diagnostics.gz"',
                             "Cache-Control": "private, no-store"})


@app.get("/v1/internal/cleanup")
def cleanup_expired_data(request: Request) -> dict[str, int]:
    """Vercel cron retention sweep for metrics and uploaded support bundles."""
    expected = os.environ.get("CRON_SECRET", "").strip()
    authorization = request.headers.get("authorization", "")
    if not expected or not hmac.compare_digest(authorization, f"Bearer {expected}"):
        raise HTTPException(401, "Unauthorized.")
    now = int(time.time())
    with _connection() as db:
        bundles = db.execute(
            "DELETE FROM diagnostics_bundles WHERE expires_at<=?", (now,)
        ).rowcount
        metrics = db.execute(
            "DELETE FROM shared_metrics_packages WHERE received_at<?", (now - 90 * 86400,)
        ).rowcount
    return {"diagnostics_deleted": bundles, "metrics_deleted": metrics}


@app.post("/v1/auth/challenge")
def create_challenge(request: Request) -> dict[str, object]:
    _enforce_auth_rate_limit(request, "challenge")
    challenge_id = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    expires = int(time.time()) + CHALLENGE_TTL_SECONDS
    with _connection() as db:
        db.execute("DELETE FROM challenges WHERE expires_at<=?", (int(time.time()),))
        db.execute(
            "INSERT INTO challenges(id_hash,nonce_hash,expires_at) VALUES(?,?,?)",
            (_digest(challenge_id), _digest(nonce), expires),
        )
    return {"challenge_id": challenge_id, "expires_at": expires, "nonce": nonce}


@app.post("/v1/auth/google")
def sign_in_google(payload: GoogleLogin, request: Request) -> dict[str, object]:
    _enforce_auth_rate_limit(request, "google")
    now = int(time.time())
    with _connection() as db:
        db.execute("BEGIN IMMEDIATE")
        row = db.execute(
        "SELECT nonce_hash FROM challenges WHERE id_hash=? AND expires_at>?",
            (_digest(payload.challenge_id), now),
        ).fetchone()
        if row is not None:
            db.execute("DELETE FROM challenges WHERE id_hash=?", (_digest(payload.challenge_id),))
        db.commit()
    if row is None:
        raise HTTPException(401, "Google sign-in challenge expired. Start again.")
    # Decode only to obtain the signed nonce claim; all claims are verified below.
    try:
        nonce = jwt.decode(payload.id_token, options={"verify_signature": False}).get("nonce")
    except jwt.PyJWTError as exc:
        raise HTTPException(401, "Google sign-in could not be verified.") from exc
    if not isinstance(nonce, str) or not secrets.compare_digest(_digest(nonce), row["nonce_hash"]):
        raise HTTPException(401, "Google sign-in challenge did not match.")
    claims = _google_claims(payload.id_token, nonce)
    account_id = secrets.token_urlsafe(18)
    sub = str(claims["sub"])
    email = str(claims["email"]).strip()
    name = str(claims.get("name") or email.split("@", 1)[0])[:160]
    picture_url = _safe_picture(claims.get("picture"))
    with _connection() as db:
        try:
            db.execute("BEGIN IMMEDIATE")
            db.execute(
                "INSERT INTO accounts(id,google_sub,email,google_name,picture_url,created_at,updated_at) "
                "VALUES(?,?,?,?,?,?,?) ON CONFLICT(google_sub) DO UPDATE SET "
                "email=excluded.email,google_name=excluded.google_name,picture_url=excluded.picture_url,updated_at=excluded.updated_at",
                (account_id, sub, email, name, picture_url, now, now),
            )
            account = db.execute("SELECT * FROM accounts WHERE google_sub=?", (sub,)).fetchone()
            db.commit()
        except (sqlite3.IntegrityError, psycopg.IntegrityError) as exc:
            db.rollback()
            raise HTTPException(409, "Could not create the Kova account session.") from exc
    code = secrets.token_urlsafe(48)
    with _connection() as db:
        db.execute(
            "INSERT INTO auth_codes(code_hash,account_id,challenge_id_hash,code_challenge,expires_at) VALUES(?,?,?,?,?)",
            (_digest(code), account["id"], _digest(payload.challenge_id), payload.code_challenge, now + 120),
        )
    return {"authorization_code": code, "profile": _profile(account)}


@app.post("/v1/auth/google/native")
def sign_in_google_native(payload: NativeGoogleLogin, request: Request) -> dict[str, object]:
    _enforce_auth_rate_limit(request, "google_native")
    return sign_in_google(_exchange_google_code(payload), request)


@app.post("/v1/auth/exchange")
def exchange_code(payload: CodeExchange, request: Request) -> dict[str, object]:
    _enforce_auth_rate_limit(request, "exchange")
    if not re.fullmatch(r"[A-Za-z0-9._~-]{43,128}", payload.code_verifier):
        raise HTTPException(400, "PKCE verifier is invalid.")
    expected_challenge = base64.urlsafe_b64encode(hashlib.sha256(payload.code_verifier.encode("ascii")).digest()).rstrip(b"=").decode("ascii")
    now = int(time.time())
    with _connection() as db:
        db.execute("BEGIN IMMEDIATE")
        code = db.execute(
            "SELECT account_id,challenge_id_hash,code_challenge FROM auth_codes WHERE code_hash=? AND expires_at>?",
            (_digest(payload.code), now),
        ).fetchone()
        if code is None or not hmac.compare_digest(code["challenge_id_hash"], _digest(payload.challenge_id)):
            db.commit()
            raise HTTPException(401, "Kova sign-in code expired. Start again.")
        account = db.execute("SELECT * FROM accounts WHERE id=?", (code["account_id"],)).fetchone()
        if account is None or not hmac.compare_digest(code["code_challenge"], expected_challenge):
            db.commit()
            raise HTTPException(401, "Kova sign-in proof did not match.")
        db.execute("DELETE FROM auth_codes WHERE code_hash=?", (_digest(payload.code),))
        token = secrets.token_urlsafe(48)
        db.execute("INSERT INTO sessions(token_hash,account_id,expires_at,created_at) VALUES(?,?,?,?)", (_digest(token), account["id"], now + SESSION_TTL_SECONDS, now))
        db.commit()
    return {"expires_at": now + SESSION_TTL_SECONDS, "profile": _profile(account), "session_token": token}


@app.get("/v1/me")
def get_me(account: Mapping[str, Any] = Account) -> dict[str, object]:
    return {"profile": _profile(account)}


@app.put("/v1/me/username")
def set_username(payload: UsernameUpdate, account: Mapping[str, Any] = Account) -> dict[str, object]:
    username = payload.username.strip()
    if not USERNAME_RE.fullmatch(username) or username.lower() in RESERVED_USERNAMES:
        raise HTTPException(422, "Use 3-24 letters, numbers, or underscores for your username.")
    now = int(time.time())
    with _connection() as db:
        try:
            db.execute(
                "UPDATE accounts SET username=?,username_key=?,updated_at=? WHERE id=?",
                (username, username.lower(), now, account["id"]),
            )
        except (sqlite3.IntegrityError, psycopg.IntegrityError) as exc:
            raise HTTPException(409, "That username is already taken.") from exc
        updated = db.execute("SELECT * FROM accounts WHERE id=?", (account["id"],)).fetchone()
    return {"profile": _profile(updated)}


@app.delete("/v1/auth/session", status_code=204)
def revoke_session(response: Response, authorization: str | None = Header(default=None)) -> Response:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Sign in to your Kova account.")
    with _connection() as db:
        db.execute("DELETE FROM sessions WHERE token_hash=?", (_digest(authorization.removeprefix("Bearer ").strip()),))
    response.status_code = 204
    return response


@app.delete("/v1/me", status_code=204)
def delete_account(account: Mapping[str, Any] = Account) -> Response:
    with _connection() as db:
        db.execute("BEGIN IMMEDIATE")
        db.execute("DELETE FROM auth_codes WHERE account_id=?", (account["id"],))
        db.execute("DELETE FROM accounts WHERE id=?", (account["id"],))
        db.commit()
    return Response(status_code=204)


app.include_router(admin_dashboard_router)
