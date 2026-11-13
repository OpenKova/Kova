import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { cn } from '../lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] text-sm leading-5 font-medium whitespace-nowrap shadow-none transition-[background-color,color,border-color] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-default disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-secondary hover:text-foreground',
        secondary:
          'bg-(--ui-bg-quaternary) text-(--ui-text-primary) hover:bg-(--chrome-action-hover) hover:text-(--ui-text-primary)',
        ghost: 'text-(--ui-text-secondary) hover:bg-(--chrome-action-hover) hover:text-(--ui-text-primary)',
        link: 'text-primary underline-offset-4 decoration-current/20 hover:underline',
        text: 'text-muted-foreground underline-offset-4 hover:text-foreground hover:underline',
        textStrong: 'font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground'
      },
      size: {
        default: 'px-3 py-1.5 has-[>svg]:px-2.5',
        xs: "gap-1 px-2 py-0.5 text-[0.6875rem] leading-4 has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'px-2.5 py-1 has-[>svg]:px-2',
        lg: 'px-5 py-2 text-sm leading-5 has-[>svg]:px-4',
        inline: 'h-auto gap-1 p-0 has-[>svg]:px-0',
        icon: 'size-9 rounded-[10px]',
        'icon-xs': "size-7 rounded-[8px] [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8 rounded-[9px]',
        'icon-lg': 'size-10 rounded-[11px]'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      data-size={size}
      data-slot="button"
      data-variant={variant}
      {...props}
    />
  )
}

export { buttonVariants }
