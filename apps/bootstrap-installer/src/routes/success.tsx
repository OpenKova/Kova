import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../components/button'
import { launchKovaDesktop } from '../store'

export default function Success() {
  const [error, setError] = useState<string | null>(null)
  const [launching, setLaunching] = useState(false)

  async function handleLaunch() {
    setError(null)
    setLaunching(true)

    try {
      await launchKovaDesktop()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setLaunching(false)
    }
  }

  return (
    <div className="kova-fade-in flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-8 py-10">
      <div className="w-full max-w-lg text-center">
        <CheckCircle2 aria-hidden className="mx-auto size-12 text-primary" strokeWidth={1.6} />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Setup complete</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Kova is ready.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your workspace is installed. Open Kova now, or start it later with <code className="font-mono">kova desktop</code>.
        </p>
        <Button className="mt-7 min-h-11 px-5" disabled={launching} onClick={() => void handleLaunch()}>
          {launching ? 'Launching…' : 'Launch Kova'}
        </Button>
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-left" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Couldn&rsquo;t launch Kova</p>
              <p className="mt-1 break-words text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
