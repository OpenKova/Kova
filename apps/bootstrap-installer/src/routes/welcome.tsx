import { ArrowDownToLine, Blocks, Bot, Check } from 'lucide-react'

import { HackeryButton } from '../components/hackery-button'
import { startInstall } from '../store'

const INCLUDED = [
  { icon: Bot, label: 'Kova Agent and local gateway' },
  { icon: Blocks, label: 'Desktop workspace and core tools' },
  { icon: ArrowDownToLine, label: 'Required runtimes and dependencies' }
]

export default function Welcome() {
  return (
    <div className="kova-fade-in flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-8 py-7 sm:px-12">
      <div className="grid w-full max-w-5xl items-center gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
        <section className="max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your AI workspace</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl">
            Kova is ready when you are.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Set up your agent once, then work from the desktop or wherever you already use Kova.
          </p>
          <div className="mt-8">
            <HackeryButton label="Install Kova" onClick={() => void startInstall()} />
            <p className="mt-3 text-xs text-muted-foreground">
              First setup can take a few minutes. You&rsquo;ll see each step as it runs.
            </p>
          </div>
        </section>

        <aside className="rounded-xl border border-border bg-card p-6 sm:p-7">
          <p className="text-sm font-semibold">Included in setup</p>
          <ul className="mt-5 space-y-4">
            {INCLUDED.map(({ icon: Icon, label }) => (
              <li className="flex items-start gap-3 text-sm text-muted-foreground" key={label}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="pt-1.5">{label}</span>
                <Check aria-hidden className="ml-auto mt-1 size-4 shrink-0 text-primary" />
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            Your chats, credentials, and settings stay on this device.
          </div>
        </aside>
      </div>
    </div>
  )
}
