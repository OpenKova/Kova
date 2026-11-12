import { describe, expect, it } from 'vitest'

import { shouldPromptForKovaAccount } from './kova-account'

describe('shouldPromptForKovaAccount', () => {
  it('asks for a Kova identity only when the service is configured and no username exists', () => {
    expect(shouldPromptForKovaAccount({ configured: true, profile: null }, false)).toBe(true)
    expect(shouldPromptForKovaAccount({ configured: true, profile: { username: null } }, false)).toBe(true)
    expect(shouldPromptForKovaAccount({ configured: false, profile: null }, false)).toBe(false)
    expect(shouldPromptForKovaAccount({ configured: true, profile: { username: 'kova_user' } }, false)).toBe(false)
    expect(shouldPromptForKovaAccount({ configured: true, profile: null }, true)).toBe(false)
  })
})
