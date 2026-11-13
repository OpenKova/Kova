import { useStore } from '@nanostores/react'
import { useEffect } from 'react'

import { BrandMark } from './components/brand-mark'
import Failure from './routes/failure'
import Progress from './routes/progress'
import Success from './routes/success'
import Welcome from './routes/welcome'
import { $bootstrap, $mode, $route, initialize } from './store'

/*
 * App shell — Kova Setup.
 *
 * No header chrome (the OS title bar already says "Kova Setup"; an
 * in-window repeat of the H mark + words was redundant slop).
 *
 * Route state lives in a single $route atom — 4 screens, no react-router.
 */
export default function App() {
  const route = useStore($route)
  const bootstrap = useStore($bootstrap)
  const mode = useStore($mode)

  useEffect(() => {
    void initialize()
  }, [])

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-7">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-7" />
          <span className="text-sm font-semibold tracking-tight">Kova Setup</span>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {mode === 'update' ? 'Update' : 'Setup'}
        </span>
      </header>
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {route === 'welcome' && <Welcome />}
        {route === 'progress' && <Progress bootstrap={bootstrap} />}
        {route === 'success' && <Success />}
        {route === 'failure' && <Failure bootstrap={bootstrap} />}
      </main>
    </div>
  )
}
