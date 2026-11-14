# Kova Desktop Design System

This is the single visual and interaction contract for Kova Desktop and Kova
Setup. Use OpenBot as the reference for shell arrangement and information
hierarchy: a compact destination rail, an adjacent workspace/session sidebar,
a clear top bar, and calm, grouped settings. Implement the patterns with Kova's
own components, routes, state, icons, and visual identity. This document is the
source of truth for future desktop design work.

## Product feel

- **Work first.** Keep conversations, files, projects, and controls within one
  working environment. The current task remains the most visually prominent
  part of the window.
- **Organized and calm.** Use a graphite neutral palette with subtle surface
  changes, compact controls, consistent spacing, and restrained separators.
  The interface should feel like a maintained desktop application, not a web
  dashboard or a collection of unrelated panels.
- **Kova owns its identity.** Use Kova's name, mark, icon family, and accent.
  OpenBot informs layout and hierarchy; do not import its source files, artwork,
  or product identity into Kova.
- **Readable first.** Use the application sans-serif stack for interface copy.
  Reserve monospace for code, paths, and technical output.

## Color, type, and surfaces

- Use the shipped Kova `--ui-*` and `--dt-*` tokens. Do not introduce raw hex
  colors in feature components or a separate one-screen palette.
- Dark mode uses a near-black canvas with gently raised sidebars and controls.
  Light mode uses a soft neutral canvas with clear text contrast, not a direct
  color inversion of the dark theme.
- Use background surfaces to group related content, following OpenBot's quiet
  filled panels. Keep cards and rows flat; use subtle borders as separators.
  Avoid nested boxes, repeated inset borders, glass blur, glow, and oversized
  colored blocks.
- Use consistent compact spacing and corner radii across sidebars, settings
  groups, dialogs, and composer controls. Reserve larger radii for major
  surfaces such as the composer and app workspace.
- Use Kova's accent for primary actions, selected navigation, and focus. Status
  colors communicate status only. Keep keyboard focus visible in both themes.
- Text and controls must meet WCAG AA contrast. Do not encode state through
  color alone.

## App shell and navigation

- Use the OpenBot-style two-part left shell: a narrow icon rail for global
  destinations and an adjacent sidebar for workspace identity, search, and the
  current destination's list. Keep the rail visible when the adjacent sidebar
  is collapsed.
- Put New chat, Marketplace, Channels, Artifacts, Scheduled, and other primary
  destinations in the icon rail. Give each one a clear active state, an
  accessible name, and a standard horizontal tooltip. Never show rotated or
  vertically stacked hover labels.
- Keep workspace identity and search at the top of the session sidebar, with
  conversations below. Put session-specific actions next to the session list;
  keep account identity and Settings anchored at the bottom.
- Keep the shell flat and aligned. Use a subtle separator between the rail and
  sidebar; do not turn each navigation area into a separate outlined card.
- Keep the global icon rail on the window canvas. Frame the session list and
  conversation together as one inset workspace with shared outer corners and
  a quiet divider between them.
- The account menu opens as a clean identity overview. Make profile editing
  available through an explicit pencil affordance. Keep sign-out visually
  separate from ordinary profile actions.
- Sessions and Bots each need an obvious route to the other. Preserve the
  active workspace and chat identity when moving between them.
- At narrow widths, collapse labels into tooltips and reduce optional status
  text before hiding the active chat identity or its model choice.

## Top bar and status area

- Use the top bar for workspace identity, back/forward history, open chat tabs,
  model and reasoning choices, and pane controls. Keep native window controls
  unobstructed.
- Place chat tabs in the center of the top bar. Keep model and pane controls at
  the far end. Keep global destinations in the app rail rather than repeating
  them in the chat header.
- Use the bottom status area for live connection, current work, task progress,
  context, and usage. It is not a second navigation row.
- Keep idle status compact. While work is in progress, show a progress indicator
  whose details are available on hover and keyboard focus.
- Keep build hashes, install identifiers, exact paths, and runtime provenance
  in diagnostics rather than everyday status summaries.

## Settings

- Settings is a full workspace with the same two-part structure as OpenBot:
  stable Settings heading and search in the left settings sidebar, organized
  sections beneath it, and the selected section's content in the right pane.
- Keep the settings sidebar narrow, consistently spaced, and easy to scan.
  Group related options into sections such as General, Agents, Profile,
  Notifications, Voice, Computer Use, Billing, Mobile Connect, and Updates.
  Use one selected-row treatment and do not add decorative red highlights.
- Keep each settings section focused on its own controls. Preserve the full
  range of settings; organization must not hide or delete existing options.
- Arrange controls in a readable content column. Use quiet filled background
  groups for related settings, with clear labels, short descriptions, and
  aligned controls. Avoid long ungrouped forms and excessive nested cards.
- Expand details inline in the settings content when that keeps the current
  context clear. Do not force routine settings into dropdown-only navigation.
- Make navigation back to the app obvious. Settings should not cover the
  workspace in a modal or unexpectedly move focus.

## Marketplace

- Keep Marketplace as a global destination in the app rail. Use consistent
  top-level sections for Apps, Plugins, Skills, and Tools.
- Give every section the same clear layout grammar: section tabs, a search bar,
  category/source filters, a result count, and content groups below.
- Present items in aligned rows or cards with a clear icon, name, source or
  provider, short description, availability state, and one contextual action.
  Preserve the Apps section's density and arrangement across Plugins, Skills,
  and Tools.
- Keep loading, empty, failure, and retry states inside the content area. Explain
  the failure in plain language and provide a direct retry action.

## Conversations and composer

- Let the transcript own the central canvas. Distinguish user and agent turns
  with clean message surfaces and readable spacing; do not wrap every message
  in a heavy card.
- Keep the composer anchored at the bottom of an existing chat. On a genuinely
  new draft, a small prompt may sit above it; do not show a second welcome hero
  behind a bot, project, or existing conversation identity.
- Group composer controls by task: attachments and context on the left, model
  and reasoning near the input, and send/stop on the right. Give icon-only
  controls accessible names and tooltips.
- Keep the chat header quiet: workspace and chat identity first, then compact
  history and tab controls, then model and pane actions.
- Give each empty state to the surface it describes. A bot empty state owns its
  bot avatar and name; the generic new-chat welcome must not show behind it.
- Treat loading, reconnecting, degraded, and failed states distinctly. Explain
  what happened and offer a recovery action without competing error panels.

## Bots, profiles, and workspaces

- Keep the user's workspace identity separate from bot profiles. Creating a
  bot must not create a new workspace or replace the workspace switcher.
- Present bot identity and conversation in the same organized shell as normal
  chats. Make the selected bot clear in the header and preserve its canonical
  chat when navigating away and back.
- Use a bot-specific empty state and keep bot controls close to the bot they
  affect. Do not duplicate bot-management controls in the global status area.

## Controls and motion

- Reuse Kova's shared buttons, inputs, menus, and dialogs. Choose semantic
  variants instead of rebuilding control chrome for each feature.
- Keep icon buttons compact, aligned, and close to a 32px target. Hover
  backgrounds should follow the control shape rather than paint a large square.
- Use short motion to clarify state transitions. Hover and press feedback should
  be immediate; panels and menus should settle quickly. Honor
  `prefers-reduced-motion`.
- Use dialogs for focused decisions and short forms. Navigation, settings,
  profiles, bots, and usage belong in workspace surfaces.

## Kova Setup

- Treat Setup as a Kova product surface, not a console wrapper. Use the same
  neutral tokens, compact sans-serif type, and clear grouping as the desktop
  app.
- Show a clear step name, concise explanation, and one primary action. Distinguish
  downloading, preparing, building, success, and failure states.
- Keep live output available when useful, but do not make implementation
  details the primary progress experience. Make logs available from progress
  and recovery screens.

## Accessibility and review

- Follow the visual order for keyboard navigation. Keep focus visible and make
  every action possible without a pointer.
- Respect reduced motion, high contrast, scaling, and light/dark appearance.
- Before shipping a visual change, review a fresh draft, an existing session,
  a bot chat, an empty bot chat, a project chat, settings, Marketplace, loading
  and failure states, and both appearance modes.
- Use OpenBot's arrangement as the reference while keeping Kova's identity,
  behavior, and implementation distinct. Avoid a direct upstream product clone.
