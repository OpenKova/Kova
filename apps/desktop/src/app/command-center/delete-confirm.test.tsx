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

describe('Pulse session list removal', () => {
  it('keeps session browsing and deletion in the sidebar', () => {
    render(
      <MemoryRouter>
        <CommandCenterView onClose={() => {}} />
      </MemoryRouter>
    )

    expect(screen.queryByRole('button', { name: 'Sessions' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Delete session' })).toBeNull()
  })
})
