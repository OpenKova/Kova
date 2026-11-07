import { vi } from 'vitest'

import type { KovaApiRequest } from '@/global'

/** Install a fake `window.kovaDesktop.api`, the preload bridge every REST helper sends through. */
export function installRestBridge(answer: (request: KovaApiRequest) => object) {
  const api = vi.fn(async (request: KovaApiRequest) => answer(request))

  Object.defineProperty(window, 'hermesDesktop', { configurable: true, value: { api } })

  return api
}
