import { compactNumber } from '@kova/shared'
import { useCallback, useMemo, useState } from 'react'

import { Codicon } from '@/components/ui/codicon'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useI18n } from '@/i18n'
import { type ProfileScope, setToolsetEnabled } from '@/kova'
import { isDesktopToolsetVisible } from '@/lib/desktop-toolsets'
import { queryClient } from '@/lib/query-client'
import { invalidateSlashCompletions } from '@/lib/slash-completion-cache'
import { notify, notifyError } from '@/store/notifications'
import type { ToolsetInfo } from '@/types/kova'

import { asText, toolNames, toolsetDisplayLabel } from '../../settings/helpers'
import { MarketplaceDirectoryItem } from '../catalog/catalog-directory'
import { CatalogSwitch } from '../catalog/catalog-switch'
import { CapabilityEmpty } from '../primitives'
import { CapabilitySearch } from '../ui/capability-search'

import { useToolCalls } from './tool-calls'
import { ToolsetDetail } from './toolset-detail'
import { filteredToolsets, toolsetCalls, TOOLSETS_QUERY_KEY, toolsetsQueryKey } from './toolsets-data'

interface ToolsetsTabProps {
  /** The scope's toolset list, straight from the shell's query. */
  toolsets: ToolsetInfo[]
  /** The (connection, profile) scope every read and write routes to. */
  profile: ProfileScope
  query: string
  onQueryChange: (query: string) => void
  /** Data-derived "Try …" placeholder nudges. */
  hints?: string[]
}

/** Toolsets use the same compact directory as apps, plugins, and skills. */
export function ToolsetsTab({ hints, onQueryChange, profile, query, toolsets }: ToolsetsTabProps) {
  const { t } = useI18n()
  const ts = t.catalog.toolsets
  const toolCalls = useToolCalls(profile)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [selectedToolset, setSelectedToolset] = useState<string | null>(null)

  // Optimistic write-through against the scoped Tools key: toggles repaint
  // instantly; the next background refetch reconciles.
  const setToolsets = useCallback(
    (fn: (cur: ToolsetInfo[] | undefined) => ToolsetInfo[] | undefined) =>
      queryClient.setQueryData<ToolsetInfo[]>(toolsetsQueryKey(profile), prev => fn(prev) ?? prev),
    [profile]
  )

  const refreshToolsets = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TOOLSETS_QUERY_KEY })
  }, [])

  // Most-used first; absent counts sort A–Z until the analytics scan lands.
  const visibleToolsets = useMemo(
    () => filteredToolsets(toolsets, query, toolCalls ?? {}, true),
    [query, toolCalls, toolsets]
  )

  // Bulk actions and the master-switch state target the WHOLE tab, never the
  // search-filtered view — a tab-wide control that silently scoped to the
  // current query would be a lie.
  const bulkToolsets = useMemo(() => toolsets.filter(ts => isDesktopToolsetVisible(ts.name)), [toolsets])

  // The dialog's toolset; null when closed or when search filters it out.
  const activeToolset = useMemo(
    () => visibleToolsets.find(ts => ts.name === selectedToolset) ?? null,
    [selectedToolset, visibleToolsets]
  )

  const search = (
    <header className="catalog-search-header shrink-0">
      <CapabilitySearch
        actions={
          <CatalogSwitch
            aria-label={t.skills.all}
            checked={bulkToolsets.length > 0 && bulkToolsets.every(toolset => toolset.enabled)}
            disabled={bulkBusy}
            onCheckedChange={checked =>
              void bulkApply(
                bulkToolsets.filter(row => row.enabled !== checked),
                checked
              )
            }
          />
        }
        hints={hints}
        onChange={onQueryChange}
        placeholder={t.skills.searchToolsets}
        scope={t.skills.tabToolsets}
        value={query}
      />
    </header>
  )

  // Single toggles are optimistic and silent on success (the row repaints
  // immediately — a toast per flip would spam rapid customization). Errors
  // revert and notify.
  async function handleToggleToolset(toolset: ToolsetInfo, enabled: boolean) {
    setToolsets(
      current =>
        current?.map(row => (row.name === toolset.name ? { ...row, enabled, available: enabled } : row)) ?? current
    )

    try {
      await setToolsetEnabled(toolset.name, enabled, profile)
    } catch (err) {
      setToolsets(
        current =>
          current?.map(row => (row.name === toolset.name ? { ...row, enabled: !enabled, available: !enabled } : row)) ??
          current
      )
      notifyError(err, t.skills.failedToUpdate(toolsetDisplayLabel(toolset)))
    }
  }

  // Sequential on purpose: each toggle is a config read-modify-write on the
  // backend; parallel calls would race the disabled-list save.
  async function bulkApply(targets: ToolsetInfo[], enabled: boolean) {
    if (bulkBusy || targets.length === 0) {
      return
    }

    setBulkBusy(true)

    let done = 0

    try {
      for (const row of targets) {
        await setToolsetEnabled(row.name, enabled, profile)
        setToolsets(cur => cur?.map(r => (r.name === row.name ? { ...r, enabled, available: enabled } : r)) ?? cur)
        done += 1
      }

      notify({ kind: 'success', title: t.skills.bulkUpdated(done), message: '' })
    } catch (err) {
      notifyError(err, t.skills.failedToUpdate(t.skills.tabToolsets))
    } finally {
      invalidateSlashCompletions()
      setBulkBusy(false)
    }
  }

  if (visibleToolsets.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {search}
        <CapabilityEmpty noun="tools" query={query} />
      </div>
    )
  }

  const item = (toolset: ToolsetInfo) => {
    const calls = toolCalls ? toolsetCalls(toolset, toolCalls) : 0
    const count = toolNames(toolset).length
    const label = toolsetDisplayLabel(toolset)

    return {
      action: (
        <CatalogSwitch
          aria-label={t.skills.toggleToolset(label, !toolset.enabled)}
          checked={toolset.enabled}
          disabled={bulkBusy}
          onCheckedChange={enabled => void handleToggleToolset(toolset, enabled)}
        />
      ),
      name: label,
      description: asText(toolset.description),
      icon: <Codicon name="tools" size="1.25rem" />,
      status: calls > 0 ? ts.callCount(compactNumber(calls), calls) : t.skills.provenance.bundled,
      subtitle: count ? ts.toolCount(count) : undefined,
      onOpen: () => setSelectedToolset(toolset.name)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col" data-marketplace-tools>
      {search}
      <div className="capabilities-scroll">
        <section className="marketplace-directory">
          <h2 className="marketplace-directory-count">
            {t.connectorsPage.group.available}{' '}
            <span className="font-normal tabular-nums text-(--ui-text-tertiary)">{visibleToolsets.length}</span>
          </h2>
          <div className="marketplace-directory-grid">
            {visibleToolsets.map(toolset => {
              const row = item(toolset)

              return (
                <MarketplaceDirectoryItem
                  action={row.action}
                  description={row.description}
                  icon={row.icon}
                  key={toolset.name}
                  name={row.name}
                  onOpen={row.onOpen}
                  status={row.status}
                  subtitle={row.subtitle}
                />
              )
            })}
          </div>
        </section>
      </div>
      <Dialog
        onOpenChange={open => {
          if (!open) {
            setSelectedToolset(null)
          }
        }}
        open={selectedToolset !== null}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle className="sr-only">
            {activeToolset ? toolsetDisplayLabel(activeToolset) : t.skills.tabToolsets}
          </DialogTitle>
          {activeToolset && (
            <ToolsetDetail
              onConfiguredChange={refreshToolsets}
              profile={profile}
              toolCalls={toolCalls ?? {}}
              toolset={activeToolset}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
