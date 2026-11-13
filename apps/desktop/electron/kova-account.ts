import crypto from 'node:crypto'
import http from 'node:http'
import type { AddressInfo } from 'node:net'

export interface KovaAccountProfile {
  id: string
  email: string
  google_name: string
  picture_url: string | null
  username: string | null
}

export interface KovaAccountSession {
  session_token: string
  expires_at: number
  profile: KovaAccountProfile
}

export interface KovaAccountDeps {
  serviceUrl: string
  googleClientId: string
  openExternal: (url: string) => Promise<void>
  postJson: (url: string, body: unknown) => Promise<any>
  now?: () => number
  createServer?: typeof http.createServer
}

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000

function baseUrl(value: string): string {
  const parsed = new URL(value)

  if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
    throw new Error('Kova Account Service must use HTTPS.')
  }

  parsed.pathname = parsed.pathname.replace(/\/$/, '')
  parsed.search = ''
  parsed.hash = ''

  return parsed.toString().replace(/\/$/, '')
}

function randomUrlToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

export async function runKovaAccountLogin(deps: KovaAccountDeps): Promise<KovaAccountSession> {
  if (!deps.serviceUrl || !deps.googleClientId) {throw new Error('Kova account sign-in is not configured for this build.')}
  const root = baseUrl(deps.serviceUrl)
  const challenge = await deps.postJson(`${root}/v1/auth/challenge`, {})

  if (typeof challenge?.challenge_id !== 'string' || typeof challenge?.nonce !== 'string') {
    throw new Error('Kova Account Service returned an invalid sign-in challenge.')
  }

  const verifier = randomUrlToken(48)
  const challengeHash = crypto.createHash('sha256').update(verifier).digest('base64url')
  const state = randomUrlToken()
  const serverFactory = deps.createServer ?? http.createServer

  const callback = await new Promise<{ code: string; redirectUri: string }>((resolve, reject) => {
    let settled = false
    let timer: NodeJS.Timeout
    let server: http.Server

    const finish = (error?: Error, code?: string, redirectUri?: string) => {
      if (settled) {return}
      settled = true
      clearTimeout(timer)
      server.close()

      if (error) {reject(error)}
      else {resolve({ code: code!, redirectUri: redirectUri! })}
    }

    server = serverFactory((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end('<!doctype html><meta charset="utf-8"><title>Kova</title><p>You can close this window and return to Kova.</p>')

      if (url.pathname !== '/') {return}

      if (url.searchParams.get('state') !== state) {return finish(new Error('Google sign-in state did not match.'))}

      if (url.searchParams.has('error')) {return finish(new Error('Google sign-in was cancelled or denied.'))}
      const code = url.searchParams.get('code')

      if (!code) {return finish(new Error('Google did not return a sign-in code.'))}
      const address = server.address() as AddressInfo
      finish(undefined, code, `http://127.0.0.1:${address.port}`)
    })
    server.on('error', error => finish(error))
    timer = setTimeout(() => finish(new Error('Google sign-in timed out.')), LOGIN_TIMEOUT_MS)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo
      const redirectUri = `http://127.0.0.1:${address.port}`
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      url.search = new URLSearchParams({
        client_id: deps.googleClientId,
        code_challenge: challengeHash,
        code_challenge_method: 'S256',
        nonce: challenge.nonce,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state
      }).toString()
      deps.openExternal(url.toString()).catch(error => finish(error instanceof Error ? error : new Error(String(error))))
    })
  })

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(15_000),
    body: new URLSearchParams({
      client_id: deps.googleClientId,
      code: callback.code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: callback.redirectUri
    })
  })

  if (!tokenResponse.ok) {
    const payload = await tokenResponse.json().catch(() => null) as { error?: unknown } | null
    const reason = typeof payload?.error === 'string' ? payload.error : `HTTP ${tokenResponse.status}`
    throw new Error(`Google could not complete sign-in (${reason}).`)
  }
  const tokens = await tokenResponse.json() as { id_token?: unknown }

  if (typeof tokens.id_token !== 'string') {throw new Error('Google did not return an identity token.')}

  const authorized = await deps.postJson(`${root}/v1/auth/google`, {
    challenge_id: challenge.challenge_id,
    id_token: tokens.id_token,
    code_challenge: challengeHash
  })

  if (typeof authorized?.authorization_code !== 'string') {throw new Error('Kova Account Service returned an invalid authorization code.')}

  const signedIn = await deps.postJson(`${root}/v1/auth/exchange`, {
    challenge_id: challenge.challenge_id,
    code: authorized.authorization_code,
    code_verifier: verifier
  })

  if (typeof signedIn?.session_token !== 'string' || !signedIn.profile) {
    throw new Error('Kova Account Service returned an invalid session.')
  }

  return signedIn as KovaAccountSession
}

export function normalizeKovaAccountServiceUrl(value: string): string {
  return baseUrl(value)
}

export function kovaAccountApiUrl(serviceUrl: string, pathname: string): string {
  return `${baseUrl(serviceUrl)}${pathname}`
}
