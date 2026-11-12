import { compactNumber } from '@kova/shared'
import { useStore } from '@nanostores/react'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { LogSearchField, useLogSearch } from '@/components/chat/log-search'
import { LogTail } from '@/components/chat/log-tail'
import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { ResponsiveTabs } from '@/components/ui/tab-dropdown'
import { useI18n } from '@/i18n'
import { getActionStatus, getLogs, getStatus, getUsageAnalytics, restartGateway, updateKova } from '@/kova'
import type { ActionStatusResponse, AnalyticsResponse, StatusResponse } from '@/kova'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Wrench
} from '@/lib/icons'
import { isSignedOutStatus } from '@/lib/signed-out-status'
import { cn } from '@/lib/utils'
import { upsertDesktopActionTask } from '@/store/activity'
import { $cloudOwnsUpdates } from '@/store/cloud-updates'
import { notify } from '@/store/notifications'
import { confirmSharedGatewayRestart } from '@/store/system-actions'

import { useRefreshHotkey } from '../hooks/use-refresh-hotkey'
import { useRouteEnumParam } from '../hooks/use-route-enum-param'
import { PAGE_INSET_X } from '../layout-constants'
import { OverlayBreadcrumbHeader } from '../overlays/overlay-breadcrumb-header'
import { OverlayMain, OverlayNav, OverlaySplitLayout } from '../overlays/overlay-split-layout'
import { OverlayView } from '../overlays/overlay-view'

import { MaintenancePanel } from './maintenance'

export type CommandCenterSection = 'maintenance' | 'system' | 'usage'

const SECTIONS = ['usage', 'system', 'maintenance'] as const satisfies readonly CommandCenterSection[]

const LOG_FILES = ['agent', 'errors', 'gateway', 'desktop'] as const
const LOG_LEVELS = ['ALL', 'INFO', 'WARNING', 'ERROR'] as const

const USAGE_PERIODS = [7, 30, 90] as const
type UsagePeriod = (typeof USAGE_PERIODS)[number]

interface CommandCenterViewProps {
  initialSection?: CommandCenterSection
  onClose: () => void
}

/** The System card's Update button. Kova Cloud updates its agents itself, so it has none there. */
function UpdateKovaButton({ label, onClick }: { label: string; onClick: () => void }) {
  if (useStore($cloudOwnsUpdates).backend) {
    return null
  }

  return (
    <Button onClick={onClick} size="xs" variant="textStrong">
      {label}
    </Button>
  )
}

function EmptyPanel({ action, description, title }: { action?: ReactNode; description: string; title?: string }) {
  return (
    <div className="grid min-h-48 place-items-center px-6 text-center">
      <div>
        {title && (
          <div className="text-[length:var(--conversation-text-font-size)] font-medium text-foreground">{title}</div>
        )}
        <div className="mt-1 text-[length:var(--conversation-caption-font-size)] leading-(--conversation-caption-line-height) text-(--ui-text-tertiary)">
          {description}
        </div>
        {action && <div className="mt-3 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}

export function CommandCenterView({
  initialSection,
  onClose
}: CommandCenterViewProps) {
  const { t } = useI18n()
  const cc = t.commandCenter
  const [section, setSection] = useRouteEnumParam('section', SECTIONS, initialSection ?? 'usage')
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [logFile, setLogFile] = useState<(typeof LOG_FILES)[number]>('agent')
  const [logLevel, setLogLevel] = useState<(typeof LOG_LEVELS)[number]>('ALL')
  const [logQuery, setLogQuery] = useState('')
  const [systemLoading, setSystemLoading] = useState(false)
  const [systemError, setSystemError] = useState('')
  const [systemAction, setSystemAction] = useState<ActionStatusResponse | null>(null)
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>(30)
  const [usage, setUsage] = useState<AnalyticsResponse | null>(null)
  const [usageLoading, setUsageLoading] = useState(false)
  const [usageError, setUsageError] = useState('')
  const usageRequestRef = useRef(0)

  const refreshSystem = useCallback(async () => {
    setSystemLoading(true)
    setSystemError('')

    try {
      const [nextStatus, nextLogs] = await Promise.all([
        getStatus(),
        getLogs({
          file: logFile,
          level: logLevel,
          lines: 200
        })
      ])

      // The Webapp's signed-out body (an access token expired since the last gated request) leaves
      // out what this panel shows, so the last full answer stays up.
      setStatus(previous => (previous && isSignedOutStatus(nextStatus) ? previous : nextStatus))
      setLogs(nextLogs.lines)
    } catch (error) {
      setSystemError(error instanceof Error ? error.message : String(error))
    } finally {
      setSystemLoading(false)
    }
  }, [logFile, logLevel])

  const refreshUsage = useCallback(async (days: UsagePeriod) => {
    const requestId = usageRequestRef.current + 1
    usageRequestRef.current = requestId
    setUsageLoading(true)
    setUsageError('')

    try {
      const response = await getUsageAnalytics(days)

      if (usageRequestRef.current === requestId) {
        setUsage(response)
      }
    } catch (error) {
      if (usageRequestRef.current === requestId) {
        setUsageError(error instanceof Error ? error.message : String(error))
      }
    } finally {
      if (usageRequestRef.current === requestId) {
        setUsageLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // Refetch when the panel opens and whenever the log file/level filters
    // change (refreshSystem's identity tracks them).
    if (section === 'system') {
      void refreshSystem()
    }
  }, [refreshSystem, section])

  useEffect(() => {
    if (section === 'usage') {
      void refreshUsage(usagePeriod)
    }
  }, [refreshUsage, section, usagePeriod])

  useRefreshHotkey(() => {
    if (section === 'system') {
      void refreshSystem()
    } else if (section === 'usage') {
      void refreshUsage(usagePeriod)
    }
  })

  const logSearch = useLogSearch(logs, logQuery)

  const runSystemAction = useCallback(
    async (kind: 'restart' | 'update') => {
      setSystemError('')

      // A profile served by the shared multiplexer restarts every bot on this device: ask first.
      const shared = kind === 'restart' ? await confirmSharedGatewayRestart() : null

      if (shared === false) {
        return
      }

      try {
        const started = kind === 'restart' ? await restartGateway() : await updateKova()
        let nextStatus: ActionStatusResponse | null = null

        for (let attempt = 0; attempt < 18; attempt += 1) {
          await new Promise(resolve => window.setTimeout(resolve, 1200))
          const polled = await getActionStatus(started.name, 180)
          nextStatus = polled
          setSystemAction(polled)
          upsertDesktopActionTask(polled)

          if (!polled.running) {
            break
          }
        }

        if (shared && nextStatus && !nextStatus.running && (nextStatus.exit_code ?? 0) === 0) {
          notify({ kind: 'success', message: cc.sharedGatewayRestarted(shared.length) })
        }

        if (!nextStatus) {
          const pendingStatus = {
            exit_code: null,
            lines: [cc.actionStartedWaiting],
            name: started.name,
            pid: started.pid,
            running: true
          }

          setSystemAction(pendingStatus)
          upsertDesktopActionTask(pendingStatus)
        }
      } catch (error) {
        setSystemError(error instanceof Error ? error.message : String(error))
      } finally {
        void refreshSystem()
      }
    },
    [cc, refreshSystem]
  )

  const navGroups = useMemo(
    () =>
      SECTIONS.map(value => ({
        active: section === value,
        icon:
          value === 'system'
              ? Activity
              : value === 'maintenance'
                ? Wrench
                : BarChart3,
        id: value,
        label: cc.sections[value],
        onSelect: () => setSection(value)
      })),
    [cc, section, setSection]
  )

  const activeGroup = navGroups.find(group => group.active)

  return (
    <OverlayView closeLabel={cc.close} onClose={onClose}>
      <OverlaySplitLayout>
        <OverlayNav groups={navGroups} />

        <OverlayMain className="px-0 pb-0">
          {activeGroup && (
            <OverlayBreadcrumbHeader
              group={activeGroup}
              rootLabel={cc.commandCenter}
              trailing={
                <>
                  {section === 'usage' && (
                    <SegmentedControl
                      onChange={id => setUsagePeriod(Number(id) as UsagePeriod)}
                      options={USAGE_PERIODS.map(value => ({ id: String(value), label: cc.days(value) }))}
                      value={String(usagePeriod)}
                    />
                  )}
                </>
              }
            />
          )}
          <div className={cn('flex min-h-0 flex-1 flex-col', PAGE_INSET_X)}>
            {section === 'usage' ? (
              <UsagePanel
                error={usageError}
                loading={usageLoading}
                onRefresh={() => void refreshUsage(usagePeriod)}
                period={usagePeriod}
                usage={usage}
              />
            ) : section === 'maintenance' ? (
              <MaintenancePanel />
            ) : (
              <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4">
                <div>
                  {status ? (
                    <div className="grid gap-2">
                      <div className="flex items-start justify-between gap-3 max-[47.5rem]:flex-col max-[47.5rem]:gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'size-2 shrink-0 rounded-full',
                                status.gateway_running ? 'bg-emerald-500' : 'bg-amber-500'
                              )}
                            />
                            <span className="text-[length:var(--conversation-text-font-size)] font-medium text-foreground">
                              {status.gateway_running ? cc.gatewayRunning : cc.gatewayStopped}
                            </span>
                          </div>
                          <div className="mt-1 text-[length:var(--conversation-caption-font-size)] text-(--ui-text-tertiary)">
                            {cc.kovaActiveSessions(status.version, status.active_sessions)}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 whitespace-nowrap max-[47.5rem]:whitespace-normal">
                          <Button onClick={() => void runSystemAction('restart')} size="xs" variant="text">
                            {cc.restartGateway}
                          </Button>
                          <UpdateKovaButton label={cc.updateKova} onClick={() => void runSystemAction('update')} />
                        </div>
                      </div>
                      {systemAction && (
                        <div className="text-[length:var(--conversation-caption-font-size)] text-(--ui-text-tertiary)">
                          {systemAction.name} ·{' '}
                          {systemAction.running
                            ? cc.actionRunning
                            : systemAction.exit_code === 0
                              ? cc.actionDone
                              : cc.actionFailed}
                        </div>
                      )}
                    </div>
                  ) : (
                    <PageLoader className="min-h-32" label={cc.loadingStatus} />
                  )}
                </div>

                <div className="flex min-h-0 flex-col pt-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="text-[0.625rem] font-medium uppercase tracking-[0.08em] text-(--ui-text-tertiary)">
                      {cc.recentLogs}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <ResponsiveTabs
                        align="end"
                        onChange={id => setLogFile(id as (typeof LOG_FILES)[number])}
                        tabs={LOG_FILES.map(value => ({ id: value, label: value }))}
                        value={logFile}
                      />
                      <ResponsiveTabs
                        align="end"
                        onChange={id => setLogLevel(id as (typeof LOG_LEVELS)[number])}
                        tabs={LOG_LEVELS.map(value => ({
                          id: value,
                          label: value === 'ALL' ? 'all' : value.toLowerCase()
                        }))}
                        value={logLevel}
                      />
                      <LogSearchField
                        containerClassName="w-44"
                        onChange={setLogQuery}
                        placeholder={cc.logSearchPlaceholder}
                        search={logSearch}
                        value={logQuery}
                      />
                    </div>
                    {systemError && (
                      <span className="inline-flex items-center gap-1 text-[length:var(--conversation-caption-font-size)] text-destructive">
                        <AlertCircle className="size-3.5" />
                        {systemError}
                      </span>
                    )}
                  </div>
                  <LogTail
                    className="flex-1 rounded-lg border border-(--ui-stroke-tertiary) bg-(--ui-bg-quinary)"
                    emptyLabel={cc.noLogs}
                    lines={systemLoading && logs.length === 0 ? null : logs}
                    search={logSearch}
                  />
                </div>
              </div>
            )}
          </div>
        </OverlayMain>
      </OverlaySplitLayout>
    </OverlayView>
  )
}

interface UsagePanelProps {
  error: string
  loading: boolean
  onRefresh: () => void
  period: UsagePeriod
  usage: AnalyticsResponse | null
}

function UsagePanel({ error, loading, onRefresh, period, usage }: UsagePanelProps) {
  const { t } = useI18n()
  const cc = t.commandCenter
  const daily = useMemo(() => usage?.daily ?? [], [usage])
  const totals = usage?.totals
  const byModel = usage?.by_model ?? []
  const topSkills = usage?.skills?.top_skills ?? []

  const maxTokens = useMemo(() => {
    if (!daily.length) {
      return 1
    }

    return daily.reduce((acc, entry) => Math.max(acc, (entry.input_tokens || 0) + (entry.output_tokens || 0)), 1)
  }, [daily])

  if (!totals) {
    return (
      <div className="min-h-0 flex-1">
        {loading ? (
          <PageLoader className="min-h-48" label={cc.loadingUsage} />
        ) : (
          <EmptyPanel
            action={
              <Button onClick={onRefresh} size="xs" variant="text">
                {cc.retry}
              </Button>
            }
            description={cc.noUsage(period)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-2">
      {error && (
        <span className="inline-flex items-center gap-1 text-[length:var(--conversation-caption-font-size)] text-destructive">
          <AlertCircle className="size-3.5" />
          {error}
        </span>
      )}

      <section className="rounded-2xl border border-(--ui-stroke-tertiary) bg-(--ui-bg-quinary) p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-(--ui-text-tertiary)">{cc.commandCenter}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{cc.usageOverview}</div>
            <div className="mt-1 text-sm text-(--ui-text-secondary)">{cc.usageOverviewHint(period)}</div>
          </div>
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-(--ui-control-hover-background) text-(--kova-signature-accent)">
            <BarChart3 className="size-5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <UsageStat hint={`${compactNumber(totals.total_input)} in · ${compactNumber(totals.total_output)} out`} label={cc.statTokens} value={compactNumber((totals.total_input ?? 0) + (totals.total_output ?? 0))} />
          <UsageStat hint={cc.statApiCallsHint} label={cc.statApiCalls} value={compactNumber(totals.total_api_calls)} />
          <UsageStat hint={cc.actualCost(`$${totals.total_actual_cost.toFixed(2)}`)} label={cc.statCost} value={`$${(totals.total_actual_cost || totals.total_estimated_cost).toFixed(2)}`} />
          <UsageStat hint={cc.conversationsInPeriod} label={cc.statSessions} value={compactNumber(totals.total_sessions)} />
        </div>
      </section>

      <section className="rounded-2xl border border-(--ui-stroke-tertiary) bg-(--ui-bg-quinary) p-4 sm:p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">
            {cc.dailyTokens}
          </span>
          <span className="flex items-center gap-3 text-[0.65rem] text-(--ui-text-tertiary)">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-(--kova-signature-accent)" /> {cc.input}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-(--ui-text-tertiary)" /> {cc.output}
            </span>
          </span>
        </div>
        {daily.length === 0 ? (
          <div className="grid h-24 place-items-center text-[length:var(--conversation-caption-font-size)] text-(--ui-text-tertiary)">
            {cc.noDailyActivity}
          </div>
        ) : (
          <>
            <div className="flex h-36 items-end gap-1 sm:gap-1.5">
              {daily.map(entry => {
                const inputH = Math.round(((entry.input_tokens || 0) / maxTokens) * 140)
                const outputH = Math.round(((entry.output_tokens || 0) / maxTokens) * 140)

                return (
                  <div
                    className="group relative flex h-36 min-w-0 flex-1 flex-col justify-end gap-0.5"
                    key={entry.day}
                    title={`${entry.day} · in ${compactNumber(entry.input_tokens)} · out ${compactNumber(entry.output_tokens)}`}
                  >
                    <div
                      className="w-full rounded-t-full bg-(--kova-signature-accent)/80"
                      style={{ height: Math.max(inputH, entry.input_tokens > 0 ? 1 : 0) }}
                    />
                    <div
                      className="w-full rounded-t-full bg-(--ui-text-tertiary)/60"
                      style={{ height: Math.max(outputH, entry.output_tokens > 0 ? 1 : 0) }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="mt-1 flex justify-between text-[0.6rem] text-(--ui-text-tertiary)">
              <span>{daily[0]?.day}</span>
              <span>{daily[daily.length - 1]?.day}</span>
            </div>
          </>
        )}
      </section>

      <div className="grid min-h-0 gap-3 pt-1 sm:grid-cols-2">
        <UsageList
          emptyLabel={cc.noModelUsage}
          rows={byModel.slice(0, 6).map(entry => ({
            key: entry.model,
            label: entry.model,
            value: `${compactNumber((entry.input_tokens || 0) + (entry.output_tokens || 0))}`
          }))}
          title={cc.topModels}
        />
        <UsageList
          emptyLabel={cc.noSkillActivity}
          rows={topSkills.slice(0, 6).map(entry => ({
            key: entry.skill,
            label: entry.skill,
            value: cc.actions(compactNumber(entry.total_count))
          }))}
          title={cc.topSkills}
        />
      </div>
    </div>
  )
}

function UsageList({
  emptyLabel,
  rows,
  title
}: {
  emptyLabel: string
  rows: Array<{ key: string; label: string; value: string }>
  title: string
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-(--ui-stroke-tertiary) bg-(--ui-bg-quinary) p-4">
      <div className="mb-3 text-sm font-medium text-foreground">
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="text-[length:var(--conversation-caption-font-size)] text-(--ui-text-tertiary)">
          {emptyLabel}
        </div>
      ) : (
        <ul>
          {rows.map(row => (
            <li className="flex items-center justify-between gap-2 border-t border-(--ui-stroke-tertiary) py-2.5 first:border-0" key={row.key}>
              <span className="min-w-0 truncate text-sm text-foreground">{row.label}</span>
              <span className="shrink-0 rounded-full bg-(--ui-control-hover-background) px-2 py-0.5 text-xs text-(--ui-text-secondary)">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function UsageStat({ hint, label, value }: { hint?: string; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-(--ui-control-hover-background) p-3.5">
      <div className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-(--ui-text-tertiary)">{label}</div>
      <div className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <div className="mt-0.5 truncate text-[0.62rem] text-(--ui-text-tertiary)">{hint}</div>}
    </div>
  )
}
