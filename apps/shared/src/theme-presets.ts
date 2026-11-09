/**
 * Raw palette table for every built-in Kova theme preset — the single source
 * of truth shared by the desktop app (which layers OKLCH synthesis, terminal
 * palettes and typography on top) and the web dashboard (which projects each
 * preset down to its 3-slot background/midground/foreground model via
 * `webPresetFromShared`). Edit a preset's colours HERE; both surfaces follow.
 *
 * The palette-bearing presets (nous, github, catppuccin, everforest, solarized)
 * are forks of their VS Code originals converted by the desktop's
 * `buildThemeFromMarketplace`; re-convert from the upstream extension rather
 * than hand-editing hexes. `nous-alt` is first-party — do not re-derive it.
 */

/** Tailwind-style colour slots a preset carries (light palette, or the only palette). */
export interface ThemePresetColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  /** Generic focus ring — buttons, inputs, etc. */
  ring: string
  /**
   * Brand-accent stroke — focus rings, streaming cursors, active session
   * pills, branded scrollbars, text selection. Falls back to `ring`.
   * Aliased to the DS `--midground` token.
   */
  midground?: string
  /** Auto-derived from `midground` luminance when omitted. */
  midgroundForeground?: string
  /** Composer outline / focus color. Falls back to `midground`. */
  composerRing?: string
  destructive: string
  destructiveForeground: string
  sidebarBackground?: string
  sidebarBorder?: string
  userBubble?: string
  userBubbleBorder?: string
}

export interface ThemePresetPalette {
  /** Light palette (also reused for dark when `darkColors` is omitted). */
  colors: ThemePresetColors
  /** Hand-tuned dark palette. Skins like `nous` ship one. */
  darkColors?: ThemePresetColors
}

export const THEME_PRESET_PALETTES = {
  github: {
    colors: {
      background: '#ffffff',
      foreground: '#1f2328',
      card: '#f6f8fa',
      cardForeground: '#1f2328',
      muted: '#f6f6f6',
      mutedForeground: '#656d76',
      popover: '#ffffff',
      popoverForeground: '#1f2328',
      primary: '#196d31',
      primaryForeground: '#ffffff',
      secondary: '#dfebe2',
      secondaryForeground: '#1f2328',
      accent: '#e3ede6',
      accentForeground: '#1f2328',
      border: '#d0d7de',
      input: '#ffffff',
      ring: '#196d31',
      midground: '#196d31',
      midgroundForeground: '#ffffff',
      composerRing: '#196d31',
      destructive: '#cf222e',
      destructiveForeground: '#ffffff',
      sidebarBackground: '#f6f8fa',
      sidebarBorder: '#d0d7de',
      userBubble: '#dbe7e2',
      userBubbleBorder: '#d0d7de'
    },
    darkColors: {
      background: '#0d1117',
      foreground: '#e6edf3',
      card: '#010409',
      cardForeground: '#e6edf3',
      muted: '#1a1e24',
      mutedForeground: '#7d8590',
      popover: '#161b22',
      popoverForeground: '#e6edf3',
      primary: '#4f9e5e',
      primaryForeground: '#ffffff',
      secondary: '#1f382b',
      secondaryForeground: '#e6edf3',
      accent: '#192a24',
      accentForeground: '#e6edf3',
      border: '#30363d',
      input: '#0d1117',
      ring: '#4f9e5e',
      midground: '#4f9e5e',
      midgroundForeground: '#ffffff',
      composerRing: '#4f9e5e',
      destructive: '#f85149',
      destructiveForeground: '#ffffff',
      sidebarBackground: '#010409',
      sidebarBorder: '#30363d',
      userBubble: '#0f2018',
      userBubbleBorder: '#30363d'
    }
  },
  mono: {
    colors: {
      background: '#0e0e0e',
      foreground: '#eaeaea',
      card: '#141414',
      cardForeground: '#eaeaea',
      muted: '#1e1e1e',
      mutedForeground: '#808080',
      popover: '#181818',
      popoverForeground: '#eaeaea',
      primary: '#eaeaea',
      primaryForeground: '#0e0e0e',
      secondary: '#262626',
      secondaryForeground: '#c8c8c8',
      accent: '#222222',
      accentForeground: '#d8d8d8',
      border: '#2a2a2a',
      input: '#2a2a2a',
      ring: '#9a9a9a',
      midground: '#9a9a9a',
      destructive: '#a84040',
      destructiveForeground: '#fef2f2',
      sidebarBackground: '#0a0a0a',
      sidebarBorder: '#202020',
      userBubble: '#1a1a1a',
      userBubbleBorder: '#363636'
    }
  },
} satisfies Record<string, ThemePresetPalette>

export type ThemePresetName = keyof typeof THEME_PRESET_PALETTES
