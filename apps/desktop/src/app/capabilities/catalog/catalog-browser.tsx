import { memo, type ReactNode, useDeferredValue, useEffect, useRef, useState } from 'react'

import { PageLoader } from '@/components/page-loader'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/i18n'

import { PanelEmpty } from '../../overlays/panel'
import { CapabilitySearch } from '../ui/capability-search'

import { CatalogAddButton } from './catalog-add-button'
import { CatalogAlert } from './catalog-alert'
import { type CatalogEntry, type CatalogKind, useCatalog } from './catalog-data'
import { CatalogDetail } from './catalog-detail'
import { CatalogDetailDialog } from './catalog-detail-dialog'
import { CatalogDirectoryRow } from './catalog-directory'
import { CatalogFilterBar } from './catalog-filter-bar'
import { CATALOG_POINTER_ENABLED, trackCatalogPointer } from './catalog-pointer'
import {
  catalogCategories,
  type CatalogSort,
  catalogSortOptions,
  catalogSources,
  catalogTags,
  filterCatalog,
  relatedEntries,
  sortCatalog
} from './catalog-query'
import { useCatalogFilters } from './use-catalog-filters'

interface CatalogBrowserProps {
  kind: CatalogKind
  query?: string
  onQueryChange?: (value: string) => void
  /** Data-derived "Try …" placeholder nudges for the search field. */
  searchHints?: string[]
  isInstalled: (entry: CatalogEntry) => boolean
  onInstall: (entry: CatalogEntry) => void
  isInstalling?: (entry: CatalogEntry) => boolean
  /** Feed rows the caller drops from the list entirely (e.g. a community
   *  lookalike whose name is taken by an installed skill). */
  isSuperseded?: (entry: CatalogEntry) => boolean
  installedEntries?: CatalogEntry[]
  matchInstalled?: (entry: CatalogEntry) => CatalogEntry | undefined
  actions?: ReactNode
  headerActions?: ReactNode
  installedPending?: boolean
  notice?: ReactNode
  renderInstalledDetail?: (entry: CatalogEntry) => ReactNode
  renderInstalledAction?: (entry: CatalogEntry) => ReactNode
  selectedEntryId?: string | null
}

const PAGE_SIZE = 60
/** Related entries listed under a detail. */
const RELATED_COUNT = 3
// The skills hub carries ~10k distinct tags; the rail is for browsing, search covers the tail.
const TAG_LIMIT = 16

/** Merge the public feed with installed rows: a catalog entry that matches an
 *  installed one takes the installed id (so selection and install state line
 *  up); installed rows with no catalog match are appended. */
function mergeInstalled(
  data: CatalogEntry[],
  installedEntries: CatalogEntry[],
  matchInstalled?: (entry: CatalogEntry) => CatalogEntry | undefined
) {
  const remaining = new Map(installedEntries.map(entry => [entry.id, entry]))
  const seen = new Set<string>()

  const catalog = data.flatMap(entry => {
    const installed = matchInstalled?.(entry)

    if (!installed) {
      return [entry]
    }

    remaining.delete(installed.id)

    if (seen.has(installed.id)) {
      return []
    }

    seen.add(installed.id)

    return [
      {
        ...entry,
        id: installed.id,
        version: installed.version || entry.version,
        search: `${entry.search} ${installed.search}`
      }
    ]
  })

  return [...catalog, ...remaining.values()]
}

function CatalogEntryInstall({
  entry,
  installed,
  installedPending,
  installing,
  kind,
  labeled,
  onInstall
}: {
  entry: CatalogEntry
  installed: boolean
  installedPending: boolean
  installing: boolean
  kind: CatalogKind
  labeled?: boolean
  onInstall: () => void
}) {
  return (
    <CatalogAddButton
      disabled={installedPending || installed || (kind === 'skills' && !entry.installIdentifier)}
      installed={installed}
      installing={installing}
      labeled={labeled}
      name={entry.name}
      onInstall={onInstall}
    />
  )
}

function CatalogSortSelect({
  entries,
  kind,
  value,
  onChange
}: {
  entries: CatalogEntry[]
  kind: CatalogKind
  value: CatalogSort
  onChange: (value: CatalogSort) => void
}) {
  const { t } = useI18n()
  const c = t.catalog

  const sortLabels: Record<CatalogSort, string> = {
    discover: c.featured,
    stars: c.mostStarred,
    newest: c.newest,
    updated: c.recentlyUpdated,
    name: c.alphabetical
  }

  return (
    <Select onValueChange={next => onChange(next as CatalogSort)} value={value}>
      <SelectTrigger aria-label={c.sortBy} className="w-full" size="sm">
        <SelectValue placeholder={c.sortBy} />
      </SelectTrigger>
      <SelectContent>
        {catalogSortOptions(entries, kind, sortLabels).map(({ value: option, label }) => (
          <SelectItem key={option} value={option}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Search owns the header; kind-specific setup actions and the view toggle share the end slot. */
function CatalogSearchHeader({
  actions,
  hints,
  kind,
  query,
  onQueryChange
}: {
  actions: ReactNode
  hints: CatalogBrowserProps['searchHints']
  kind: CatalogKind
  query: CatalogBrowserProps['query']
  onQueryChange: CatalogBrowserProps['onQueryChange']
}) {
  const { t } = useI18n()
  const c = t.catalog

  return (
    <header className="catalog-search-header shrink-0" data-catalog-header>
      <CapabilitySearch
        actions={actions}
        hints={hints}
        onChange={value => onQueryChange?.(value)}
        placeholder={kind === 'plugins' ? c.searchPlugins : c.searchSkills}
        scope={kind === 'plugins' ? t.skills.tabPlugins : t.skills.tabSkills}
        value={query ?? ''}
      />
    </header>
  )
}

function CatalogMoreButton({ onMore }: { onMore: () => void }) {
  const { t } = useI18n()

  return (
    <Button onClick={onMore} size="sm" variant="text">
      {t.catalog.more}
    </Button>
  )
}

function CatalogFilteredCards({
  entries,
  count,
  card,
  more,
  onMore
}: {
  entries: CatalogEntry[]
  count: number
  card: (entry: CatalogEntry, accentIndex: number) => ReactNode
  more: boolean
  onMore: () => void
}) {
  const { t } = useI18n()

  return (
    <div className="marketplace-directory">
      <p className="marketplace-directory-count">
        {t.connectorsPage.group.available}{' '}
        <span className="font-normal tabular-nums text-(--ui-text-tertiary)">{count}</span>
      </p>
      <div className="marketplace-directory-grid">{entries.map((entry, index) => card(entry, index))}</div>
      {more && <CatalogMoreButton onMore={onMore} />}
    </div>
  )
}

/** Related picks are only worth computing while a detail is on screen. */
const detailRelated = (entries: CatalogEntry[], selected: CatalogEntry | undefined, shown: boolean) =>
  selected && shown ? relatedEntries(entries, selected, RELATED_COUNT) : []

function CatalogLoadState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useI18n()
  const c = t.catalog

  if (!error) {
    return <PageLoader label={t.skills.loading} />
  }

  return (
    <div className="grid h-full place-items-center p-5">
      <ErrorState description={error.message} title={c.loadFailed}>
        <Button onClick={onRetry} size="sm" variant="secondary">
          {c.retry}
        </Button>
      </ErrorState>
    </div>
  )
}

function CatalogNoResults({ onClear }: { onClear: () => void }) {
  const { t } = useI18n()
  const c = t.catalog

  return (
    <PanelEmpty
      action={
        <Button onClick={onClear} size="sm" variant="secondary">
          {c.clearFilters}
        </Button>
      }
      description={c.tryAnother}
      icon="search"
      title={c.noResults}
    />
  )
}

// Props take no destructuring defaults: React Compiler 1.0 skips components that have them.
export const CatalogBrowser = memo(function CatalogBrowser({
  kind,
  isInstalled,
  onInstall,
  isInstalling,
  isSuperseded,
  installedEntries,
  matchInstalled,
  actions,
  headerActions,
  installedPending,
  notice,
  renderInstalledDetail,
  renderInstalledAction,
  selectedEntryId,
  query,
  onQueryChange,
  searchHints
}: CatalogBrowserProps) {
  const { t } = useI18n()
  const c = t.catalog
  const { data, isPending, error, refetch } = useCatalog(kind)
  const deferredQuery = useDeferredValue((query ?? '').trim().toLowerCase())
  const [selectedId, setSelectedId] = useState<string | null>(selectedEntryId ?? null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const resetSelection = () => {
    setLimit(PAGE_SIZE)
    setSelectedId(null)
    setDetailOpen(false)
  }

  const filters = useCatalogFilters(kind, resetSelection)
  const { facets, sort } = filters

  // Clearing the query only widens results, and a deep link clears it while selecting its target.
  useEffect(() => {
    setLimit(PAGE_SIZE)

    if (deferredQuery) {
      setSelectedId(null)
    }
  }, [deferredQuery])

  // A deep link asks to open one entry; selection stays local afterwards.
  useEffect(() => {
    if (!selectedEntryId) {
      return
    }

    setSelectedId(selectedEntryId)
    setDetailOpen(true)
  }, [selectedEntryId])

  const root = useRef<HTMLDivElement>(null)
  useEffect(() => (CATALOG_POINTER_ENABLED && root.current ? trackCatalogPointer(root.current) : undefined), [])

  const entries = mergeInstalled(data ?? [], installedEntries ?? [], matchInstalled)
  const visible = isSuperseded ? entries.filter(entry => !isSuperseded(entry)) : entries
  const filtered = sortCatalog(filterCatalog(visible, facets, deferredQuery, isInstalled, kind), sort, kind)

  const pageOrder = filtered

  const selected = visible.find(entry => entry.id === selectedId) ?? filtered[0]
  const related = detailRelated(filtered, selected, true)

  const searchFor = (value: string) => {
    onQueryChange?.(value)
    resetSelection()
  }

  const clearFilters = () => {
    onQueryChange?.('')
    filters.clear()
  }

  const openEntry = (entry: CatalogEntry) => {
    setSelectedId(entry.id)
    setDetailOpen(true)
  }

  // Installed entries get the owner's switch + ⋯ menu; the rest get a one-way +.
  // Hero cards and the detail have room to spell it out: "+ Install".
  const entryAction = (entry: CatalogEntry, labeled?: boolean) =>
    renderInstalledAction?.(entry) || (
      <CatalogEntryInstall
        entry={entry}
        installed={isInstalled(entry)}
        installedPending={Boolean(installedPending)}
        installing={isInstalling?.(entry) ?? false}
        kind={kind}
        labeled={labeled}
        onInstall={() => {
          if (kind === 'plugins') {
            setDetailOpen(false)
          }

          onInstall(entry)
        }}
      />
    )

  const card = (entry: CatalogEntry, _accentIndex: number) => (
    <CatalogDirectoryRow
      action={entryAction(entry)}
      entry={entry}
      installed={isInstalled(entry)}
      key={entry.id}
      kind={kind}
      onOpen={() => openEntry(entry)}
    />
  )

  const details = selected ? (
    <CatalogDetail
      action={entryAction(selected, true)}
      dialog
      entry={selected}
      kind={kind}
      management={renderInstalledDetail?.(selected)}
      onCategory={filters.chooseCategory}
      onRelated={entry => setSelectedId(entry.id)}
      onSearch={searchFor}
      onTag={filters.toggleTag}
      related={related}
    />
  ) : null

  const sortControl = <CatalogSortSelect entries={visible} kind={kind} onChange={filters.setSort} value={sort} />

  const filterKey = [facets.sources, facets.categories, facets.tags].map(list => list.join(',')).join(':')

  return (
    <div className="@container/catalog flex h-full min-h-0 min-w-0" data-catalog={kind} ref={root}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-catalog-results>
          {/* Search owns the header; kind-specific setup actions share the trailing slot. */}
          <CatalogSearchHeader
            actions={headerActions}
            hints={searchHints}
            kind={kind}
            onQueryChange={onQueryChange}
            query={query}
          />
          <CatalogFilterBar
            actions={actions}
            categories={catalogCategories(visible)}
            facets={facets}
            kind={kind}
            onCategory={filters.toggleCategory}
            onClear={clearFilters}
            onInstalled={filters.toggleInstalled}
            onSource={filters.toggleSource}
            onTag={filters.toggleTag}
            resultCount={filtered.length}
            sortControl={sortControl}
            sources={catalogSources(visible, kind)}
            tags={catalogTags(visible, facets.tags, TAG_LIMIT)}
          />
          {notice}
          {error && entries.length > 0 && (
            <CatalogAlert onRetry={() => void refetch()} retryLabel={c.retry} title={c.loadFailed}>
              {error.message}
            </CatalogAlert>
          )}
          <div className="min-h-0 flex-1">
            {!entries.length && (isPending || error) ? (
              <CatalogLoadState error={error} onRetry={() => void refetch()} />
            ) : filtered.length === 0 ? (
              <CatalogNoResults onClear={clearFilters} />
            ) : (
              <>
                <div
                  className="capabilities-scroll"
                  data-catalog-scroll
                  key={`${filterKey}:${sort}:${deferredQuery}:${facets.installedOnly}`}
                >
                  <CatalogFilteredCards
                    card={card}
                    count={filtered.length}
                    entries={filtered.slice(0, limit)}
                    more={filtered.length > limit}
                    onMore={() => setLimit(value => value + PAGE_SIZE)}
                  />
                </div>
                {selected && (
                  <CatalogDetailDialog
                    onOpenChange={setDetailOpen}
                    onSelect={setSelectedId}
                    open={detailOpen}
                    order={pageOrder}
                    selectedId={selected.id}
                  >
                    {details}
                  </CatalogDetailDialog>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
