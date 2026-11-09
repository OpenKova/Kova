import { REASONING_EFFORTS, type ReasoningEffort } from '@kova/shared'

import { DropdownMenuItem, dropdownMenuRow } from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { useI18n } from '@/i18n'
import { currentModelCapabilities } from '@/lib/model-options'
import { reasoningEffortLabel, resolveReasoningEffort } from '@/lib/reasoning-effort'
import { cn } from '@/lib/utils'

import { type ModelMenuHostProps, useModelMenuController } from './use-model-menu-controller'

/**
 * The composer's reasoning menu: a Codex-style moving bar instead of a list.
 * The active effort level is the label on top (accent), the model name sits
 * beneath it, and the slider's seven stops are the effort levels
 * (minimal → ultra). The same controller as the model menu backs it, so an
 * edit here and an edit in the catalog submenu are one code path.
 */
export function ReasoningMenuPanel(props: ModelMenuHostProps) {
  const { t } = useI18n()
  const copy = t.shell.modelOptions
  const { controller, defaultEffort, modelOptions } = useModelMenuController(props)
  const { model, provider } = controller.current
  const caps = currentModelCapabilities(modelOptions.data, provider, model)

  if (!model) {
    return (
      <DropdownMenuItem className={dropdownMenuRow} disabled>
        {t.shell.modelOptions.noOptions}
      </DropdownMenuItem>
    )
  }

  const row = { isActive: true, model, provider }
  const effortValue = resolveReasoningEffort(controller.current.effort, defaultEffort)
  const index = Math.max(0, REASONING_EFFORTS.indexOf(effortValue as ReasoningEffort))
  const rawLabel = copy[effortValue as keyof typeof copy]
  const label = typeof rawLabel === 'string' ? rawLabel : reasoningEffortLabel(effortValue, controller.current.effortWire)

  return (
    <div className="w-64 px-3.5 pb-3 pt-2.5">
      <div className="text-center">
        <div className="text-[0.8125rem] font-semibold text-(--ui-accent)">{label}</div>
        <div className="truncate text-[0.6875rem] text-(--ui-text-tertiary)">{model}</div>
      </div>
      <Slider
        aria-label={copy.effort}
        className="mt-3 w-full"
        max={REASONING_EFFORTS.length - 1}
        min={0}
        onChange={event => {
          const next = REASONING_EFFORTS[Number(event.target.value)]

          if (next) {
            controller.setOptions({ effort: next }, row)
          }
        }}
        step={1}
        value={index}
      />
      <div aria-hidden className="mt-1.5 flex justify-between px-0.5">
        {REASONING_EFFORTS.map((level, levelIndex) => (
          <span
            className={cn(
              'size-1 rounded-full',
              levelIndex === index ? 'bg-(--ui-accent)' : 'bg-(--ui-text-tertiary)/50'
            )}
            key={level}
          />
        ))}
      </div>
      {caps?.reasoning === false ? <div className="mt-2 text-center text-[0.6875rem] text-(--ui-text-tertiary)">{copy.noOptions}</div> : null}
    </div>
  )
}
