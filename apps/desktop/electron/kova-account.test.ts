import assert from 'node:assert/strict'

import { test } from 'vitest'

import { normalizeKovaAccountServiceUrl, runKovaAccountLogin } from './kova-account'

test('account service URL is normalized and rejects insecure non-local origins', () => {
  assert.equal(normalizeKovaAccountServiceUrl('https://accounts.kova.example/v1/'), 'https://accounts.kova.example/v1')
  assert.throws(() => normalizeKovaAccountServiceUrl('http://accounts.example'), /HTTPS/)
  assert.equal(normalizeKovaAccountServiceUrl('http://127.0.0.1:8787'), 'http://127.0.0.1:8787')
})

test('account login opens system browser and exchanges Google identity through PKCE', async () => {
  const requests: Array<{ url: string; body: any }> = []
  let authorizeUrl = ''
  const fakeServerState: { handler?: (request: any, response: any) => void; closed: boolean } = { closed: false }

  const createServer: any = (handler: any) => {
    const listeners = new Map<string, (value?: any) => void>()
    fakeServerState.handler = handler

    return {
      on: (name: string, fn: (value?: any) => void) => listeners.set(name, fn),
      listen: (_port: number, _host: string, ready: () => void) => ready(),
      address: () => ({ address: '127.0.0.1', family: 'IPv4', port: 32123 }),
      close: () => { fakeServerState.closed = true }
    }
  }

  const login = runKovaAccountLogin({
    serviceUrl: 'https://accounts.kova.example',
    googleClientId: 'desktop-client.apps.googleusercontent.com',
    createServer,
    openExternal: async url => {
      authorizeUrl = url
      const state = new URL(url).searchParams.get('state')
      queueMicrotask(() => fakeServerState.handler?.(
        { url: `/?code=google-auth-code&state=${encodeURIComponent(state || '')}` },
        { writeHead: () => undefined, end: () => undefined }
      ))
    },
    postJson: async (url, body) => {
      requests.push({ url, body })

      if (url.endsWith('/v1/auth/challenge')) {return { challenge_id: 'challenge-id-12345678901234567890123456789012', nonce: 'nonce-from-service' }}

      if (url.endsWith('/v1/auth/google')) {return { authorization_code: 'kova-authorization-code-12345678901234567890123456789012' }}

      return { session_token: 'kova-session-token', expires_at: 1_800_000_000, profile: { id: 'id', email: 'a@example.com' } }
    }
  })

  const fetchMock = async (_url: string, init: any) => {
    const form = new URLSearchParams(init.body)
    assert.equal(form.get('code'), 'google-auth-code')
    assert.equal(form.get('redirect_uri'), 'http://127.0.0.1:32123')

    return { ok: true, json: async () => ({ id_token: 'signed-google-id-token' }) }
  }

  const oldFetch = globalThis.fetch
  globalThis.fetch = fetchMock as any

  try {
    const result = await login
    assert.equal(result.profile.email, 'a@example.com')
  } finally {
    globalThis.fetch = oldFetch
  }

  const authorize = new URL(authorizeUrl)
  assert.equal(authorize.origin, 'https://accounts.google.com')
  assert.equal(authorize.searchParams.get('scope'), 'openid email profile')
  assert.equal(authorize.searchParams.get('nonce'), 'nonce-from-service')
  assert.equal(requests[1].url.endsWith('/v1/auth/google'), true)
  assert.equal(requests[1].body.id_token, 'signed-google-id-token')
  assert.equal(typeof requests[1].body.code_challenge, 'string')
  assert.equal(requests[2].url.endsWith('/v1/auth/exchange'), true)
  assert.equal(requests[2].body.code, 'kova-authorization-code-12345678901234567890123456789012')
  assert.equal(fakeServerState.closed, true)
})
