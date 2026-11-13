# OpenBot Design Reference Notes

This is a short record of design ideas that informed Kova's visual refresh. It
is not a pixel-match specification. For implementation decisions, use
[`DESIGN-KOVA.md`](./DESIGN-KOVA.md).

## Patterns worth learning from

- Quiet neutral canvases make the conversation and project context easier to
  scan.
- A small number of surface steps and restrained hairlines work better than
  nested cards and shadows.
- Compact, consistently aligned controls leave more room for the actual task.
- A persistent navigation rail should explain which workspace is active and
  how to switch away from it.

## Kova-specific choices

Kova uses its own icon, accent tokens, terminology, sidebar structure, and
empty-state compositions. Reuse these interaction principles without copying
OpenBot's precise sizes, colors, component arrangement, copy, or brand artwork.
