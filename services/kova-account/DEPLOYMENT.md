# Deploy the Kova Account API

The API runs as a Python FastAPI function on Vercel and stores account data in
Supabase Postgres. The Desktop app continues to use Google's native OAuth flow;
Supabase is only the database.

## 1. Create the Supabase database

Create a Supabase project on the Free plan. In Project Settings → Database,
copy the transaction-pooler connection string. Keep it private; it contains the
database password. The API creates its account tables on first use.

## 2. Deploy the API to Vercel

Create a Vercel project connected to the `OpenKova/Kova` repository. Set its
Root Directory to `services/kova-account`; leave the build command and output
directory at their defaults so Vercel detects `app.py` as FastAPI.

Add these Production environment variables to that Vercel project:

- `DATABASE_URL`: the Supabase transaction-pooler connection string.
- `GOOGLE_CLIENT_ID`: the same Google OAuth Desktop client ID used by Kova.
- `GOOGLE_CLIENT_SECRET`: the matching OAuth client secret. Mark it sensitive;
  only the API uses it to exchange desktop authorization codes with Google.
- `KOVA_ACCOUNT_SESSION_PEPPER`: a generated random value with at least 32 bytes.
- `PUBLIC_BASE_URL`: `https://telemetry.neuralstudio.in`.
- `CRON_SECRET`: a separate random secret used to authorize daily retention cleanup.
- `ADMIN_DASHBOARD_PASSWORD`: a random password of at least 32 characters for
  the HTTPS-only private dashboard at `/admin` (username `admin`). Keep it in a
  password manager; it grants access to support-bundle downloads.

Deploy and confirm `/ready` returns `{"status":"ready"}`. The API creates
tables in the Supabase `public` schema. Do not use Supabase's `service_role`
key; the API connects with the Postgres connection string held only in Vercel.
The Vercel cron in this service deletes expired diagnostics bundles daily and
metrics packages older than 90 days.

The `x-vercel-forwarded-for` request header is trusted only on Vercel requests
(identified by Vercel's `x-vercel-id` header) for per-client authentication
rate limits. Vercel documents that it overwrites the forwarded IP header at its
edge to prevent spoofing.

## 3. Attach the telemetry subdomain

The Vercel project has `telemetry.neuralstudio.in` attached and its
`/ready` endpoint is live. The authoritative nameservers are Cloudflare
(`angelina.ns.cloudflare.com` and `yoxall.ns.cloudflare.com`); the existing
DNS setup already routes this hostname to Vercel, so no record change is
needed now.

If the route stops resolving, open **neuralstudio.in → DNS → Records** in
Cloudflare and check the `telemetry` record against the target Vercel shows
under **Settings → Domains**. Vercel's current recommendation is a CNAME to
`dc1be7e0b0a16fc8.vercel-dns-017.com` with proxy status **DNS only** (grey
cloud). Edit an existing explicit `telemetry` record instead of adding a
conflicting one.

## 4. Point the Desktop build to the API

Set `KOVA_ACCOUNT_SERVICE_URL` at Desktop build time to the API's Vercel
Production URL, for example `https://kova-account-<your-scope>.vercel.app`.
The URL is embedded in the Electron main process bundle. `/ready` must succeed
before enabling account sign-in in a release.

The landing page's `/account` information route does not proxy API traffic.
The desktop talks directly to this API endpoint, so it can use Vercel's
verified client IP for rate limiting.

## Operations

- Free Supabase projects can pause after a week of low activity and do not
  include automatic backups. This is suitable for a prototype or small beta;
  export or back up account data before relying on it for production users.
- Keep `DATABASE_URL`, `GOOGLE_CLIENT_SECRET`, and `KOVA_ACCOUNT_SESSION_PEPPER` in Vercel's server-side
  environment variables. Never put them in Desktop build configuration or Git.
- Rotating `KOVA_ACCOUNT_SESSION_PEPPER` invalidates existing Kova sessions.
- `GET /health` is process liveness; `GET /ready` verifies database and auth
  configuration.
