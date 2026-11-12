# Kova Account Service

First-party identity/profile service for Kova Desktop. It stores the Google
identity, unique username, and revocable Kova sessions. It does not store chats,
agent profiles, provider credentials, Gmail data, or gateway secrets.

## Local development

Run `uvicorn app:app --app-dir services/kova-account --host 127.0.0.1 --port 8787`.
Configure `GOOGLE_CLIENT_ID` with the same Google OAuth Desktop client ID used
by Kova Desktop, `KOVA_ACCOUNT_SESSION_PEPPER` with a random deployment secret,
and `DATABASE_PATH` with a persistent SQLite file path. Generate a session
pepper with at least 32 bytes. Do not expose the
development server to the network. Production requires HTTPS, a persistent
database volume with backups, and a trusted reverse proxy. The API applies
per-client limits to sign-in endpoints; the reverse proxy must supply a
verified `CF-Connecting-IP` header (Render does this at its public edge).

Build the container from the repository root with
`docker build -f services/kova-account/Dockerfile -t kova-account .`. Mount a
persistent volume at `/data`, configure `DATABASE_PATH=/data/accounts.sqlite3`,
configure both `GOOGLE_CLIENT_ID` and `KOVA_ACCOUNT_SESSION_PEPPER`, and publish
it only behind the HTTPS reverse proxy. The service itself does not terminate
TLS. Keep SQLite on a single service instance with durable backups; migrate to
a shared transactional database before running multiple service instances.

## API

- `GET /ready` verifies Google/session configuration and database access; use it
  for deployment readiness and container health checks.
- `GET /health` — liveness only; no account data.
- `POST /v1/auth/challenge` — create a short-lived OIDC nonce and PKCE challenge.
- `POST /v1/auth/google` — verify the Google ID token and return a one-use Kova
  authorization code.
- `POST /v1/auth/exchange` — redeem the code with its PKCE verifier for a Kova
  session token.
- `GET /v1/me` — read the authenticated account profile.
- `PUT /v1/me/username` — claim or change a globally unique username.
- `DELETE /v1/auth/session` — revoke the current session.
- `DELETE /v1/me` — delete the account and its sessions.

Google tokens are never stored. The stable Google `sub` is the identity key;
email is a mutable contact field. Kova session tokens are random and stored
server-side only as keyed digests.

## Deployment configuration still required

`GOOGLE_CLIENT_ID` is public app configuration, not a secret. The Desktop
client ID is currently set in `apps/desktop/electron/kova-account-config.ts`;
set the same value in the service environment.
`KOVA_ACCOUNT_SESSION_PEPPER` is a deployment secret shared by service
instances. The Kova website can front the hosted service at
`https://kova-agent.neuralstudio.in/api/account`: configure the website's
Vercel `KOVA_ACCOUNT_API_ORIGIN` environment variable with this service's HTTPS
origin. Its Next.js rewrite removes `/api/account` and forwards the remaining
path to this service. Then build Desktop with
`KOVA_ACCOUNT_SERVICE_URL=https://kova-agent.neuralstudio.in/api/account`; the
public URL is embedded in the Electron main bundle. Leave the Desktop URL unset
for builds that should not show account sign-in. The backend host still needs
to be deployed and `/ready` must succeed before enabling account sign-in.

For the Render Blueprint and website proxy steps, see [DEPLOYMENT.md](./DEPLOYMENT.md).
