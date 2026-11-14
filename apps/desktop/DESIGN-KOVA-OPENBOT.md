# OpenBot Shell Reference

OpenBot is the layout reference for Kova's desktop shell. Its source is cloned
locally at `C:\Users\chira\openbot-reference` from
[`nightly-labs/openbot`](https://github.com/nightly-labs/openbot). The current
source repository is licensed under PolyForm Noncommercial 1.0.0. Kova therefore
uses the shell's arrangement and interaction ideas while implementing them in
Kova's own components and visual system; do not copy OpenBot source files or
artwork into Kova.

## Shell mapping

| OpenBot surface                                                          | Kova surface                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Narrow page rail with one icon per destination                           | Sidebar app rail: New chat, Marketplace, Channels, Artifacts, Scheduled, and contributed destinations |
| Adjacent sidebar with workspace selector, search, and chat list          | Kova profile/workspace switcher and session list                                                      |
| Top row with identity, back/forward, chat tabs, model, and pane controls | Native titlebar, session tab strip, chat title, model picker, and titlebar controls                   |
| Quiet bottom status area                                                 | Kova status bar for connection, current work, context, and runtime details                            |

## Layout rules

- Keep the global destination rail narrow and icon-led. Every icon has a
  tooltip, accessible label, clear selected state, and compact pointer target.
- Keep workspace search and conversation history in the neighboring sidebar;
  do not mix app destinations into the history list.
- Put New chat in the app rail and make its keyboard shortcut discoverable from
  its tooltip. Keep Marketplace, Channels, Artifacts, and Scheduled beside it.
- Keep workspace/profile identity at the beginning of the top row. Place chat
  history navigation and open sessions in the center. Put model/reasoning and
  pane controls at the far end,
  leaving native minimize/maximize/close controls unobstructed.
- At narrow widths, preserve navigation and active-session identity. Collapse
  labels to tooltips and remove optional status text before removing core
  controls.
- Use Kova's shipped tokens, icon family, routes, and state. Preserve Kova's
  account, session, workspace, pane, and keyboard behavior when arranging the
  shell; a visual reference must not create a second source of truth.
- Keep the status bar for live state. Do not use it as another navigation row.

For the binding Kova design contract, see [`DESIGN-KOVA.md`](./DESIGN-KOVA.md).
