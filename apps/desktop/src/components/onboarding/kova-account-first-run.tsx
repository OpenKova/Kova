import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
      if (current) {setProfile(status.profile)}
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

  const continueSetup = () => {
    onContinue()
  }

  return (
    <Dialog onOpenChange={next => { if (!next) {continueSetup()} }} open={open}>
      <DialogContent bodyClassName="gap-5 p-6" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.firstRun.account.title}</DialogTitle>
          <DialogDescription>{t.firstRun.account.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <p className="text-xs leading-5 text-muted-foreground">{t.firstRun.account.privacy}</p>
          {profile ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium">{profile.email}</p>
              {profile.username ? (
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
              ) : (
                <>
                  <label className="text-xs font-medium" htmlFor="kova-first-run-username">{t.firstRun.account.username}</label>
                  <Input autoComplete="username" autoFocus id="kova-first-run-username" maxLength={24} onChange={event => setUsername(event.target.value)} placeholder={t.firstRun.account.usernamePlaceholder} value={username} />
                  <p className="text-[11px] text-muted-foreground">{t.firstRun.account.usernameHint}</p>
                  <Button disabled={busy || !USERNAME_PATTERN.test(username)} onClick={() => account && void run(() => account.setUsername(username))} type="button">
                    {busy ? t.firstRun.account.working : t.firstRun.account.saveUsername}
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Button disabled={busy || !account} onClick={() => account && void run(() => account.signIn())} type="button">
              {busy ? t.firstRun.account.working : t.firstRun.account.signIn}
            </Button>
          )}
          {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button onClick={continueSetup} type="button" variant="text">{t.firstRun.account.notNow}</Button>
          {profile?.username && <Button onClick={continueSetup} type="button">{t.firstRun.account.continue}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
