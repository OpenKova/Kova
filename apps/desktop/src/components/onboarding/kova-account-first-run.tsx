import { useEffect, useState } from 'react'

import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { KovaAccountProfile } from '@/global'
import { useI18n } from '@/i18n'

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,24}$/

export function KovaAccountFirstRun({ onContinue, open }: { onContinue: () => void; open: boolean }) {
  const { t } = useI18n()
  const account = window.kovaDesktop?.account
  const [profile, setProfile] = useState<KovaAccountProfile | null>(null)
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !account) {return}
    let current = true
    void account.status().then(status => {
      if (current) {
        setProfile(status.profile)
        setUsername(status.profile?.username ?? '')
      }
    }).catch(() => undefined)

    return () => { current = false }
  }, [account, open])

  const run = async (action: () => Promise<{ profile: KovaAccountProfile } | KovaAccountProfile>) => {
    setBusy(true)
    setError('')

    try {
      const result = await action()
      const next = 'profile' in result ? result.profile : result
      setProfile(next)
      setUsername(next.username ?? '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  const continueSetup = () => onContinue()

  return (
    <Dialog onOpenChange={next => { if (!next) {continueSetup()} }} open={open}>
      <DialogContent blurBackdrop={false} bodyClassName="grid h-full w-full max-h-none place-items-center overflow-y-auto p-6 sm:p-10" fullScreen showCloseButton={false}>
        <main className="relative grid w-full max-w-[30rem] gap-8" data-glass-opaque="">
          <header className="grid justify-items-center gap-4 text-center">
            <BrandMark className="size-[4.5rem]" />
            <div className="grid gap-2">
              <DialogTitle className="text-2xl font-semibold tracking-tight">{t.firstRun.account.title}</DialogTitle>
              <DialogDescription className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">{t.firstRun.account.description}</DialogDescription>
            </div>
          </header>

          <section aria-label={t.firstRun.account.title} className="grid gap-5 rounded-2xl border border-(--stroke-nous) bg-(--ui-chat-bubble-background) p-6 shadow-nous sm:p-8">
            {profile ? (
              <div className="grid gap-5">
                <div className="grid gap-1 rounded-xl bg-(--ui-chat-surface-background) px-4 py-3">
                  <span className="truncate text-sm font-medium">{profile.email}</span>
                </div>
                {profile.username ? (
                  <p className="text-sm text-muted-foreground">{t.firstRun.account.username}: <span className="font-medium text-foreground">@{profile.username}</span></p>
                ) : (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="kova-first-run-username">{t.firstRun.account.username}</label>
                    <Input autoComplete="username" autoFocus id="kova-first-run-username" maxLength={24} onChange={event => setUsername(event.target.value)} placeholder={t.firstRun.account.usernamePlaceholder} value={username} />
                    <p className="text-xs leading-5 text-muted-foreground">{t.firstRun.account.usernameHint}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                <Button className="h-11 w-full" disabled={busy || !account} onClick={() => account && void run(() => account.signIn())} type="button">
                  {busy ? t.firstRun.account.working : t.firstRun.account.signIn}
                </Button>
                <p className="text-center text-xs leading-5 text-muted-foreground">{t.firstRun.account.privacy}</p>
              </div>
            )}

            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

            <div className="flex flex-col-reverse gap-2 border-t border-(--stroke-nous) pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button className="text-muted-foreground" onClick={continueSetup} type="button" variant="text">{t.firstRun.account.notNow}</Button>
              {profile?.username ? (
                <Button className="h-10 px-5" onClick={continueSetup} type="button">{t.firstRun.account.continue}</Button>
              ) : profile ? (
                <Button className="h-10 px-5" disabled={busy || !USERNAME_PATTERN.test(username)} onClick={() => account && void run(() => account.setUsername(username))} type="button">
                  {busy ? t.firstRun.account.working : t.firstRun.account.saveUsername}
                </Button>
              ) : null}
            </div>
          </section>
        </main>
      </DialogContent>
    </Dialog>
  )
}
