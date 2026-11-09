import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { $approvalModes } from '@/store/approval-mode'
import { $gatewayState } from '@/store/session'
import { stubMenuDomApis, stubResizeObserver } from '@/test/jsdom'

import { ApprovalPill } from './approval-pill'

beforeAll(() => {
  stubResizeObserver()
  stubMenuDomApis()
})

afterEach(() => {
  cleanup()
  $approvalModes.set({})
  $gatewayState.set('open')
})

function renderPill(gateway: (method: string, params?: Record<string, unknown>) => Promise<unknown>) {
  $gatewayState.set('open')

  return render(<ApprovalPill disabled={false} gateway={gateway} profile="work" />)
}

describe('ApprovalPill', () => {
  it('writes the selected mode through the gateway and updates its pill label', async () => {
    const gateway = vi.fn(async (_method: string, params?: Record<string, unknown>) => ({
      value: params?.value ?? 'smart'
    }))

    renderPill(gateway)

    fireEvent.pointerDown(screen.getByRole('button', { name: /approve for me/i }), { button: 0 })
    fireEvent.click(await screen.findByRole('menuitemradio', { name: /ask for approval/i }))

    await waitFor(() => {
      // The menu shows the "work" profile, so the write must name it (#125969); an unscoped
      // `config.set` would edit whichever profile the backend was launched with instead.
      expect(gateway).toHaveBeenCalledWith('config.set', {
        key: 'approvals.mode',
        value: 'manual',
        profile: 'work'
      })
      expect(screen.getByRole('button', { name: /ask for approval/i })).toBeTruthy()
    })
  })

  it('syncs once the gateway opens instead of sitting on the pre-sync default', async () => {
    const gateway = vi.fn(async () => ({ value: 'off' }))
    renderPill(gateway)

    await waitFor(() => {
      expect(gateway).toHaveBeenCalledWith('config.get', { key: 'approvals.mode', profile: 'work' })
      expect(screen.getByRole('button', { name: /full access/i })).toBeTruthy()
    })
  })
})
