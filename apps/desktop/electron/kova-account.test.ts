import assert from 'node:assert/strict'

import { test } from 'vitest'

import { normalizeKovaAccountServiceUrl, runKovaAccountLogin } from './kova-account'

test('account service URL is normalized and rejects insecure non-local origins', () => {
  assert.equal(normalizeKovaAccountServiceUrl('https://accounts.kova.example/v1/'), 'https://accounts.kova.example/v1')
  assert.throws(() => normalizeKovaAccountServiceUrl('http://accounts.example'), /HTTPS/)
  assert.equal(normalizeKovaAccountServiceUrl('http://127.0.0.1:8787'), 'http://127.0.0.1:8787')
})

test('account login exchanges the Google authorization code through the account service', async () => {
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

  const result = await login
  assert.equal(result.profile.email, 'a@example.com')

  const authorize = new URL(authorizeUrl)
  assert.equal(authorize.origin, 'https://accounts.google.com')
  assert.equal(authorize.searchParams.get('scope'), 'openid email profile')
  assert.equal(authorize.searchParams.get('nonce'), 'nonce-from-service')
  assert.equal(requests[1].url.endsWith('/v1/auth/google/native'), true)
  assert.equal(requests[1].body.google_code, 'google-auth-code')
  assert.equal(requests[1].body.redirect_uri, 'http://127.0.0.1:32123')
  assert.match(requests[1].body.code_verifier, /^[A-Za-z0-9_-]{64}$/)
  assert.equal(requests[2].url.endsWith('/v1/auth/exchange'), true)
  assert.equal(requests[2].body.code, 'kova-authorization-code-12345678901234567890123456789012')
  assert.equal(fakeServerState.closed, true)
})
