import { ChevronDown, LogOut, ShieldCheck } from 'lucide-react'
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
            'mb-1 flex items-center rounded-2xl bg-(--ui-bg-tertiary) text-left transition-colors hover:bg-(--ui-control-hover-background) focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50',
            compact ? 'size-9 justify-center p-0' : 'min-h-12 w-full gap-2.5 px-2.5 py-2',
            open && 'bg-(--ui-control-hover-background)'
          )}
          type="button"
        >
          {profile?.picture_url ? (
            <img alt="" className="size-8 shrink-0 rounded-full object-cover ring-1 ring-border/70" referrerPolicy="no-referrer" src={profile.picture_url} />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/10">{profile ? initials(profile) : 'K'}</span>
          )}
          {!compact && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{profile?.username ? `@${profile.username}` : profile?.google_name || t.firstRun.account.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{profile ? profile.email : configured ? t.firstRun.account.description : t.firstRun.account.unavailable}</span>
              </span>
              <ChevronDown aria-hidden="true" className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[19rem] overflow-hidden p-0" side="top" variant="menu">
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5">
          {profile?.picture_url ? (
            <img alt="" className="size-10 shrink-0 rounded-full object-cover ring-1 ring-border/70" referrerPolicy="no-referrer" src={profile.picture_url} />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-1 ring-primary/10">{profile ? initials(profile) : 'K'}</span>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{profile?.username ? `@${profile.username}` : profile?.google_name || t.firstRun.account.title}</div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{profile?.email || t.firstRun.account.privacy}</p>
          </div>
        </div>
        {profile ? (
          <>
            <div className="space-y-2.5 px-4 py-4">
              <label className="block text-xs font-medium" htmlFor="kova-username">{t.firstRun.account.username}</label>
              <div className="flex gap-2">
                <Input className="h-9 min-w-0 rounded-xl" id="kova-username" maxLength={24} onChange={event => setUsername(event.target.value)} placeholder={t.firstRun.account.usernamePlaceholder} value={username || profile.username || ''} />
                <Button className="h-9 shrink-0 rounded-xl px-3" disabled={busy || !account || !USERNAME_PATTERN.test(username) || username === profile.username} onClick={() => account && void run(() => account.setUsername(username))} size="sm" type="button">{t.firstRun.account.saveUsername}</Button>
              </div>
              <p className="text-[11px] leading-4 text-muted-foreground">{t.firstRun.account.usernameHint}</p>
            </div>
            <div className="border-t border-border/70 p-2">
              <Button className="h-9 w-full justify-start rounded-xl px-2.5" disabled={busy || !account} onClick={() => account && void account.signOut().then(() => { setProfile(null); setOpen(false) }).catch(cause => setError(cause instanceof Error ? cause.message : String(cause))).finally(() => setProfile(null))} size="sm" type="button" variant="ghost">
                <LogOut aria-hidden className="size-3.5" />
                {t.firstRun.account.signOut}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3 p-4">
            <div className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{configured ? t.firstRun.account.description : t.firstRun.account.unavailable}</span>
            </div>
            <Button className="h-9 w-full rounded-xl" disabled={!configured || busy || !account} onClick={() => account && void run(async () => (await account.signIn()).profile)} size="sm" type="button">{busy ? t.firstRun.account.working : t.firstRun.account.signIn}</Button>
          </div>
        )}
        {error && <p className="mx-3 mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive" role="alert">{error}</p>}
      </PopoverContent>
    </Popover>
  )
}
