import { useStore } from '@nanostores/react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { releaseTypingFocus } from '@/components/ui/keyboard-first'
import { Tip } from '@/components/ui/tooltip'
import { useI18n } from '@/i18n'
import { ChevronDown, ShieldLock } from '@/lib/icons'
import { cn } from '@/lib/utils'
import {
  $approvalModes,
  type ApprovalMode,
  type ApprovalModeRequester,
  setApprovalModeForProfile,
  syncApprovalModeForProfile
} from '@/store/approval-mode'
import { $gatewayState } from '@/store/session'

const PILL = cn(
  'h-(--composer-control-size) shrink-0 gap-1 rounded-full border border-transparent bg-background/45 px-2.5 text-xs font-normal',
  'text-(--ui-text-tertiary) hover:bg-(--chrome-action-hover) hover:text-foreground'
)

const MODES = ['manual', 'smart', 'off'] as const

/**
 * Composer approval selector (Codex: "Ask for approval" pill inside the
 * prompt bar): the active approval mode as a pill next to the model pill,
 * opening the three modes with descriptions. The store is profile-scoped
 * and gateway-synced exactly like the old statusbar chip — this pill is
 * its new home.
 */
export function ApprovalPill({
  disabled,
  gateway,
  profile
}: {
  disabled: boolean
  gateway: ApprovalModeRequester | null
  profile: string | null | undefined
}) {
  const { t } = useI18n()
  const copy = t.shell.approvalMode
  const gatewayState = useStore($gatewayState)
  const modes = useStore($approvalModes)
  const [open, setOpen] = useState(false)

  const profileKey = (profile ?? '').trim()
  const mode = modes[profileKey || 'default'] ?? 'smart'

  const labels = useMemo<Record<ApprovalMode, string>>(
    () => ({ manual: copy.manual, smart: copy.smart, off: copy.off }),
    [copy.manual, copy.off, copy.smart]
  )

  const descriptions = useMemo<Record<ApprovalMode, string>>(
    () => ({
      manual: copy.manualDescription,
      smart: copy.smartDescription,
      off: copy.offDescription
    }),
    [copy.manualDescription, copy.offDescription, copy.smartDescription]
  )

  useEffect(() => {
    // Same boot rule as the statusbar chip: sync only once the socket is
    // open, or the early request rejects and the pill sits on its default.
    if (!gateway || gatewayState !== 'open') {
      return
    }

    void syncApprovalModeForProfile(gateway, profileKey).catch(() => undefined)
  }, [gateway, gatewayState, profileKey])

  const setMenuOpen = (next: boolean) => {
    setOpen(next)

    if (!next) {
      releaseTypingFocus()
    }
  }

  return (
    <DropdownMenu onOpenChange={setMenuOpen} open={open}>
      <Tip label={copy.title} side="top">
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={copy.ariaLabel(labels[mode])}
            className={PILL}
            data-testid="approval-pill"
            disabled={disabled || !gateway}
            type="button"
            variant="ghost"
          >
            <ShieldLock className="size-3 shrink-0 opacity-70" />
            <span>{labels[mode]}</span>
            <ChevronDown className="size-2.5 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end" className="w-72 p-1.5" side="top" sideOffset={8}>
        <DropdownMenuLabel className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-(--ui-text-secondary)">
          {copy.title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="-mx-0" />
        <DropdownMenuRadioGroup
          onValueChange={value => {
            if (gateway) {
              void setApprovalModeForProfile(gateway, profileKey, value as ApprovalMode).catch(() => undefined)
            }
          }}
          value={mode}
        >
          {MODES.map(value => (
            <DropdownMenuRadioItem className="items-start gap-2 rounded-xl px-2.5 py-2" key={value} value={value}>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-foreground">{labels[value]}</span>
                <span className="text-[0.6875rem] leading-snug text-(--ui-text-tertiary)">{descriptions[value]}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
