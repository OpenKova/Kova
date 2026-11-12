# Deploy Kova Account

This deploys the account API as a single Render web service with a persistent
disk for SQLite. The service must stay on one instance; SQLite is not shared
across instances. The generated Render URL is used only as the upstream for the
existing Kova website proxy.

## 1. Create the service

In Render, create a Blueprint from the `OpenKova/Kova` repository and select
`render.yaml`. The blueprint configures the Docker service, `/ready` health
check, 1 GB persistent disk, Google Desktop client ID, and a generated session
pepper. Wait until `/ready` reports `{"status":"ready"}`. Keep the service at
one instance and retain the disk when deploying new versions.

The Google OAuth client must be an **OAuth client ID of type Desktop app**.
The app uses loopback PKCE, requests only `openid email profile`, and does not
use a client secret. The secret previously shared in chat is not required and
must not be added to the repository or deployment environment.

## 2. Connect the existing website domain

In the Vercel project for `Kova-LandingPage`, add this environment variable for
Production (and Preview if desired):

```text
KOVA_ACCOUNT_API_ORIGIN=https://<your-kova-account-service>.onrender.com
```

Redeploy the site. It will forward `/api/account/*` to the service while keeping
the public API on the existing site domain:

```text
https://kova-agent.neuralstudio.in/api/account/ready
```

Do not include `/api/account` in `KOVA_ACCOUNT_API_ORIGIN`; the site rewrite
adds the remaining path itself.

## 3. Enable the Desktop client

Build the Desktop release with this public build-time variable:

```text
KOVA_ACCOUNT_SERVICE_URL=https://kova-agent.neuralstudio.in/api/account
```

The URL is embedded in the Electron main process bundle. It is not a runtime
setting and the app should not be released with it until the public `/ready`
check succeeds.

## Operations

- Keep one service instance and keep the persistent disk attached; backups are
  still required for account and username recovery.
- The public endpoints need rate limiting at the ingress for
  `/v1/auth/challenge`, `/v1/auth/google`, and `/v1/auth/exchange` before broad
  release. The service intentionally has no permissive CORS policy; Desktop
  requests originate from Electron.
- Rotate `KOVA_ACCOUNT_SESSION_PEPPER` only with a planned session reset; old
  session tokens will no longer validate.
- Monitor `/health` for process liveness and `/ready` for configuration and
  database readiness.
