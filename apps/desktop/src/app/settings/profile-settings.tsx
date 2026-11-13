import { useStore } from '@nanostores/react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'
import { type AnalyticsResponse, getUsageAnalytics } from '@/kova'
import { Activity, BarChart3, RefreshCw } from '@/lib/icons'
import { $activeGatewayProfile, $profiles, profileLabel } from '@/store/profile'

const number = (value: null | number | undefined) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value ?? 0)
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function ProfileSettings() {
  const { t } = useI18n()
  const activeProfile = useStore($activeGatewayProfile)
  const profiles = useStore($profiles)
  const [usage, setUsage] = useState<AnalyticsResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const currentProfile = profiles.find(profile => profile.name === activeProfile)
  const name = currentProfile ? profileLabel(currentProfile) : activeProfile
  const initials = name.split(/[\s_-]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'K'

  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    void getUsageAnalytics(365, activeProfile)
      .then(result => { if (current) {setUsage(result)} })
      .catch(reason => { if (current) {setError(reason instanceof Error ? reason.message : String(reason))} })
      .finally(() => { if (current) {setLoading(false)} })

    return () => { current = false }
  }, [activeProfile, refreshKey])

  const daily = useMemo(() => usage?.daily ?? [], [usage])

  const modelUsage = useMemo(
    () => [...(usage?.by_model ?? [])].sort((left, right) => right.input_tokens + right.output_tokens - left.input_tokens - left.output_tokens),
    [usage]
  )

  const byDate = useMemo(() => new Map(daily.map(item => [item.day, item])), [daily])
  const totalTokens = (usage?.totals.total_input ?? 0) + (usage?.totals.total_output ?? 0)

  const peak = daily.reduce<(typeof daily)[number] | null>((best, item) => {
    const tokens = item.input_tokens + item.output_tokens

    return !best || tokens > best.input_tokens + best.output_tokens ? item : best
  }, null)

  const activeDays = daily.filter(item => item.api_calls > 0).length

  const recentDays = useMemo(() => {
    const today = new Date()

    return Array.from({ length: 365 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (364 - index))
      const key = dayKey(date)

      return { count: byDate.get(key)?.api_calls ?? 0, date, key }
    })
  }, [byDate])

  const maxDay = Math.max(1, ...recentDays.map(day => day.count))
  const monthMarkers = recentDays.filter((day, index) => index === 0 || day.date.getMonth() !== recentDays[index - 1]?.date.getMonth())
  const topModel = modelUsage[0]
  const busiest = daily.reduce<(typeof daily)[number] | null>((best, item) => !best || item.api_calls > best.api_calls ? item : best, null)

  const streaks = useMemo(() => {
    let longest = 0
    let running = 0

    for (const day of recentDays) {
      running = day.count > 0 ? running + 1 : 0
      longest = Math.max(longest, running)
    }

    return { current: recentDays.at(-1)?.count ? running : 0, longest }
  }, [recentDays])

  return (
    <main className="mx-auto flex w-full max-w-[756px] flex-col gap-5 px-5 py-6 sm:px-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-(--ui-bg-quinary) text-sm font-semibold text-(--kova-signature-accent)">{initials}</div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">{name}</p>
            <p className="mt-0.5 text-sm text-(--ui-text-tertiary)">{t.settings.profile.workspaceProfile}</p>
          </div>
        </div>
        <Button onClick={() => setRefreshKey(key => key + 1)} size="sm" variant="outline">
          <RefreshCw className="size-3.5" /> {t.settings.profile.refresh}
        </Button>
      </section>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-(--ui-stroke-tertiary) bg-(--ui-bg-quinary) px-4 py-3 text-sm">
          <span className="text-(--ui-text-secondary)">{t.settings.profile.loadFailed}: {error}</span>
          <Button onClick={() => setRefreshKey(key => key + 1)} size="xs" variant="text">{t.settings.profile.retry}</Button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        <Metric hint={t.settings.profile.pastYear} label={t.settings.profile.tokens} value={loading ? '—' : number(totalTokens)} />
        <Metric hint={peak?.day ?? t.settings.profile.noActivity} label={t.settings.profile.peakDay} value={peak ? number(peak.input_tokens + peak.output_tokens) : '—'} />
        <Metric hint={t.settings.profile.pastYear} label={t.settings.profile.apiCalls} value={loading ? '—' : number(usage?.totals.total_api_calls)} />
        <Metric hint={streaks.current ? t.settings.profile.currentStreakHint : t.settings.profile.noActivity} label={t.settings.profile.currentStreak} value={loading ? '—' : t.settings.profile.days(streaks.current)} />
        <Metric hint={t.settings.profile.pastYear} label={t.settings.profile.longestStreak} value={loading ? '—' : t.settings.profile.days(streaks.longest)} />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-foreground">{t.settings.profile.activity}</h2>
            <p className="mt-1 text-xs text-(--ui-text-tertiary)">{t.settings.profile.activeDaysCount(activeDays)}</p>
          </div>
          <Activity className="size-4 text-(--ui-text-tertiary)" />
        </div>
        <div className="overflow-x-auto rounded-xl bg-(--ui-bg-quinary) p-4">
          <div aria-hidden className="mb-2 flex min-w-[620px] justify-between px-1 text-[11px] text-(--ui-text-tertiary)">
            {monthMarkers.map(day => <span key={day.key}>{day.date.toLocaleDateString(undefined, { month: 'short' })}</span>)}
          </div>
          <div aria-label={t.settings.profile.activity} className="grid min-w-[620px] grid-flow-col grid-rows-7 gap-[3px]" role="img">
            {recentDays.map(day => (
              <span className="size-[10px] rounded-[3px]" key={day.key} style={{ backgroundColor: day.count ? `color-mix(in srgb, var(--kova-signature-accent) ${Math.max(24, Math.round(day.count / maxDay * 100))}%, var(--ui-bg-tertiary))` : 'var(--ui-bg-tertiary)' }} title={`${day.key}: ${day.count} ${t.settings.profile.apiCalls.toLowerCase()}`} />
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-1.5 text-[11px] text-(--ui-text-tertiary)">
            <span>{t.settings.profile.less}</span>
            {[0, 25, 50, 75, 100].map(intensity => <span aria-hidden className="size-[10px] rounded-[3px]" key={intensity} style={{ backgroundColor: intensity ? `color-mix(in srgb, var(--kova-signature-accent) ${intensity}%, var(--ui-bg-tertiary))` : 'var(--ui-bg-tertiary)' }} />)}
            <span>{t.settings.profile.more}</span>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-[480px]">
          <h2 className="mb-2 text-sm font-medium text-foreground">{t.settings.profile.insights}</h2>
          <div className="divide-y divide-(--ui-stroke-tertiary) rounded-xl bg-(--ui-bg-quinary) px-4">
            <Insight label={t.settings.profile.topModel} value={topModel?.model ?? '—'} />
            <Insight label={t.settings.profile.busiestDay} value={busiest ? new Date(`${busiest.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long' }) : '—'} />
            <Insight label={t.settings.profile.estimatedCost} value={usage ? `$${(usage.totals.total_actual_cost || usage.totals.total_estimated_cost).toFixed(2)}` : '—'} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">{t.settings.profile.modelUsage}</h2>
        <div className="space-y-3 rounded-xl bg-(--ui-bg-quinary) p-4">
          {modelUsage.length ? modelUsage.slice(0, 5).map(model => {
            const percent = totalTokens ? Math.round((model.input_tokens + model.output_tokens) / totalTokens * 100) : 0

            return <div className="grid grid-cols-[minmax(0,1fr)_minmax(90px,1.5fr)_34px] items-center gap-3" key={model.model}>
              <span className="truncate text-xs text-foreground" title={model.model}>{model.model}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-(--ui-bg-tertiary)"><span className="block h-full rounded-full bg-(--ui-text-tertiary)" style={{ width: `${percent}%` }} /></span>
              <span className="text-right text-xs text-(--ui-text-secondary)">{percent}%</span>
            </div>
          }) : <div className="flex min-h-20 items-center gap-2 text-sm text-(--ui-text-tertiary)"><BarChart3 className="size-4" />{loading ? t.settings.profile.loading : t.settings.profile.noModelUsage}</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground">{t.settings.profile.account}</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-(--ui-bg-quinary) px-4 py-3">
          <div><p className="text-sm font-medium text-foreground">{t.settings.profile.workspaceProfile}</p><p className="mt-1 text-xs text-(--ui-text-tertiary)">{t.settings.profile.profileDescription}</p></div>
          <span className="max-w-full truncate text-sm text-(--ui-text-secondary)">{[currentProfile?.provider, currentProfile?.model].filter(Boolean).join(' · ') || '—'}</span>
        </div>
      </section>
    </main>
  )
}

function Metric({ hint, label, value }: { hint: string; label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-(--ui-bg-quinary) p-3.5"><p className="text-xs text-(--ui-text-secondary)">{label}</p><p className="mt-1 truncate text-xl font-semibold text-foreground">{value}</p><p className="mt-0.5 truncate text-xs text-(--ui-text-tertiary)">{hint}</p></div>
}

function Insight({ label, value }: { label: string; value: string }) {
  return <div className="flex min-h-11 items-center justify-between gap-4 py-3 text-xs"><span className="text-(--ui-text-secondary)">{label}</span><span className="max-w-[60%] truncate font-medium text-foreground" title={value}>{value}</span></div>
}
