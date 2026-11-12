import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type * as KovaApi from '@/kova'

import { CommandCenterView } from './index'

vi.mock('@/kova', async importOriginal => ({
  ...(await importOriginal<typeof KovaApi>()),
  getUsageAnalytics: vi.fn(() => Promise.resolve({}))
}))
vi.mock('./maintenance', () => ({ MaintenancePanel: () => null }))

afterEach(cleanup)

describe('Pulse navigation', () => {
  it('opens on Usage and no longer offers a sessions section', () => {
    render(
      <MemoryRouter>
        <CommandCenterView onClose={() => {}} />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: 'Usage' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Sessions' })).toBeNull()
  })
})
