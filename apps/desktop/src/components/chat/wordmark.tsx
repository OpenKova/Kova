import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

/** A restrained chat title shared by bot empty states. */
export function Wordmark({
  className,
  fitMin = '1.5rem',
  text,
  width = 'calc(100% - 1rem)'
}: {
  className?: string
  /** Minimum title size, as a CSS length. */
  fitMin?: string
  text: string
  /** Width available to the title. */
  width?: string
}) {
  return (
    <h1
      className={cn(
        'mx-auto max-w-full font-sans text-center font-semibold leading-tight tracking-[-0.035em] text-foreground text-balance',
        className
      )}
      style={{ fontSize: `clamp(${fitMin}, 3.2vw, 2.5rem)`, width } as CSSProperties}
    >
      {text}
    </h1>
  )
}
