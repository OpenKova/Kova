import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { registry } from '@/contrib/registry'

import { findGroupOfPane, group } from './model'
import {
  $dismissedPanes,
  $hiddenTreePanes,
  $layoutTree,
  moveTreePane,
  removeTreePane,
  tabStripVisibleForGroup
} from './store'

// Chat strips are gone (Codex): the sidebar switches conversations, so a
// zone holding only chat panes NEVER shows a strip — before, during, and
// after a drag that splits a tile out into its own zone. The drag gesture
// itself is unchanged; only the chrome answer flipped.

const disposers: (() => void)[] = []

beforeEach(() => {
  window.localStorage.clear()
  $dismissedPanes.set(new Set())
  $hiddenTreePanes.set(new Set())

  for (const [id, data] of [
    ['workspace', { placement: 'main', uncloseable: true }],
    ['session-tile:b', { placement: 'main' }]
  ] as const) {
    disposers.push(registry.register({ area: 'panes', data, id, render: () => null, title: id }))
  }

  $layoutTree.set(group(['workspace', 'session-tile:b'], { active: 'session-tile:b', id: 'grp-main' }))
})

afterEach(() => disposers.splice(0).forEach(dispose => dispose()))

const zoneOf = (paneId: string) => findGroupOfPane($layoutTree.get()!, paneId)!

describe('dragging a session tab into its own zone', () => {
  it('shows no strip on either chat zone, before or after the split', () => {
    expect(tabStripVisibleForGroup(zoneOf('workspace'))).toBe(false)

    moveTreePane('session-tile:b', { groupId: 'grp-main', pos: 'right' })

    expect(zoneOf('workspace').id).not.toBe(zoneOf('session-tile:b').id)
    expect(tabStripVisibleForGroup(zoneOf('workspace'))).toBe(false)
    expect(tabStripVisibleForGroup(zoneOf('session-tile:b'))).toBe(false)
    // Nothing was written to the zone to get there — it is still on auto.
    expect(zoneOf('workspace').tabStrip).toBeUndefined()

    removeTreePane('session-tile:b')

    expect(tabStripVisibleForGroup(zoneOf('workspace'))).toBe(false)
  })
})
