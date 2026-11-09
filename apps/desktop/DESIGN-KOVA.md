# Kova Design Contract — Demo v1

A design contract for the **Kova** desktop app. It replaces the
flat-and-boxed feel of the upstream Hermes UI with a **soft,
ambient, floating** language in the spirit of Codex, OpenAI's
agents, Linear and the browser-native Claude/Codex chats — rounded
cards, floating pill controls, one elevated prompt bar, generous
whitespace, and a single kind shadow. Where this file and
`DESIGN.md` disagree, this file wins for anything visual.

## Philosophy

1. **Prompt-first.** The transcript + prompt bar are the product.
   Everything else (previews, files, review, terminal) is attached
   context reached from the conversation, never a competing page.
2. **Soft geometry everywhere.** Cards clip at `rounded-[28px]`;
   bubbles, chips, tool rows and buttons are fully round where they
   can be. Nothing in the app reads as a clipped rectangle except
   the window itself.
3. **Floating, not boxed.** The composer, tool rows, status cards
   and menus float above the transcript with `shadow-nous` and a
   hairline ring — never a framed tile with inner boxes.
4. **Light by default, calm in dark.** Off-white surfaces, near-black
   ink; dark mode is the same surfaces lifted one step, never pure
   black tiles.
5. **Brand is the robot.** One brand mark — the Kova robot,
   black on white / white on `#0d1117` (see `BrandMark`) — in the
   topbar, empty states and the onboarding hero. No decorative
   sparkles, no old Hermes glyphs.

## Tokens

Prefer tokens; never raw hex in feature code.

| Use | Token |
|---|---|
| App background | `--ui-bg-*` ladder (off-white → white in light) |
| Surface fill | `--composer-fill` (one shared value: composer + dock + popovers) |
| Hairline ring | `--dt-composer-ring` at ~14% strength (state ladder in `styles.css`) |
| Text | `--ui-text-primary` / `-secondary` / `-tertiary` |
| Accent | `--ui-accent` / `--theme-primary` |
| Overlay elevation | `--shadow-nous` + `--stroke-nous` hairline; menus `shadow-md` |
| Selection/focus | control ring tokens; never kill the focus outline |

## Radius & shadow scales

| Surface | Radius |
|---|---|
| Prompt bar, floating cards, popovers | `rounded-[28px]` (popovers `rounded-3xl`) |
| Dialogs / overlays | `rounded-[24px]` |
| Bubbles, inputs, menus | `rounded-full` for pills + icon bubbles; `rounded-2xl` for short messages |
| Small rows/tool calls | `rounded-xl` max — never a square tile |

Shadow is layered and warm: contact → ambient falloff. Only floats
get shadow; inline content stays flat.

## Shell layout

```
┌─────────────────────────────────────────────┐
│  topbar: logo · tabs · actions              │
├────────┬────────────────────────────────────┤
│ rail   │  transcript (message flow)         │
│        │                                    │
│        │  ┌──────────────────────────────┐  │
│        │  │  prompt bar (floating card)  │  │
│        │  │  message…                    │  │
│        │  │  [+ attach][model pill] ⬆   │  │
│        │  └──────────────────────────────┘  │
└────────┴────────────────────────────────────┘
```

- Sidebar is a quiet rail (list rows, no bordered cards).
- Transcript is the composition wall; sticky user prompt docks at the
  bottom inside the floating prompt card, never a separate band.
- Panes (preview/files/review/terminal) attach beneath the topbar,
  one hairline per panel, content padded — no two-level boxes.

## The prompt bar (message box)

One floating rounded card — the app's signature.

- **Radius**: `rounded-[28px]`; elevation `shadow-[0_16px_48px_-16px_rgba(0,0,0,0.28),0_4px_16px_-8px_rgba(0,0,0,0.12)]`;
  ring: `border border-[color-mix(in_srgb,var(--dt-composer-ring)_calc(14%*var(--composer-ring-strength)),var(--dt-input))]`.
- **Structure**: message text at top full-bleed; a single control row
  inside the bottom edge — left: `+` attach (ghost icon bubble),
  center: model pill (`rounded-full`, soft fill), right: round
  send (foreground-on-background circle, arrow-up glyph). Voice/mic
  sits left of send as an icon bubble. No second row of chrome.
- **Queue/edit banners** become `rounded-full` strips that dissolve
  into the card edge; approvals render as `CardStack` above it.
- **States**: focused — ring strengthens + shell shadow deepens;
  busy — send becomes a small square stop glyph on the same circle;
  error — inline `ErrorState`, never a second banner card.
- **Entrance**: fades/scales in over ~150 ms; typing never re-paints
  heavy chrome (keep backdrop blur off the hot surface).
- **Placeholder**: muted, sentence-case — "Ask Kova anything".
- **Centered → docked (empty state)**: while the chat has no messages, the whole
  dock — hero (BrandMark + heading + subtitle), prompt bar, suggestion chips —
  sits centered at ~46% of the surface (Codex/OpenClaw new-chat). The first
  send slides it down to the bottom as one motion (top/transform, 300 ms,
  `motion-reduce` off) and it stays docked for the conversation. Loading,
  resume-exhausted, and guided-setup surfaces never center. Suggestion chips
  fill the draft and focus the input; they never auto-send.

## Chat messages

- Assistant turns are columnar and uncolored; **user bubbles** are
  `rounded-[24px_24px_24px_8px]` on the soft control fill, right-aligned,
  width capped to the measure — a bubble, never a box.
- Tool calls are quiet chips (icon + line + duration), expanding in
  place into a single `rounded-2xl` surface — never nested boxes.
- Code blocks: `rounded-2xl`, one hairline, no inner boxes for headers.
- Avatar: the robot mark for the assistant's first letter only;
  otherwise initials in soft `rounded-full` chips.

## Buttons & chips

- One `Button` primitive; variants `default`/`secondary`/`outline`/`ghost`/`floating`.
- Icon controls `rounded-full`; text actions `rounded-full` pills. Text buttons
  stay flush/inline only inside sentences.
- Tooltips: `<Tip>` only for discovery; kebabs and close X get `aria-label` only.

## Motion

- 100–200 ms functional fades; controls paint on hover instantly and
  ease only on return. `prefers-reduced-motion` disables beyond fades.
- Transcript streams without layout jumps; cards settle upward (220 ms).
- No `transition-all` on hot interactions.

## Empty / error / boot

- Loader = math curves (`lemniscate-bloom` for long ops); never literal
  "Loading…".
- Error = `ErrorState` + `ErrorIcon`; onboarding/boot/reauth each get a
  dedicated, calm state with one recovery action and honest copy.

## Iconography

- **Tabler** for chrome, **Codicon** for the editor/tool/status vocabulary,
  the **Kova mark** (`BrandMark`) for brand moments. No third icon set appears.
- Every icon action has an `aria-label`; icon glyphs inherit `size-*` from the primitive.

## Imagery

- The shared Kova robot (`kova-logo*.png/.svg`, `brand-mark.tsx`) only —
  no generated "hero" art, no stock star fields, no ORB gradients beyond the
  app's own ambient tint (`--ui-bg` + accent at reduced strength).

## Checklist before shipping a change

- [ ] One card, one radius, one shadow — nothing rectangular left
- [ ] Prompt bar reads as one floating object (input + row + send inside)
- [ ] Tokens, never literals; `Button` only; no className radius/shadow overrides
- [ ] Renders in light *and* dark without repapering
- [ ] Locale strings updated (`en`, `de`, `fr`, `es`, `ar`, `ru`)
- [ ] Hover/press feedback paints in the same frame; reduced-motion respected
- [ ] Library icons only (Tabler/Codicon), no new set; brand mark only for brand moments
