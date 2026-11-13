import type { ReactNode } from 'react'

import { Codicon } from '@/components/ui/codicon'
import { RowButton } from '@/components/ui/row-button'
import { useI18n } from '@/i18n'

import { catalogIcon, CatalogImage } from './catalog-card'
import type { CatalogEntry, CatalogKind } from './catalog-data'

export function CatalogDirectoryRow({
  action,
  entry,
  installed,
  kind,
  onOpen
}: {
  action: ReactNode
  entry: CatalogEntry
  installed: boolean
  kind: CatalogKind
  onOpen: () => void
}) {
  const { t } = useI18n()

  return (
    <MarketplaceDirectoryItem
      action={action}
      dataEntryId={entry.id}
      description={entry.description || entry.overview}
      icon={
        entry.imageUrl ? (
          <CatalogImage className="size-8" src={entry.imageUrl} />
        ) : (
          <Codicon name={kind === 'plugins' ? 'extensions' : catalogIcon(entry.category)} size="1.25rem" />
        )
      }
      name={entry.name}
      onOpen={onOpen}
      status={installed ? t.catalog.installed : entry.source || entry.categoryLabel}
      subtitle={entry.author}
    />
  )
}

export function MarketplaceDirectoryItem({
  action,
  description,
  dataEntryId,
  icon,
  name,
  onOpen,
  status,
  subtitle
}: {
  action: ReactNode
  description: string
  dataEntryId?: string
  icon: ReactNode
  name: string
  onOpen: () => void
  status?: string
  subtitle?: string
}) {
  return (
    <article className="marketplace-directory-row" data-entry-id={dataEntryId}>
      <RowButton
        aria-haspopup="dialog"
        aria-label={name}
        className="absolute inset-0 z-0 rounded-md focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
        onClick={onOpen}
      />
      <span className="marketplace-directory-icon">{icon}</span>
      <span className="marketplace-directory-copy">
        <span className="marketplace-directory-title">
          <span className="truncate font-medium text-(--ui-text-primary)">{name}</span>
          {subtitle && <span className="shrink-0 text-xs text-(--ui-text-tertiary)">{subtitle}</span>}
          {status && <span className="ml-auto shrink-0 text-xs text-(--ui-text-tertiary)">{status}</span>}
        </span>
        <span className="marketplace-directory-description">{description}</span>
      </span>
      <span className="relative z-10 shrink-0">{action}</span>
    </article>
  )
}
