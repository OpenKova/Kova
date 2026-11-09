import { describe, expect, it } from 'vitest'

import { shouldCenterComposer } from './centered-empty'

const centered = {
  busy: false,
  loadingSession: false,
  messagesEmpty: true,
  resumeExhausted: false,
  setupChat: false,
  showChatBar: true
}

describe('shouldCenterComposer', () => {
  it('centers the composer on a fresh, settled, empty chat', () => {
    expect(shouldCenterComposer(centered)).toBe(true)
  })

  it('docks the composer once a message exists', () => {
    expect(shouldCenterComposer({ ...centered, messagesEmpty: false })).toBe(false)
  })

  it('docks immediately on send (busy), without waiting for the message to land', () => {
    expect(shouldCenterComposer({ ...centered, busy: true })).toBe(false)
  })

  it('stays docked while a session loads or the resume is exhausted', () => {
    expect(shouldCenterComposer({ ...centered, loadingSession: true })).toBe(false)
    expect(shouldCenterComposer({ ...centered, resumeExhausted: true })).toBe(false)
  })

  it('stays docked in the guided setup chat, whose intro overlay owns the empty surface', () => {
    expect(shouldCenterComposer({ ...centered, setupChat: true })).toBe(false)
  })

  it('never centers a hidden composer', () => {
    expect(shouldCenterComposer({ ...centered, showChatBar: false })).toBe(false)
  })
})
