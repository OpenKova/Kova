import { describe, expect, it } from 'vitest'

import { isKovaCloudUrl } from './hermes-cloud'

describe('isKovaCloudUrl', () => {
  it('recognises production and staging agent hosts, nothing else', () => {
    expect(isKovaCloudUrl('https://ares-3009.agents.nousresearch.com')).toBe(true)
    expect(isKovaCloudUrl('https://ares--app.agents.staging-nousresearch.com/')).toBe(true)
    expect(isKovaCloudUrl('https://agents.nousresearch.com.evil.example')).toBe(false)
    expect(isKovaCloudUrl('https://my-box.tailnet.ts.net')).toBe(false)
    expect(isKovaCloudUrl('not a url')).toBe(false)
    expect(isKovaCloudUrl(undefined)).toBe(false)
  })
})
