import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { KovaAccountProfile } from '@/global'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/

function initials(profile: KovaAccountProfile): string {
  return (profile.username || profile.google_name || profile.email)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'K'
}

export function KovaAccountCard({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  const account = window.kovaDesktop.account
  const [profile, setProfile] = useState<KovaAccountProfile | null>(null)
  const [configured, setConfigured] = useState(false)
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!account) {return}
    let current = true
    let request = 0

    const syncAccount = async () => {
      const requestId = ++request

      try {
        const status = await account.status()

        if (!current || requestId !== request) {return}
        setConfigured(status.configured)
        setProfile(status.profile)

        if (status.profile) {
          const refreshed = await account.refresh()

          if (current && requestId === request) {setProfile(refreshed)}
        }
      } catch {
        // Keep the last known profile visible when the service is temporarily unavailable.
      }
    }

    void syncAccount()
    window.addEventListener('focus', syncAccount)

    return () => {
      current = false
      window.removeEventListener('focus', syncAccount)
    }
  }, [account])

  const run = async (action: () => Promise<KovaAccountProfile>) => {
    setBusy(true)
    setError('')

    try {
      const next = await action()
      setProfile(next)
      setUsername(next.username || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  if (!account) {return null}

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-label={profile ? `${t.firstRun.account.title}: ${profile.username || profile.google_name}` : t.firstRun.account.title}
          className={cn(
            'mb-1 flex items-center rounded-xl border border-(--sidebar-edge-border) bg-(--ui-surface-background) transition-colors hover:bg-(--ui-control-hover-background)',
            compact ? 'size-8 justify-center p-0' : 'w-full gap-2 px-2 py-2 text-left',
            open && 'bg-(--ui-control-hover-background)'
          )}
          type="button"
        >
          {profile?.picture_url ? (
            <img alt="" className="size-8 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" src={profile.picture_url} />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--ui-control-hover-background) text-xs font-medium">{profile ? initials(profile) : 'K'}</span>
          )}
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{profile?.username ? `@${profile.username}` : profile?.google_name || 'Kova account'}</span>
              <span className="block truncate text-[10px] text-muted-foreground">{profile ? profile.email : configured ? t.firstRun.account.description : t.firstRun.account.unavailable}</span>
              </span>
              <span aria-hidden="true" className="text-xs text-muted-foreground">⌄</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3 p-3" side="top">
        <div>
          <div className="text-sm font-semibold">{t.firstRun.account.title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{t.firstRun.account.privacy}</p>
        </div>
        {profile ? (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="kova-username">{t.firstRun.account.username}</label>
              <div className="flex gap-2">
                <Input id="kova-username" maxLength={24} onChange={event => setUsername(event.target.value)} placeholder={t.firstRun.account.usernamePlaceholder} value={username || profile.username || ''} />
                <Button disabled={busy || !account || !USERNAME_PATTERN.test(username) || username === profile.username} onClick={() => account && void run(() => account.setUsername(username))} size="sm" type="button">{t.firstRun.account.saveUsername}</Button>
              </div>
              <p className="text-[10px] text-muted-foreground">{t.firstRun.account.usernameHint}</p>
            </div>
            <Button className="w-full" disabled={busy || !account} onClick={() => account && void account.signOut().then(() => { setProfile(null); setOpen(false) }).catch(cause => setError(cause instanceof Error ? cause.message : String(cause))).finally(() => setProfile(null))} size="sm" type="button" variant="outline">{t.firstRun.account.signOut}</Button>
          </>
        ) : (
          <div className="space-y-2">
            <Button className="w-full" disabled={!configured || busy || !account} onClick={() => account && void run(async () => (await account.signIn()).profile)} size="sm" type="button">{busy ? t.firstRun.account.working : t.firstRun.account.signIn}</Button>
            {!configured && <p className="text-xs text-muted-foreground">{t.firstRun.account.unavailable}</p>}
          </div>
        )}
        {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      </PopoverContent>
    </Popover>
  )
}
