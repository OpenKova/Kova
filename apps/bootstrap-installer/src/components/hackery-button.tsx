import { ArrowRight, Loader2 } from 'lucide-react'

import { cn } from '../lib/utils'

export function HackeryButton({
  className,
  label,
  loading,
  ...props
}: Omit<React.ComponentProps<'button'>, 'children'> & { label: React.ReactNode; loading?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-2.5',
        'text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      type="button"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      <span>{label}</span>
      {!loading && <ArrowRight className="size-4" />}
    </button>
  )
}
