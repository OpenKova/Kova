# Kova Design Contract — OpenBot clone v1

Kova's desktop design language, cloned from **OpenBot** (`nightly-labs/openbot`,
`packages/brand/src/tokens.css` + `tokens-light.css`, desktop renderer in
`src/renderer`, shared UI in `packages/ui`). Where this file and the legacy
Hermes `DESIGN.md` disagree, this file wins for anything visual.

OpenBot's system in one paragraph: a dark-first **neutral** palette (near-black
canvas, one step lighter surfaces), **hairline borders you can barely see**,
**flat cards with no shadow** (shadow only on overlays), a single **hue-210
blue accent**, **Inter** in six type steps, small radii (12px cards, 22px
bubbles), instant hover paint (0ms enter), and short 120–240ms motion on one
ease. Light mode is the same system inverted — raised surfaces lighter than
the canvas, borders as translucent ink. Focus is **neutral grey, never a blue
halo**.

## Philosophy

1. **Prompt-first.** The transcript + prompt bar are the product.
2. **Flat, neutral, quiet.** Surfaces differ by fill step (#1a1a1a → #212121
   → #242424), not by borders or shadows. A card casts no shadow; only
   overlays (menus, dialogs) lift.
3. **One accent.** Hue-210 blue `#007cf7` for actions/links; status colors
   (green/amber/red) only for status.
4. **Brand is the robot.** The Kova mark (`BrandMark`) in the topbar and empty
   states. No decorative sparkles.
5. **Dark-first, light-correct.** Every token has a light value with AA
   contrast; dark values never leak into light surfaces.

## Tokens (OpenBot values → Kova token names)

| Use | Kova token | Dark | Light |
|---|---|---|---|
| Canvas | `--ui-bg-*` ladder | `#1a1a1a` | `#f5f5f6` |
| Window frame (darker than the card) | `--ui-bg-chrome` | `#0d0d0d` | `#e8e8eb` |
| Surface / raised | `--dt-card` | `#212121` / `#242424` | `#ffffff` / `#fcfcfc` |
| Control / hover / active | `--ui-control-*` | `#212121` / `#242424` / `#2a2a2a` | `#ffffff` / `#f0f0f2` / `#e8e8eb` |
| Hairline border | `--dt-input` / `--ui-stroke-*` | `rgba(255,255,255,0.035)` (strong 0.045) | `rgba(20,20,20,0.07)` (strong 0.10) |
| Text primary / secondary / muted / dim | `--ui-text-*` | `#ffffff` / `#dcdcdc` / `#979797` / `#6a6a6a` | `#141414` / `#3a3a3c` / `#6b6b70` / `#8e8e93` |
| Placeholder | — | `#bfbfbf` | `#5c5c61` |
| Accent / hover / text | `--ui-accent` family | `#007cf7` / `#1f8fff` / `#42a0ff` | `#007cf7` / `#006ad4` / `#0064c8` |
| Focus border | — | `--openbot-text-dim` grey | grey |
| Success / warning / danger | status tokens | `#31cf76` / `#ff9412` / `#fd2f3b` | `#1fa85a` / `#f08a00` / `#e8222d` |

Never raw hex in feature code — always the token. No drop shadows on cards in
either theme (in light they read as a halo; raised surfaces keep a 1px ring).

## Type scale (Inter; six steps, paired leading)

`12/16 · 13/18 · 14/20 · 16/22 · 18/24 · 24/30`, display `32/38` for empty
states and full-bleed screens. Weights 400/500/600/700; headings tighten
(`-0.01em` at display size). Mono: ui-monospace stack.

## Radius, controls, icons

| Surface | Radius |
|---|---|
| Cards, composer, panels | `12px` (OpenBot `radius-lg`) |
| Popovers/menus | `12px` |
| Dialogs | `30px` modal — Kova dialogs keep `rounded-[24px]` until migrated |
| Bubbles | `22px` |
| Pills, icon buttons, chips | `999px` |

Controls: 24 / 28 / 32 / 36 / 40px steps. Icons: stroke 2 at 16px, 1.5 at
≥18px (Kova keeps Tabler/Codicon; the weight rule is the clone, not the
library). Scrollbar 8px.

## Shell

```
┌─────────────────────────────────────────────┐
│  topbar: logo · tabs · actions              │
├────────┬────────────────────────────────────┤
│ rail   │  transcript (message flow)         │
│        │  ┌──────────────────────────────┐  │
│        │  │  prompt bar (flat card)      │  │
│        │  │  message…                    │  │
│        │  │  [+ attach][model pill] ⬆   │  │
│        │  └──────────────────────────────┘  │
└────────┴────────────────────────────────────┘
```

- Sidebar is a quiet rail (list rows, no bordered cards).
- Panes attach beneath the topbar, one hairline per panel — no two-level boxes.

## The prompt bar

One flat card — no shadow, ever.

- **Geometry**: `border-[0.5px]` hairline; radius `12px`; fill = surface step;
  padding 10px; grows from a ~96px resting height with the eased resize curve.
- **Focus**: border goes dim grey + a 3px soft ring (hover-fill token) — never
  blue, never a halo.
- **Structure**: message text at top full-bleed; one control row inside the
  bottom edge — left: `+` attach (28px circle, muted icon), center: model pill
  (`rounded-full`), right: round send (inverted surface circle, arrow-up).
  Voice/mic left of send as a 28px circle.
- **States**: busy — send becomes a small square stop glyph on the same
  circle; error — inline `ErrorState`, never a second banner card.
- **Centered → docked (empty state)**: while the chat has no messages, the
  whole dock — hero (BrandMark 64px + title 32px semibold + subtitle 16px
  muted, max 30rem) + prompt bar + suggestion chips — sits centered (~46% of
  the surface). The first send slides it to the bottom as one motion
  (240ms, `cubic-bezier(0.23,1,0.32,1)`, `motion-reduce` off) and it stays
  docked. Loading, resume-exhausted, and guided-setup surfaces never center.
  Suggestion chips fill the draft and focus the input; they never auto-send.
- **Placeholder**: muted, sentence-case — "Ask Kova anything".

## Chat messages

- Assistant turns are columnar and uncolored; **user bubbles** are `22px`
  radius on the inverted surface (`surface-light`), right-aligned, capped
  width — a bubble, never a box.
- Tool calls are quiet chips (icon + line + duration), expanding in place into
  one `12px` surface — never nested boxes.
- Code blocks: `12px`, one hairline, no inner header boxes.
- Avatar: robot mark for the assistant; initials in soft `999px` chips.

## Buttons & chips

- One `Button` primitive; variants `default`/`secondary`/`outline`/`ghost`.
- Icon controls are circles (28px default); text actions are `999px` pills.
- Tooltips name the control; kebabs and close X get `aria-label` only.

## Motion

- Hover paints **instantly** (0ms enter); returns ease out.
- Durations: fast 120ms, normal 160ms, slow 200ms, overlay 240ms.
- Ease: `cubic-bezier(0.23, 1, 0.32, 1)` out; `cubic-bezier(0.77, 0, 0.175, 1)`
  in-out. No `transition-all` on hot interactions.
- Transcript streams without layout jumps; `prefers-reduced-motion` kills
  everything beyond fades.

## Empty / error / boot

- Empty chat = the centered hero above (avatar + title + one muted line).
- Loader = math curves; never literal "Loading…".
- Error = `ErrorState` + `ErrorIcon`; one recovery action, honest copy.

## Iconography & imagery

- Tabler for chrome, Codicon for editor/tool/status vocabulary, Kova mark for
  brand moments. Icon stroke 2 at 16px (1.5 at ≥18px).
- The shared Kova robot only — no generated hero art, no gradients beyond the
  app's own ambient tint.

## Checklist before shipping a change

- [ ] Flat card: no shadow, 0.5px hairline, 12px radius
- [ ] Prompt bar reads as one flat object (input + row + send inside)
- [ ] Tokens, never literals; `Button` only; no one-off radii/shadows
- [ ] Renders in light *and* dark without repapering
- [ ] Locale strings updated (`en` source; other locales fall back)
- [ ] Hover paints in the same frame; reduced-motion respected
- [ ] Library icons only (Tabler/Codicon), stroke-weight rule kept
