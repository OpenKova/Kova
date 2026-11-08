/**
 * @kova belongs to the default bot only while its source has no real
 * (pre-reservation) `kova` profile. With one, the roster shows exactly one
 * @kova — the real profile — and the default answers to @default, so a
 * typed @kova reaches the same profile the backend's message_agent does.
 */

import { describe, expect, it, vi } from 'vitest'

import { botHandle, botMentionTag, claimDefaultHandles, mergeMultiSourceRoster, resolveRosterMentions } from './data'
import { previewKind } from './row-helpers'
import type { RosterRow } from './types'

vi.mock('@kova/plugin-sdk', async () => {
  const { atom } = await import('nanostores')

  return { atom, host: {}, queryClient: undefined, useQuery: vi.fn(), useValue: vi.fn() }
})

vi.mock('./shared', () => ({ getPluginCtx: () => null, ID: 'kova-bots' }))

function roster(names: string[]): RosterRow[] {
  const local = { profiles: names.map(name => ({ name })) }

  // What Electron's buildAgentRoster reports for a single local source: bare-name handles.
  const union = {
    agents: names.map(profile => ({
      connectionId: 'local',
      connectionKind: 'local' as const,
      connectionLabel: 'This device',
      handle: profile,
      profile,
      targetProfile: profile
    })),
    primaryConnectionId: 'local'
  }

  return mergeMultiSourceRoster(local, union, 'local').profiles as RosterRow[]
}

describe('the @kova handle', () => {
  it.each([
    [['default', 'researcher'], 'default'],
    [['default', 'kova', 'researcher'], 'kova']
  ])('roster %j shows one @kova and a typed @kova reaches %s', (names, owner) => {
    const rows = roster(names)
    const handles = rows.map(row => botHandle(row.name, row))

    expect(handles.filter(handle => handle === 'kova')).toHaveLength(1)
    expect(rows.map(row => botMentionTag(row)).filter(tag => tag === 'kova')).toHaveLength(1)
    expect(resolveRosterMentions('@kova ping', rows, { name: 'researcher' }).map(row => row.name)).toEqual([owner])
  })

  it('names the default @default once a real kova profile holds the handle', () => {
    const rows = roster(['default', 'kova', 'researcher'])
    const byName = Object.fromEntries(rows.map(row => [row.name, botHandle(row.name, row)]))

    expect(byName).toEqual({ default: 'default', kova: 'kova', researcher: 'researcher' })
    expect(resolveRosterMentions('@default ping', rows, { name: 'researcher' }).map(row => row.name)).toEqual(['default'])
  })

  it('keeps each source separate: a remote kova profile does not rename the local default', () => {
    const rows = claimDefaultHandles<Partial<RosterRow>>([
      { connectionId: 'local', name: 'default' },
      { connectionId: 'mini', name: 'default' },
      { connectionId: 'mini', name: 'kova' }
    ])

    expect(rows.map(row => botHandle(String(row.name), row))).toEqual(['kova', 'default', 'kova'])
  })

  it("never lets a source's stale 'kova' handle on its default answer @kova", () => {
    // An older backend labels its default @kova even beside a real kova profile.
    const rows = claimDefaultHandles<RosterRow>([
      { connectionId: 'mini', handle: 'kova', name: 'default', remoteSource: true },
      { connectionId: 'mini', handle: 'kova', name: 'kova', remoteSource: true },
      { connectionId: 'local', name: 'researcher' }
    ])

    expect(resolveRosterMentions('@kova ping', rows, { name: 'researcher' }).map(row => row.name)).toEqual(['kova'])
  })

  it('names a DM sender in a row preview by its roster handle', () => {
    const rows = claimDefaultHandles<RosterRow>(
      ['default', 'kova', 'researcher'].map(name => ({ connectionId: 'local', name }))
    )

    const sender = (name: string, list: RosterRow[]) =>
      previewKind(`Message from 🤖 ${name} (@x): hi`, list, 'local').fromBot

    expect([sender('default', rows), sender('kova', rows)]).toEqual(['default', 'kova'])
    // No real kova profile: the default is still @kova (#89484).
    expect(sender('default', claimDefaultHandles<RosterRow>([{ connectionId: 'local', name: 'default' }]))).toBe(
      'kova'
    )
  })
})
