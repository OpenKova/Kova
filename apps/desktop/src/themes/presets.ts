/**
 * Built-in desktop themes. Names match the CLI skins / dashboard presets.
 * Add new themes here — no code changes needed elsewhere.
 *
 * The palette-bearing skins (github, catppuccin, everforest) are forks
 * of their VS Code originals, converted by `buildThemeFromMarketplace` (see
 * ./install.ts) from the extensions below — the same path a Marketplace import
 * takes, so each is identical to installing the extension by hand and costs the
 * user neither the download nor the install step.
 *
 *   nous       ← github.github-vscode-theme   (Light Default / Dark Default)
 *   catppuccin ← Catppuccin.catppuccin-vsc    (Latte / Mocha)
 *   everforest ← sainnhe.everforest
 *   solarized  ← ryanolsonx.solarized
 *
 * Re-convert marketplace forks from the upstream extension rather than
 * hand-editing hexes; hand edits drift from upstream silently and can't be
 * re-derived. `nous-alt` is first-party — do not re-derive it from GitHub.
 */

import { THEME_PRESET_PALETTES } from '@kova/shared'

import type { DesktopTheme, DesktopThemeTypography } from './types'

// Color-emoji fonts to append to every stack as a last resort. None of the UI
// text/mono fonts carry emoji glyphs, so without this emoji render as tofu
// boxes on platforms whose default text font lacks them (e.g. Linux/#40364).
// Covers macOS, Windows, Linux, plus the `emoji` generic for anything else.
export const EMOJI_FALLBACK = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", emoji'

const SYSTEM_SANS =
  '"Segoe WPC", "Segoe UI", -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif, ' +
  EMOJI_FALLBACK

// Keep the bundled JetBrains Mono first in every mono fallback chain. Several
// theme display fonts (Courier Prime, IBM Plex Mono) do not cover Vietnamese /
// Latin Extended glyphs; falling directly to platform UI fonts makes code
// blocks visibly non-monospace. JetBrains Mono is bundled with the app and
// covers those glyphs, while the Linux fallbacks catch distros without it.
const SYSTEM_MONO =
  '"JetBrains Mono", "Cascadia Code", "Cascadia Mono", "DejaVu Sans Mono", "Liberation Mono", "Noto Sans Mono", ' +
  '"Noto Mono", "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace, ' +
  EMOJI_FALLBACK

export const DEFAULT_TYPOGRAPHY: DesktopThemeTypography = { fontSans: SYSTEM_SANS, fontMono: SYSTEM_MONO }

/**
 * Nous — the canonical Kova desktop identity, forked from the GitHub VS Code
 * theme (github.github-vscode-theme). Light is GitHub Light Default, dark is
 * GitHub Dark Default, both converted through the same path a Marketplace
 * install takes, so the palette here is byte-identical to importing the
 * extension yourself.
 *
 * Typography stays Kova's own: a VS Code theme carries no font opinion, and
 * these are the stacks every skin has been rendering with.
 */
/**
 * GitHub — the upstream palette, unmodified.
 *
 * `nous` is a fork of this with its own accent, so shipping both keeps the
 * original available on its own terms instead of only existing as the thing
 * nous diverged from. Everything but the accent family is identical between
 * them; separate presets are what let nous's accent move without silently
 * redefining what "GitHub" means.
 */
export const githubTheme: DesktopTheme = {
  name: 'github',
  label: 'GitHub',
  description: 'GitHub Light Default and Dark Default',
  ...THEME_PRESET_PALETTES.github,
  typography: {
    fontSans: SYSTEM_SANS,
    fontMono: SYSTEM_MONO,
    fontUrl: 'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap'
  },
  terminal: {
    foreground: '#1f2328',
    black: '#24292f',
    red: '#cf222e',
    green: '#116329',
    yellow: '#4d2d00',
    blue: '#0969da',
    magenta: '#8250df',
    cyan: '#1b7c83',
    white: '#6e7781',
    brightBlack: '#57606a',
    brightRed: '#a40e26',
    brightGreen: '#1a7f37',
    brightYellow: '#633c01',
    brightBlue: '#218bff',
    brightMagenta: '#a475f9',
    brightCyan: '#3192aa',
    brightWhite: '#8c959f'
  },
  darkTerminal: {
    foreground: '#e6edf3',
    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d4dd',
    brightWhite: '#ffffff'
  }
}

/** Catppuccin — Latte in light, Mocha in dark (Catppuccin.catppuccin-vsc). */

/** Catppuccin — Latte in light, Mocha in dark (Catppuccin.catppuccin-vsc). */
export const catppuccinTheme: DesktopTheme = {
  name: 'catppuccin',
  label: 'Catppuccin',
  description: 'Soothing pastels — Latte and Mocha',
  ...THEME_PRESET_PALETTES.catppuccin,
  terminal: {
    foreground: '#4c4f69',
    cursor: '#dc8a78',
    selectionBackground: '#acb0be',
    black: '#5c5f77',
    red: '#d20f39',
    green: '#40a02b',
    yellow: '#df8e1d',
    blue: '#1e66f5',
    magenta: '#ea76cb',
    cyan: '#179299',
    white: '#acb0be',
    brightBlack: '#6c6f85',
    brightRed: '#de293e',
    brightGreen: '#49af3d',
    brightYellow: '#eea02d',
    brightBlue: '#456eff',
    brightMagenta: '#fe85d8',
    brightCyan: '#2d9fa8',
    brightWhite: '#bcc0cc'
  },
  darkTerminal: {
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    selectionBackground: '#585b70',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#a6adc8',
    brightBlack: '#585b70',
    brightRed: '#f37799',
    brightGreen: '#89d88b',
    brightYellow: '#ebd391',
    brightBlue: '#74a8fc',
    brightMagenta: '#f2aede',
    brightCyan: '#6bd7ca',
    brightWhite: '#bac2de'
  }
}

/** Everforest — warm, low-contrast forest greens (sainnhe.everforest). */
export const everforestTheme: DesktopTheme = {
  name: 'everforest',
  label: 'Everforest',
  description: 'Warm, low-contrast forest greens',
  ...THEME_PRESET_PALETTES.everforest,
  terminal: {
    foreground: '#5c6a72',
    cursor: '#5c6a72',
    black: '#5c6a72',
    red: '#f85552',
    green: '#8da101',
    yellow: '#dfa000',
    blue: '#3a94c5',
    magenta: '#df69ba',
    cyan: '#35a77c',
    white: '#939f91',
    brightBlack: '#5c6a72',
    brightRed: '#f85552',
    brightGreen: '#8da101',
    brightYellow: '#dfa000',
    brightBlue: '#3a94c5',
    brightMagenta: '#df69ba',
    brightCyan: '#35a77c',
    brightWhite: '#f4f0d9'
  },
  darkTerminal: {
    foreground: '#d3c6aa',
    cursor: '#d3c6aa',
    black: '#343f44',
    red: '#e67e80',
    green: '#a7c080',
    yellow: '#dbbc7f',
    blue: '#7fbbb3',
    magenta: '#d699b6',
    cyan: '#83c092',
    white: '#d3c6aa',
    brightBlack: '#859289',
    brightRed: '#e67e80',
    brightGreen: '#a7c080',
    brightYellow: '#dbbc7f',
    brightBlue: '#7fbbb3',
    brightMagenta: '#d699b6',
    brightCyan: '#83c092',
    brightWhite: '#d3c6aa'
  }
}

/**
 * Nous Alt — the hand-authored Nous from before the GitHub fork. Light is
 * glass neutrals with brand blue; dark is cream on mission-blue.
 */
export const nousAltTheme: DesktopTheme = {
  name: 'nous-alt',
  label: 'Nous Alt',
  description: 'Glass neutrals, cream on mission-blue',
  ...THEME_PRESET_PALETTES['nous-alt'],
  typography: {
    fontSans: SYSTEM_SANS,
    fontMono: SYSTEM_MONO,
    fontUrl: 'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap'
  }
}

/**
 * Midnight — deep blue-violet, near-monotone. Dark only: it has no light
 * palette because the whole idea is the dark end of the spectrum.
 */
export const midnightTheme: DesktopTheme = {
  name: 'midnight',
  label: 'Midnight',
  description: 'Deep blue-violet with cool accents',
  ...THEME_PRESET_PALETTES.midnight,
  typography: {
    fontMono: `"JetBrains Mono", ${SYSTEM_MONO}`,
    fontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap'
  }
}

/** Clean grayscale. Matches the CLI mono skin and dashboard mono theme. */
export const monoTheme: DesktopTheme = {
  name: 'mono',
  label: 'Mono',
  description: 'Clean grayscale — minimal and focused',
  ...THEME_PRESET_PALETTES.mono
}

/** Onyx — Mono without the gray: pure black surfaces, pure white text and
 *  hairlines, no gray fills. Dark only, like Mono. */
export const onyxTheme: DesktopTheme = {
  name: 'onyx',
  label: 'Onyx',
  description: 'Pure black and white — no gray',
  ...THEME_PRESET_PALETTES.onyx
}

/** Cool slate blue for developers. Matches the CLI slate skin. */
export const slateTheme: DesktopTheme = {
  name: 'slate',
  label: 'Slate',
  description: 'Cool slate blue — focused developer theme',
  ...THEME_PRESET_PALETTES.slate,
  typography: {
    fontMono: `"JetBrains Mono", ${SYSTEM_MONO}`
  }
}

export const BUILTIN_THEMES: Record<string, DesktopTheme> = {
  github: githubTheme,
  catppuccin: catppuccinTheme,
  everforest: everforestTheme,
  'nous-alt': nousAltTheme,
  midnight: midnightTheme,
  mono: monoTheme,
  onyx: onyxTheme,
  slate: slateTheme
}

export const BUILTIN_THEME_LIST = Object.values(BUILTIN_THEMES)

/** Skin used when nothing is persisted or the persisted name is retired. */
export const DEFAULT_SKIN_NAME = 'onyx'

/** Names that no longer resolve to a skin of their own. A stored pick of one
 *  falls back to DEFAULT_SKIN_NAME, and a cached backend theme under one is
 *  dropped (the reverted #130015 build cached the CLI `default` skin as a
 *  second "Classic Kova"). */
export const RETIRED_SKINS = new Set(['nous-light', 'default', 'gold', 'nous', 'classic', 'ember', 'cyberpunk', 'solarized'])
