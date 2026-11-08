import { describe, expect, it } from 'vitest'

import { commandLineIsKovaRuntime } from './kova-process'

// HX003: process identity comes from a whole argv TOKEN, never an argv substring.
describe('commandLineIsKovaRuntime (HX003 token matching)', () => {
  it('matches a real Kova gateway command line', () => {
    expect(commandLineIsKovaRuntime('kova\0gateway\0run')).toBe(true)
    expect(commandLineIsKovaRuntime('kova gateway run')).toBe(true)
    expect(commandLineIsKovaRuntime('kova --profile work gateway run')).toBe(true)
  })

  it('matches a Kova launched by an interpreter (basename of a path token)', () => {
    expect(commandLineIsKovaRuntime('/venv/bin/python\0/venv/bin/kova\0gateway\0run')).toBe(true)
    expect(commandLineIsKovaRuntime('C:\\Kova\\kova.exe gateway run')).toBe(true)
  })

  // The bug this replaces: a bare `.includes('kova')` matched any of these.
  it('does NOT match an unrelated process whose path merely contains "kova"', () => {
    expect(commandLineIsKovaRuntime('vim /home/user/kova-notes.txt')).toBe(false)
    expect(commandLineIsKovaRuntime('/opt/kovabrew/bin/tool --run')).toBe(false)
    expect(commandLineIsKovaRuntime('node /srv/kova-dashboard/server.js')).toBe(false)
    expect(commandLineIsKovaRuntime('cat ~/.kova/config.yaml')).toBe(false)
  })

  // G2 (#150283): the real unmanaged-gateway launch is `python -m kova_cli.main … gateway
  // run`, which the executable-basename-only matcher REJECTED — so findRunningGatewayProfiles
  // missed a live gateway at first launch / profile repair. Mirror the canonical Python matcher
  // (gateway.status.looks_like_gateway_command_line): recognize the module entry point, by argv
  // TOKENS not a substring, carrying the gateway subcommand.
  it('matches a module-launched gateway (python -m kova_cli.main … gateway run)', () => {
    expect(commandLineIsKovaRuntime('python\0-m\0kova_cli.main\0-p\0x\0gateway\0run')).toBe(true)
    expect(commandLineIsKovaRuntime('python -m kova_cli.main -p x gateway run')).toBe(true)
    expect(commandLineIsKovaRuntime('/venv/bin/python /venv/lib/kova_cli/main.py gateway run')).toBe(true)
    expect(commandLineIsKovaRuntime('python -m kova_cli.main --profile work gateway run')).toBe(true)
  })

  it('does NOT match a module entry without the gateway subcommand, nor an unrelated kova-tool path', () => {
    // A kova_cli.main invocation that is not a gateway (e.g. `chat`) is not a running gateway.
    expect(commandLineIsKovaRuntime('python -m kova_cli.main chat')).toBe(false)
    // HX003: no substring; an unrelated tool whose path contains "kova" is never a runtime.
    expect(commandLineIsKovaRuntime('/opt/kova-tool/foo gateway run')).toBe(false)
    // `-p gateway` is a profile value, not a subcommand.
    expect(commandLineIsKovaRuntime('python -m kova_cli.main -p gateway chat')).toBe(false)
  })
})
