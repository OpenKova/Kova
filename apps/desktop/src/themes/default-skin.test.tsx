import { contrastRatio } from '@kova/shared/color'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { useTheme } from './context'
import { skinToDesktopTheme } from './skin'

// What the gateway and the Electron bridge report for a STOCK config
// (`display.skin: default`): the CLI's stock skin, by name `default`.
const stockDefaultSkin = {
  name: 'default',
  description: 'Stock skin',
  colors: { banner_text: '#FFF8DC', status_bar_bg: '#1a1a2e', ui_accent: '#FFBF00', banner_border: '#CD7F32' }
}

const BACKEND_THEMES_KEY = 'kova-desktop-backend-themes-v1'

const cssVar = (name: string) => window.document.documentElement.style.getPropertyValue(name)
const paintedSkin = () => window.document.documentElement.dataset.kovaTheme

type ThemeApi = ReturnType<typeof useTheme>

/** A fresh renderer launch: module state reloads, localStorage survives. */
async function launch(localSkin: typeof stockDefaultSkin | null) {
  cleanup()
  Object.defineProperty(window, 'kovaDesktop', {
    configurable: true,
    value: localSkin ? { localSkin: { profile: 'default', skin: localSkin } } : {}
  })
  vi.resetModules()

  const [context, sync, skinCommand] = await Promise.all([
    import('./context'),
    import('./backend-sync'),
    import('./use-skin-command')
  ])

  // The pre-mount boot paint, i.e. the very first frame of the launch.
  const bootPaint = paintedSkin()
  const api: { theme: ThemeApi | null; skin: ((arg: string) => string) | null } = { skin: null, theme: null }

  function Probe() {
    api.theme = context.useTheme()
    api.skin = skinCommand.useSkinCommand()

    return null
  }

  render(
    <context.ThemeProvider>
      <Probe />
    </context.ThemeProvider>
  )

  // gateway.ready: the connect-time seed of the backend's active skin.
  const connect = () => act(() => sync.ingestBackendSkin(stockDefaultSkin, { apply: false }))

  return { api, bootPaint, connect }
}

describe('Mono is the Desktop default, never inferred from stock config', () => {
  beforeEach(() => window.localStorage.clear())

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    Reflect.deleteProperty(window, 'kovaDesktop')
    vi.resetModules()
  })

  it.each([
    ['display.skin: default', stockDefaultSkin],
    ['display.skin unset', null]
  ])('a stock user (%s) with no Desktop pick paints Mono on boot, connect and relaunch', async (_label, local) => {
    let run = await launch(local)
    expect(run.bootPaint).toBe('mono')
    run.connect()
    run.connect() // reconnect re-seed
    expect(run.api.theme?.themeName).toBe('mono')
    expect(paintedSkin()).toBe('mono')

    run = await launch(local)
    expect(run.bootPaint).toBe('mono')
    run.connect()
    expect(paintedSkin()).toBe('mono')
  })

  it('a Mono pick paints clean grayscale and survives connect, reconnect and relaunch; a later GitHub pick sticks', async () => {
    let run = await launch(stockDefaultSkin)
    expect(run.api.theme?.availableThemes.find(t => t.name === 'mono')?.label).toBe('Mono')

    act(() => run.api.theme?.setMode('dark'))
    act(() => run.api.theme?.setTheme('mono'))
    expect(paintedSkin()).toBe('mono')
    expect(cssVar('--theme-background-seed').toLowerCase()).toBe('#0e0e0e')
    expect(cssVar('--theme-primary').toLowerCase()).toBe('#eaeaea')

    run.connect()
    run.connect()
    expect(run.api.theme?.themeName).toBe('mono')

    run = await launch(stockDefaultSkin)
    expect(run.bootPaint).toBe('mono')
    run.connect()
    expect(paintedSkin()).toBe('mono')
    expect(cssVar('--theme-background-seed').toLowerCase()).toBe('#0e0e0e')

    act(() => run.api.theme?.setTheme('github'))
    run = await launch(stockDefaultSkin)
    run.connect()
    expect(run.bootPaint).toBe('github')
    expect(paintedSkin()).toBe('github')
  })

  it('/skin onyx, /skin nous and /skin default all land on the Desktop default (Mono)', async () => {
    const run = await launch(stockDefaultSkin)

    act(() => void run.api.skin?.('onyx'))
    expect(run.api.theme?.themeName).toBe('mono')

    act(() => void run.api.skin?.('nous'))
    act(() => void run.api.skin?.('kova'))
    expect(run.api.theme?.themeName).toBe('mono')

    act(() => void run.api.skin?.('default'))
    expect(run.api.theme?.themeName).toBe('mono')
  })

  it('removed themes no longer resolve and are not offered', async () => {
    const run = await launch(stockDefaultSkin)
    const names = (run.api.theme?.availableThemes ?? []).map(t => t.name)

    expect(names.sort()).toEqual(['github', 'mono'])
    for (const retired of ['onyx', 'nous', 'nous-alt', 'classic', 'ember', 'cyberpunk', 'solarized', 'midnight', 'everforest', 'catppuccin', 'slate']) {
      expect(names).not.toContain(retired)
      act(() => void run.api.skin?.(retired))
      expect(run.api.theme?.themeName).toBe('mono')
    }
  })

  it('a cache left by an older build (CLI `default` as "Classic Kova") shows no Classic theme and is purged', async () => {
    // Exactly what that build wrote: the converted CLI `default` skin, relabelled.
    window.localStorage.setItem(
      BACKEND_THEMES_KEY,
      JSON.stringify({
        default: {
          ...skinToDesktopTheme(stockDefaultSkin),
          description: stockDefaultSkin.description,
          label: 'Classic Kova'
        }
      })
    )

    const run = await launch(stockDefaultSkin)
    run.connect()

    const themes = run.api.theme?.availableThemes ?? []
    expect(themes.filter(t => t.label === 'Classic Kova').map(t => t.name)).toEqual([])
    expect(themes.some(t => t.name === 'default')).toBe(false)
    expect(run.api.skin?.('list')).not.toContain('Classic Kova')
    expect(JSON.parse(window.localStorage.getItem(BACKEND_THEMES_KEY) ?? '{}')).not.toHaveProperty('default')
  })

  it('Mono keeps text readable in both modes', async () => {
    const run = await launch(stockDefaultSkin)
    act(() => run.api.theme?.setTheme('mono'))

    act(() => run.api.theme?.setMode('light'))
    expect(window.document.documentElement.dataset.kovaMode).toBe('light')
    expect(contrastRatio(cssVar('--theme-foreground'), cssVar('--theme-background-seed'))).toBeGreaterThanOrEqual(4.5)

    act(() => run.api.theme?.setMode('dark'))
    expect(window.document.documentElement.dataset.kovaMode).toBe('dark')
    expect(cssVar('--theme-background-seed').toLowerCase()).toBe('#0e0e0e')
    expect(contrastRatio(cssVar('--theme-foreground'), cssVar('--theme-background-seed'))).toBeGreaterThanOrEqual(4.5)
  })
})
