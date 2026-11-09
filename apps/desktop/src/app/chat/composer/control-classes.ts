import { cn } from '@/lib/utils'

// Shared class names for the composer's control row, in a module of their own
// so both the row (`controls.tsx`) and the menus it renders can wear them
// without importing each other in a cycle.

export const ICON_BTN = 'size-(--composer-control-size) shrink-0 rounded-full'

export const GHOST_ICON_BTN = cn(
  ICON_BTN,
  'text-(--ui-text-tertiary) hover:bg-(--chrome-action-hover) hover:text-foreground'
)

// Send/voice-conversation primary: solid foreground-on-background circle
// (white-on-black in dark mode, black-on-white in light) — the Codex send.
// Keeps the rest of the row neutral and lets the action dominate it.
export const PRIMARY_ICON_BTN = cn(
  'size-(--composer-control-primary-size,var(--composer-control-size)) shrink-0 rounded-full p-0',
  'bg-foreground text-background hover:bg-foreground/90',
  'disabled:bg-foreground/30 disabled:text-background disabled:opacity-100'
)

/** A toggle that is currently ON — dictation, spoken replies, the wake word. */
export const ACTIVE_ICON_BTN = 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
