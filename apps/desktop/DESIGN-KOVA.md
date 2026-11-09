# Kova Design Contract — OpenClaw clone v1

Kova's desktop design language, cloned from **OpenClaw's Control UI design
system** (`ui/docs/design-system/`: README, color-tokens, glass-surfaces,
motion, accessibility) and its chat composer (`ui/src/styles/chat/`), with
the **Codex desktop prompt box** as the reference for the composer itself
(dark filled card, placeholder on top, `+` bottom-left, white round send
bottom-right, env row beneath). The OpenBot clone of this contract is parked
in `DESIGN-KOVA-OPENBOT.md`. Where this file and the legacy Hermes
`DESIGN.md` disagree, this file wins for anything visual.

OpenClaw's system in one paragraph: **dark-first glass** on a deep charcoal
base (`#0e1015`), a **signature red accent** (`#ff5c5c`) used with restraint,
**frosted surfaces instead of solid panels**, depth through layered
backgrounds instead of heavy borders, and **crisp spring motion** (100ms
micro-interactions, 180ms standard, 300ms page-level). Light mode is a warm
paper palette with a terracotta accent. Every text token passes WCAG AA on
its background.

## Philosophy

1. **Glass, not solid.** Surfaces use `backdrop-filter` blur (12px,
   saturate 1.6) over semi-transparent fills. No flat opaque panels in the
   main chrome. Browsers without `backdrop-filter` get the semi-opaque base
   via `@supports` — layout never breaks.
2. **Depth through layering.** The background scale (`--bg` → `--bg-accent`
   → `--bg-elevated` → `--bg-hover`) communicates hierarchy without heavy
   borders. Borders stay at `#1e2028` default, stronger only when active.
3. **Accent with restraint.** Signature red for primary actions only (send,
   active tab, focus ring); teal `#14b8a6` for secondary/status. Never a
   large filled background.
4. **Motion serves meaning.** Animations telegraph state changes — centered
   prompt docks down, composer expands — never decoration alone.
5. **Accessible by default.** Focus-visible rings everywhere, ≥4.5:1 text
   contrast, `prefers-reduced-motion` suppresses all non-essential motion.
6. **Brand is the robot.** The Kova mark (`BrandMark`) in the topbar and
   empty states.

## Tokens (OpenClaw values → Kova token names)

| Use | OpenClaw token | Dark | Light |
|---|---|---|---|
| Page root | `--bg` | `#0e1015` | `#faf9f7` (warm paper) |
| Sidebar / secondary | `--bg-accent` | `#13151b` | `#f4f1ec` |
| Raised / modals | `--bg-elevated` | `#191c24` | `#ffffff` |
| Hover / muted fills | `--bg-hover` | `#1f2330` | `#efebe4` |
| Card / composer fill | `--card` | `#161920` | `#ffffff` |
| Text on cards | `--card-foreground` | `#f0f0f2` | `#211e1a` |
| Body text | `--text` | `#bcbcc0` (~10:1) | — |
| Strong text | `--text-strong` | `#f4f4f5` (~17:1) | — |
| Muted / placeholder | `--muted` | `#8b8b94` (~5.6:1) | — |
| Accent (red) | `--accent` | `#ff5c5c` | `#bd4531` (terracotta) |
| Accent hover / glow | `--accent-hover` / `--accent-glow` | `#ff7070` / 20% red | — |
| Accent 2 (teal) | `--accent-2` | `#14b8a6` | — |
| Borders | `--border` / `--border-strong` | `#1e2028` / `#2e3040` | `#e8e4dc` warm |
| Focus ring | `--ring` | `#ff5c5c` + glow | accent family |

Never raw hex in feature code — always the token. No `--accent-subtle` as
text (fails contrast); no mixing teal and green for success; `--danger` is
for errors only.

## Glass tiers

| Tier | Used for | Value |
|---|---|---|
| 1 — Navigation chrome | topbar, sidebar rail | `bg` at 82% + `blur(12px) saturate(1.6)` |
| 2 — Card / input | composer, modals, popovers | card fill + 1px `--border` + `blur(12px) saturate(1.6)`; popovers 8px, tooltips 14px |

Never nest glass more than 2 levels; never blur beyond 16px outside modal
overlays; always ship the `-webkit-` prefix and the `@supports` fallback.

## Radius & type

- Radii: `10px` (md), `14px` (lg — cards/popovers), composer `20px`,
  menus `16px`, pills `999px`.
- Type: Kova's existing UI stack; headings `text-strong`, body `text`,
  metadata `muted`. Keep the 6-step scale (12–24px) + 32px display.

## Shell

```
┌─────────────────────────────────────────────┐
│  topbar (glass tier 1): logo · tabs · acts  │
├────────┬────────────────────────────────────┤
│ rail   │  transcript (message flow)         │
│ (glass)│                                    │
│        │  ┌──────────────────────────────┐  │
│        │  │  composer (glass tier 2)     │  │
│        │  │  message…                    │  │
│        │  │  [+ attach][model pill] ⬆   │  │
│        │  └──────────────────────────────┘  │
└────────┴────────────────────────────────────┘
```

- Sidebar and topbar are glass tier 1; panes attach beneath the topbar with
  one hairline per panel — no two-level boxes.

## The prompt bar

One glass card — the app's signature.

- **Geometry**: radius `20px`; **solid** card fill (the Codex box is an
  opaque dark card, not translucent glass) + 1px `--border`; soft depth
  shadow only — never a heavy elevation.
- **Focus**: a single accent border — no outer ring or glow. The composer
  must never show two blue lines.
- **Structure (Codex layout, permanent)**: the layout is always stacked —
  the input sits on its own full-width row with the placeholder at the top
  ("Ask anything"), and the controls row sits **below** it inside the same
  card: left `+` attach (28px circle, muted icon), model pill (`999px`,
  soft fill), voice/mic, and at the far right the **white round send**
  (foreground circle, background arrow-up glyph — black-on-white in light,
  white-on-black in dark). Never inline the input between the buttons.
- **Env row**: a quiet text row beneath the card (mode labels left, branch
  right) — the Codex `Local · Worktree · Cloud` / branch line. Kova's
  coding/branch row and the underside strip own this today.
- **States**: busy — send becomes a small square stop glyph on the same
  circle; error — inline `ErrorState`, never a second banner card.
- **Centered → docked (empty state)**: while the chat has no messages, the
  whole dock — hero (BrandMark 40px + title 20px semibold + one muted
  subtitle line) + prompt bar + suggestion chips — sits centered (~46% of
  the surface). The first send slides it to the bottom as one motion
  (300ms, `cubic-bezier(0.4,0,0.2,1)` in-out — it travels A→B) and it
  stays docked. Loading, resume-exhausted, and guided-setup surfaces never
  center. Suggestion chips fill the draft and focus the input; they never
  auto-send.
- **Placeholder**: muted, sentence-case — "Ask Kova anything".

## Chat messages

- Assistant turns are columnar and uncolored; **user bubbles** are `22px`
  radius on the inverted surface, right-aligned, capped width.
- Tool calls are quiet chips (icon + line + duration), expanding into one
  `14px` glass surface — never nested boxes.
- Code blocks: `14px`, one hairline, no inner header boxes.
- Avatar: robot mark for the assistant; initials in soft `999px` chips.

## Buttons & chips

- One `Button` primitive; variants `default`/`secondary`/`outline`/`ghost`.
- Icon controls are circles (28px); text actions are `999px` pills.
- Primary actions use the signature red fill (white text, AA); everything
  else stays neutral.

## Motion

- Scale: fast `100ms` (hover, focus, icon swap), normal `180ms` (menus,
  tabs, input expand), slow `300ms` (sheets, page-level).
- Ease: `cubic-bezier(0.16, 1, 0.3, 1)` out (default), `cubic-bezier(0.4, 0, 0.2, 1)`
  in-out only for point-to-point travel. Never `linear` for enter/exit.
- `prefers-reduced-motion` suppresses everything beyond instant state
  changes (the global reset already owns this).
- Shimmer only via the two shared families (skeleton 2s / text 2.4s); no
  per-surface keyframes; no duration over 500ms for chrome.

## Empty / error / boot

- Empty chat = the centered hero above (avatar + title + one muted line).
- Loader = math curves; never literal "Loading…".
- Error = `ErrorState` + `ErrorIcon`; one recovery action, honest copy.

## Iconography & imagery

- Tabler for chrome, Codicon for editor/tool/status vocabulary, Kova mark
  for brand moments (stroke 2 at 16px).
- The shared Kova robot only — no generated hero art.

## Checklist before shipping a change

- [ ] Glass tier correct (nav = tier 1, card/input = tier 2), `@supports` fallback present
- [ ] Prompt bar reads as one solid card (input row on top, `+` bottom-left,
      white round send bottom-right, env row beneath)
- [ ] Tokens, never literals; `Button` only; no one-off radii/shadows
- [ ] Renders in light *and* dark without repapering (warm paper + terracotta in light)
- [ ] Locale strings in `en` (other locales fall back)
- [ ] Focus shows one accent border only (never a double line)
- [ ] Library icons only (Tabler/Codicon), brand mark only for brand moments
