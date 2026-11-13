# Kova Account Service

First-party identity/profile service for Kova Desktop. It stores the Google
identity, unique username, and revocable Kova sessions. It does not store chats,
agent profiles, provider credentials, Gmail data, or gateway secrets.

## Local development

Run `uvicorn app:app --app-dir services/kova-account --host 127.0.0.1 --port 8787`.
For local development, the service uses SQLite at `DATABASE_PATH` by default.
To use Supabase Postgres, set `DATABASE_URL` to the project's pooled Postgres
connection string. `DATABASE_URL` takes precedence over `DATABASE_PATH`.
Configure `GOOGLE_CLIENT_ID` with the same Google OAuth Desktop client ID used
by Kova Desktop, and `KOVA_ACCOUNT_SESSION_PEPPER` with a random deployment
secret of at least 32 bytes. Do not expose the development server to the
network. Production requires HTTPS and a trusted reverse proxy. The API applies
per-client limits to sign-in endpoints; the reverse proxy must supply a
verified `CF-Connecting-IP` header.

Build the container from the repository root with
`docker build -f services/kova-account/Dockerfile -t kova-account .`. Configure
`DATABASE_URL`, `GOOGLE_CLIENT_ID`, and `KOVA_ACCOUNT_SESSION_PEPPER`, then
publish it only behind the HTTPS reverse proxy. Keep `DATABASE_URL` and the
session pepper in server-side environment variables; never put them in the
Desktop build or commit them to the repository.

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

## Deployment configuration

`GOOGLE_CLIENT_ID` is public app configuration, not a secret. The Desktop
client ID is currently set in `apps/desktop/electron/kova-account-config.ts`;
set the same value in the service environment.
`KOVA_ACCOUNT_SESSION_PEPPER` is a deployment secret shared by service
instances. Set Desktop's `KOVA_ACCOUNT_SERVICE_URL` to the account API's HTTPS
URL; it is embedded in the Electron main bundle. Leave it unset for builds
that should not show account sign-in. Deploy the service and confirm `/ready`
succeeds before enabling sign-in in a Desktop release.

For the Vercel and Supabase deployment steps, see [DEPLOYMENT.md](./DEPLOYMENT.md).
