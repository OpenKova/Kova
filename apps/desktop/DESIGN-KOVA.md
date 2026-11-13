# Kova Desktop Design System

This is the visual and interaction contract for Kova Desktop and Kova Setup.
Kova takes cues from the clarity of Codex and the quiet, neutral surfaces in
OpenBot, then uses its own layout, marks, labels, motion, and color. These are
references for principles, not templates to copy. This file is the authority;
the legacy `DESIGN.md` and `DESIGN-KOVA-OPENBOT.md` are not implementation
specifications.

## Product feel

- **Work first.** Conversations, files, projects, and controls should read as
  one working environment. Keep the current task visually dominant.
- **Quiet surfaces.** Use a graphite/slate neutral ladder with small fill
  changes and occasional hairlines. Cards stay flat; reserve depth for menus,
  dialogs, and other overlays.
- **One Kova accent.** Use the current Kova accent token for primary actions,
  selected navigation, and focus. Status colors communicate status only.
- **Kova owns its identity.** Use the Kova mark at product entry points and
  empty states. Do not use Hermes names, Hermes marks, the legacy Collapse
  wordmark treatment, oversized all-caps brand lettering, or borrowed product
  artwork as interface decoration.
- **Readable before dramatic.** Use the application sans-serif stack for
  interface copy. Reserve mono for code, paths, and technical output. No
  display treatment should compete with a conversation or composer.

## Color and surfaces

- Use the shipped Kova `--ui-*` and `--dt-*` tokens. Do not add raw hex values
  to feature components or create a second palette for one screen.
- Dark mode uses a near-black neutral canvas, one gently raised sidebar, and
  slightly lighter controls. Light mode uses a soft neutral canvas and clear
  text contrast; it is not a recolored dark mockup.
- Borders are subtle separators, not card outlines. Avoid nested cards,
  repeated inset borders, glass blur, glow, and large colored blocks.
- Use 12px for contained surfaces and 20–22px for the prompt composer. Pills
  are reserved for compact values and statuses, not every text button.
- Every text/control combination must meet WCAG AA. Focus is visible in both
  themes and remains distinct from hover/selection.

## Navigation and workspace

- Keep the global navigation persistent and make the current workspace
  explicit. **Sessions** and **Bots** must each have a clear route back to the
  other; never make the user infer that a home glyph changes workspaces.
- The left sidebar is a navigation and session rail, not a stack of boxed
  panels. Keep primary actions close to the list they affect.
- Settings are a workspace with a stable title, clear section navigation,
  search when useful, and an obvious route back. Do not make settings cover
  the whole app in a modal popup.
- Keep project identity visible when a conversation belongs to a project.
  Put project context and related actions in the workspace header or rail.
- Avoid duplicate navigation: a feature that has a sidebar list should not
  repeat the same list in the central conversation area.

## Conversation and composer

- The transcript owns the main canvas. User and assistant turns remain easy to
  distinguish without enclosing every message in a card.
- The composer is a stable, bottom-anchored work surface for existing chats.
  On a genuinely new draft, a small helpful prompt may sit above it; do not
  layer a second empty-state hero over a bot, project, or conversation identity.
- Keep controls grouped by task: attach/context on the left; model and
  reasoning near the input; send/stop at the right. Give every icon-only
  action an accessible name and tooltip.
- Empty states belong to the surface they describe. A bot empty state owns its
  avatar/name; the generic new-chat welcome must not show behind it.
- Streaming, loading, and errors are separate states. Loading should not look
  like a frozen screen; errors should say what failed and provide a recovery
  action without adding a second competing card.

## Controls and motion

- Reuse Kova's shared button, input, menu, and dialog primitives. Feature code
  should choose a semantic variant instead of rebuilding control chrome.
- Text actions use readable labels. Keep icon buttons compact, aligned, and
  close to a 32px target; hover backgrounds follow the control shape rather
  than painting a large square.
- Use short motion only to clarify a state transition. Hover/press feedback is
  immediate; panels and menus settle quickly. Honor `prefers-reduced-motion`.
- A dialog is for a focused decision or short form. Navigation, settings,
  profiles, bots, and usage are full workspace surfaces.

## Installer

- Kova Setup is a product surface, not a console wrapper. Use the same neutral
  Kova tokens and concise sans-serif type, with a clear step name and a single
  primary action.
- Tell users what is happening and whether the current step is downloading,
  preparing, or building. Show live output only on request; do not expose
  implementation jargon as the primary progress experience.
- First install, update, success, and failure have distinct copy and recovery
  actions. Keep logs available from progress and failure.

## Accessibility and review

- Keyboard order follows the visual order. Focus remains visible and every
  action can be completed without a pointer.
- Respect reduced motion, high contrast, scaling, and light/dark appearance.
- Before shipping, check a fresh draft, an existing session, a bot chat, an
  empty bot chat, a project chat, loading/failure, and both appearance modes.
- Reject visuals that look like an upstream Hermes screen or a direct OpenBot /
  Codex clone. Keep the information hierarchy familiar and the Kova expression
  distinct.
