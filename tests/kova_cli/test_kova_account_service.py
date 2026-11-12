"""Behavior contracts for the standalone Kova account service."""

from __future__ import annotations

import importlib.util
import sys
import time
from pathlib import Path
from types import SimpleNamespace

import jwt
import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException


SERVICE_PATH = Path(__file__).parents[2] / "services" / "kova-account" / "app.py"
SPEC = importlib.util.spec_from_file_location("kova_account_service", SERVICE_PATH)
assert SPEC and SPEC.loader
service = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = service
SPEC.loader.exec_module(service)
client = TestClient(service.app)


def test_username_is_claimed_case_insensitively_and_session_is_revocable(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "accounts.sqlite3"))
    monkeypatch.setenv("KOVA_ACCOUNT_SESSION_PEPPER", "test-secret-" * 3)
    now = 1_800_000_000
    monkeypatch.setattr(service, "time", SimpleNamespace(time=lambda: now))
    with service._connection() as db:
        db.execute(
            "INSERT INTO accounts(id,google_sub,email,google_name,created_at,updated_at,username,username_key) VALUES(?,?,?,?,?,?,?,?)",
            ("account-a", "google-a", "a@example.com", "A", now, now, "KovaUser", "kov auser".replace(" ", "")),
        )
        db.execute(
            "INSERT INTO accounts(id,google_sub,email,google_name,created_at,updated_at) VALUES(?,?,?,?,?,?)",
            ("account-b", "google-b", "b@example.com", "B", now, now),
        )
        db.execute(
            "INSERT INTO sessions(token_hash,account_id,expires_at,created_at) VALUES(?,?,?,?)",
            (service._digest("test-session-token-which-is-long-enough-for-authentication"), "account-b", now + 60, now),
        )
    auth = {"Authorization": "Bearer test-session-token-which-is-long-enough-for-authentication"}

    conflict = client.put("/v1/me/username", json={"username": "kovAuser"}, headers=auth)
    assert conflict.status_code == 409
    update = client.put("/v1/me/username", json={"username": "New_User"}, headers=auth)
    assert update.status_code == 200
    assert update.json()["profile"]["username"] == "New_User"

    revoked = client.delete("/v1/auth/session", headers=auth)
    assert revoked.status_code == 204
    assert client.get("/v1/me", headers=auth).status_code == 401


def test_account_deletion_removes_sessions_and_unredeemed_auth_codes(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "accounts.sqlite3"))
    monkeypatch.setenv("KOVA_ACCOUNT_SESSION_PEPPER", "test-secret-" * 3)
    now = int(time.time())
    token = "test-session-token-which-is-long-enough-for-authentication"
    with service._connection() as db:
        db.execute(
            "INSERT INTO accounts(id,google_sub,email,google_name,created_at,updated_at) VALUES(?,?,?,?,?,?)",
            ("account-a", "google-a", "a@example.com", "A", now, now),
        )
        db.execute(
            "INSERT INTO sessions(token_hash,account_id,expires_at,created_at) VALUES(?,?,?,?)",
            (service._digest(token), "account-a", now + 60, now),
        )
        db.execute(
            "INSERT INTO auth_codes(code_hash,account_id,challenge_id_hash,code_challenge,expires_at) VALUES(?,?,?,?,?)",
            (service._digest("authorization-code"), "account-a", service._digest("challenge-id"), "c" * 43, now + 60),
        )

    response = client.delete("/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 204
    with service._connection() as db:
        assert db.execute("SELECT COUNT(*) FROM accounts").fetchone()[0] == 0
        assert db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0] == 0
        assert db.execute("SELECT COUNT(*) FROM auth_codes").fetchone()[0] == 0


def test_code_exchange_requires_matching_pkce_and_only_works_once(tmp_path, monkeypatch):
    import base64
    import hashlib

    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "accounts.sqlite3"))
    monkeypatch.setenv("KOVA_ACCOUNT_SESSION_PEPPER", "test-secret-" * 3)
    monkeypatch.setattr(service, "time", SimpleNamespace(time=lambda: 1_800_000_000))
    verifier = "v" * 48
    wrong_verifier = "w" * 48
    expected = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    code = "c" * 48
    challenge_id = "i" * 48
    with service._connection() as db:
        db.execute(
            "INSERT INTO accounts(id,google_sub,email,google_name,created_at,updated_at) VALUES(?,?,?,?,?,?)",
            ("account-a", "google-a", "a@example.com", "A", 1, 1),
        )
        db.execute(
            "INSERT INTO auth_codes(code_hash,account_id,challenge_id_hash,code_challenge,expires_at) VALUES(?,?,?,?,?)",
            (service._digest(code), "account-a", service._digest(challenge_id), expected, 1_800_000_060),
        )

    good = {"code": code, "code_verifier": verifier, "challenge_id": challenge_id}
    wrong = {**good, "code_verifier": wrong_verifier}
    assert client.post("/v1/auth/exchange", json=wrong).status_code == 401
    # A failed verifier does not consume the valid short-lived code.
    response = client.post("/v1/auth/exchange", json=good)
    assert response.status_code == 200
    assert response.json()["profile"]["id"] == "account-a"
    assert client.post("/v1/auth/exchange", json=good).status_code == 401


def test_health_does_not_require_google_configuration():
    assert client.get("/health").json() == {"status": "ok"}


def test_auth_challenge_requires_a_configured_session_secret(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "accounts.sqlite3"))
    monkeypatch.delenv("KOVA_ACCOUNT_SESSION_PEPPER", raising=False)
    assert client.post("/v1/auth/challenge").status_code == 503


def test_auth_challenge_returns_short_lived_nonce(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "accounts.sqlite3"))
    monkeypatch.setenv("KOVA_ACCOUNT_SESSION_PEPPER", "test-secret-" * 3)
    monkeypatch.setattr(service, "time", SimpleNamespace(time=lambda: 1_800_000_000))
    response = client.post("/v1/auth/challenge")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["challenge_id"]) >= 32
    assert len(payload["nonce"]) >= 32
    assert payload["expires_at"] == 1_800_000_000 + service.CHALLENGE_TTL_SECONDS


def test_readiness_requires_service_configuration_and_database(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "accounts.sqlite3"))
    monkeypatch.setenv("KOVA_ACCOUNT_SESSION_PEPPER", "test-secret-" * 3)
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "desktop-client.apps.googleusercontent.com")
    assert client.get("/ready").json() == {"status": "ready"}

    monkeypatch.delenv("GOOGLE_CLIENT_ID")
    assert client.get("/ready").status_code == 503


def test_google_identity_requires_valid_signature_audience_issuer_and_nonce(monkeypatch):
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    class SigningKey:
        def __init__(self):
            self.key = key.public_key()

    class JwkClient:
        def get_signing_key_from_jwt(self, _token):
            return SigningKey()

    monkeypatch.setattr(service, "_jwk_client", JwkClient())
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "desktop-client.apps.googleusercontent.com")
    claims = {
        "iss": "https://accounts.google.com",
        "aud": "desktop-client.apps.googleusercontent.com",
        "sub": "google-account-id",
        "email": "user@example.com",
        "email_verified": True,
        "nonce": "expected-nonce",
        "iat": int(time.time()),
        "exp": int(time.time()) + 300,
    }
    token = jwt.encode(claims, key, algorithm="RS256")

    verified = service._google_claims(token, "expected-nonce")
    assert verified["sub"] == "google-account-id"

    bad_audience = jwt.encode({**claims, "aud": "another-client"}, key, algorithm="RS256")
    with pytest.raises(HTTPException) as invalid_audience:
        service._google_claims(bad_audience, "expected-nonce")
    assert invalid_audience.value.status_code == 401

    with pytest.raises(HTTPException) as mismatched_nonce:
        service._google_claims(token, "different-nonce")
    assert mismatched_nonce.value.status_code == 401


def test_google_identity_rejects_unverified_email(monkeypatch):
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    class SigningKey:
        def __init__(self):
            self.key = key.public_key()

    class JwkClient:
        def get_signing_key_from_jwt(self, _token):
            return SigningKey()

    monkeypatch.setattr(service, "_jwk_client", JwkClient())
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "desktop-client.apps.googleusercontent.com")
    claims = {
        "iss": "accounts.google.com",
        "aud": "desktop-client.apps.googleusercontent.com",
        "sub": "google-account-id",
        "email": "user@example.com",
        "email_verified": False,
        "nonce": "expected-nonce",
        "iat": int(time.time()),
        "exp": int(time.time()) + 300,
    }
    token = jwt.encode(claims, key, algorithm="RS256")

    with pytest.raises(HTTPException) as unverified_email:
        service._google_claims(token, "expected-nonce")
    assert unverified_email.value.status_code == 403
