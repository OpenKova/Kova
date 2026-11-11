# Kova — Project Status

_Last updated: 2026-11-11 · branch `main` @ `a6393d63` · working tree clean_

## 1. What Kova is

Kova is a desktop AI agent built by **Neural Studio**, forked from the Hermes
Agent codebase (`OpenKova/Kova`). The product is a local-first agent runtime
(Python CLI + gateway) with an Electron desktop shell: sessions, tools,
skills, MCP servers, cron/routines, and multi-platform **Channels**.

Identity is centralized in `apps/desktop/product-identity.cjs`
(`appId: com.openkova.kova`, protocol `kova://`, install dir
`%LOCALAPPDATA%\kova`). The Windows installer is a distinct app id, so it can
be installed alongside the original Hermes build without collisions.

The agent's system prompt is:

> You are Kova Agent, built by Neural Studio.

…followed by direct-style rules (answer first, no filler, no restating the
question). Remaining `hermes_*` cookie/wire names, model IDs, and upstream
plugin-catalog URLs are intentional compatibility contracts, not branding.

## 2. What this workstream is

A full visual and product rebrand of the desktop app into a **Codex / OpenClaw**
style, plus repo slimming and CI reduction. No release has been cut yet; all
work lands on `main` in small, tested commits.

Design contracts:

- `apps/desktop/DESIGN-KOVA.md` — **active** contract: OpenClaw design
  system (glass, red accent, motion) with the **Codex prompt box** as the
  composer reference.
- `apps/desktop/DESIGN-KOVA-OPENBOT.md` — parked clone of the OpenBot look,
  kept for reference only.

Ground rules followed throughout:

- Batch autonomously; keep changes consistent with surrounding code patterns.
- Free-tier CI only, repo kept slim (6 workflows).
- No Hermes visual traces except intentional contracts.
- Tell the user what a doc will say before writing it.

## 3. Done

### Brand, identity, packaging
- Complete Kova rebrand: name, icons, Kova robot logo, window titles, menus,
  installers, docs, attribution to Neural Studio.
- `product-identity.cjs` as the single identity source; `kova://` protocol;
  Windows installer coexists with Hermes.
- OpenRouter attribution corrected.
- Slim single-snapshot git history; CI reduced to 6 workflows
  (JS Tests, Lint, Repository guards, Rust tests, OS-specific tests, Tests).

### Design system
- Themes reduced to **Mono (default)** + **GitHub**; Mono is
  `DEFAULT_SKIN_NAME` (`4371e99d`). 125 theme tests + web tests pass.
- Global menu surface (`components/ui/menu.ts`) unified: solid `--dt-card`,
  16px radius, hairline border, soft shadow (`0e95522f`).

### Composer / prompt box
- Centered empty state via `shouldCenterComposer`, hero + suggestion chips in
  the composer dock, 300ms slide to bottom on first send.
- Codex prompt box: permanent stacked layout (input row above controls),
  solid card, 20px radius, white round send, inset ~1in per side
  (`706e6a5b`), borderless surface with shadow only (`16ee5ac8`).
- Attach (`+`) menu restyled solid 20px card (`9fb83afb`).
- Approval pill moved into the composer, right of `+`; statusbar chip removed.
  Modes renamed Codex-style: **Ask for approval / Approve for me / Full access**
  (`de68f129`).
- Reasoning menu replaced by a 7-stop slider popover (minimal → ultra)
  (`de68f129`).

### Sidebar and shell
- Codex-style threads list: flat nav rows, single active pill, no chat tab
  strip, ⌘T still opens a tab (`2a197435`, `0dc37ace`).
- Search icon lives in the **SESSIONS** header and filters sessions for real.
- Removed: top session switcher, `+` before session names, duplicate `+`
  new-session icon, full search bar, status dots on session names, layout
  editor, swap-sidebars feature/button (`16ee5ac8` — 702 lines removed;
  632 sidebar/pane-shell tests pass).
- Command center: Sessions section removed (`63dc6952`).

### Messages and palettes
- Codex-style user bubbles pulled off the right edge, hover action bar,
  pencil-based inline edit (`73be76a3`, `58037bc6`).
- Agent-message action options sit left/below the message.
- Slash palette restored to Codex geometry: full prompt-bar width, no `/`
  prefix inside menu rows (`c5e78469`, `f01b71d6`).
- ⌘K palette kept as the single command surface.

### Channels (formerly Messaging)
- Renamed to **Channels** in all 9 locales; card grid replaced by a setup
  popup dialog (`PlatformDetail` + `PlatformActionBar`) (`0e95522f`,
  `de68f129`). Messaging tests 15/15.

### Integrations / Gmail path
- Audited Kova against OpenBot's Gmail stack; confirmed already present:
  native `google-workspace` skill (read/search/draft/send), MCP OAuth 2.1
  client (PKCE/refresh/device-code), Composio + Gmail catalog plugins,
  `important-mail` and morning-brief cron blueprints, webhook → cron fire,
  and `antigravity-oauth` for Gemini-via-Google-sign-in.
- Shipped **Composio MCP preset** (Gmail + ~1000 apps) with header-key auth:
  `_MCP_PRESETS["composio"]`, header templating in `_apply_mcp_preset`,
  `_configure_preset_headers` prompting and persisting
  `MCP_COMPOSIO_API_KEY` to `.env`, example config, new test
  (`a6393d63`; 42/42 in `tests/kova_cli/test_mcp_config.py`).

### Data recovery
- Recovered a malformed `state.db` via `kova sessions recover` on a temp copy
  (4 sessions / 20 messages); damaged original retained as backup; gateway
  verified clean afterward.

## 4. In flight

- [ ] Relaunch the dev app and do a fresh visual pass on the current UI
      (last `pnpm --filter kova run dev` exited 1 — see gotchas).
- [ ] Optional: capture screenshots for the design contract / README.
- [ ] Optional: note the Composio preset in user-facing MCP docs.
- [ ] Release is intentionally deferred; no tag, no installer publish yet.

## 5. Known issues and gotchas

- **HMR is unreliable** for composer/titlebar edits. It produced
  `ReferenceError: ApprovalPill is not defined` and
  `useModifierHeld is not defined`, then `dev:renderer exited 1`. Always do a
  full relaunch after touching those files.
- **Stale-code 503**: if the gateway reports
  `Restart required: This process is running code from <old> but the checkout
  on disk is now <new>`, kill the Python process whose command line matches
  `gateway run`; Electron relaunches it.
- **`python` is not on PATH** here. Use `py` or
  `.venv\Scripts\python.exe`. Run pytest directly:
  `.venv\Scripts\python.exe -m pytest <path> -q`
  (`scripts/run_tests.sh` fails on this box: bash/CRLF).
- **Node 26 required** (`engines >=26`). Use the portable build at
  `%TEMP%\opencode\node26\node-v26.9.0-win-x64`; `tsc` needs
  `NODE_OPTIONS=--max-old-space-size=8192`.
- **MSIX virtualization**: Kova home is `%LOCALAPPDATA%\kova`, but a shadow
  copy may exist under
  `...\Packages\PythonSoftwareFoundation.Python.3.11_*\LocalCache\Local\kova`.
  Verify a DB by copying it to temp first.
- **DB recovery**: stop the gateway, then
  `kova sessions recover --source <state.db> --inspect-only`, then
  `--output recovered-state.db`. Never run `sqlite3 .recover` on a live DB.
- **Do not invent Google MCP endpoints.** OpenBot's Google path is per-user
  pasted MCP URLs, not a shipped preset; Kova uses the native skill plus
  Composio.
- **Pre-existing lint noise** (not introduced here): import-order in
  `sidebar/index.tsx` and `chat/index.tsx`, exhaustive-deps warnings in
  `use-statusbar-items.tsx`.
- **Intentional legacy names**: `hermes_session*` cookies, model IDs
  (`hermes-4` etc.), upstream plugin-catalog URLs.

## 6. How to run

```powershell
# from the repo root
$env:PATH = "$env:TEMP\opencode\node26\node-v26.9.0-win-x64;$env:PATH"
$env:PATH = "C:\Users\chira\hermes-agent-stable\.venv\Scripts;$env:PATH"

pnpm install --frozen-lockfile
pnpm --filter kova run dev      # renderer + electron
```

Tests:

```powershell
.venv\Scripts\python.exe -m pytest tests\kova_cli -q
pnpm --filter kova test
pnpm --filter kova run check
```

Other entry points: `py run_agent.py --help` (CLI), `kova` (installed CLI),
`apps/web` (web UI), `apps/tui` (terminal UI).

## 7. Commit log (last 10)

| Commit | Summary |
|---|---|
| `a6393d63` | feat(mcp): Composio preset (Gmail + 1000 apps) with header-key auth |
| `63dc6952` | rebrand(ui): remove Sessions section from command center |
| `16ee5ac8` | rebrand(ui): borderless composer, approval by plus, no tabs, no layout editor or swap, search in Sessions |
| `f01b71d6` | rebrand(ui): slash palette Codex width, full prompt bar match |
| `c5e78469` | rebrand(ui): restore slash names, cap prompt dock at 46rem Codex width |
| `0dc37ace` | rebrand(ui): Codex sidebar slash names, session dots, tab plus, search icon |
| `58037bc6` | rebrand(ui): pull user bubble off right edge, left-align assistant action bar |
| `73be76a3` | rebrand(ui): Codex-style user bubbles with hover actions and edit footer |
| `de68f129` | rebrand(ui): Channels rename, approval pill in composer, reasoning slider |
| `0e95522f` | rebrand(ui): rename sidebar items, Messaging card grid + setup popup, Kova menus everywhere |

All commits above are pushed to `origin/main`.
