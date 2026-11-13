import { useStore } from '@nanostores/react'
import type { ReactNode } from 'react'

import type { DesktopVersionInfo, RuntimeSource } from '@/global'
import { useI18n } from '@/i18n'
import { distributionLabelKey } from '@/lib/distribution-label'
import { ExternalLink } from '@/lib/external-link'
import { shortVersion } from '@/lib/version-label'
import { $updateStatus, sourceUpdateTrack } from '@/store/updates'

/**
 * Human label for an external build's runtime source: the resolution rung
 * plus the location it resolved from, when there is one.
 */
function runtimeSourceLabel(source: RuntimeSource): string {
  const where = 'root' in source && source.root ? source.root : 'command' in source ? source.command : null

  return where ? `${source.type} (${where})` : source.type
}

/** What this source install follows (stable, main or a branch); packages render nothing. */
function ChannelRow({ action }: { action?: ReactNode }) {
  const { t } = useI18n()
  const c = t.settings.about.channel
  const track = sourceUpdateTrack(useStore($updateStatus))

  if (!track) {
    return null
  }

  const label = track.kind === 'stable' ? c.stable : track.kind === 'main' ? `${c.main} (main)` : c.branch(track.name)

  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{c.detailsLabel}</dt>
      <dd className="text-right">
        {label}
        {action && <> · {action}</>}
      </dd>
    </div>
  )
}

/** One side of a client/backend pair; a side that did not answer renders nothing. */
function SideVersionRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null
  }

  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{versionLabel(value)}</dd>
    </div>
  )
}

function versionLabel(value: string): string {
  const short = shortVersion(value)

  return short === 'Development build' ? short : `v${short}`
}

/**
 * Shared build-provenance display. Reads from `$desktopVersion`
 * (populated from the build stamp / `kova:version` IPC), so every
 * surface — the About settings page, the updates overlay — shows the
 * same version, branch, commit, distribution, runtime, and install id
 * from one source of truth.
 */
export function VersionDetails({ version, channelAction }: { version: DesktopVersionInfo; channelAction?: ReactNode }) {
  const { t } = useI18n()
  const u = t.updates

  const source =
    version.source === 'ci' ? 'CI' : version.source ? version.source[0].toUpperCase() + version.source.slice(1) : null

  // The Distribution row: one resolver owns the label policy — see
  // distribution-label.ts. Nix and Docker are product names, rendered
  // verbatim; every other shape comes from the stamp via i18n.
  const distributionKey = distributionLabelKey(version)

  const distribution =
    version.distribution === 'nix'
      ? 'Nix'
      : version.distribution === 'docker'
        ? 'Docker'
        : distributionKey
          ? u[distributionKey]
          : null

  const runtime =
    version.kovaRuntime?.type === 'embedded'
      ? u.versionDetailsRuntimeEmbedded
      : version.kovaRuntime?.type === 'external' && version.kovaRuntime.source
        ? runtimeSourceLabel(version.kovaRuntime.source)
        : version.kovaRuntime?.type === 'external'
          ? u.versionDetailsRuntimeExternal
          : null

  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3 text-sm">
      <dl className="grid gap-2">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Kova desktop</dt>
          <dd>
            {version.appVersion ? versionLabel(version.appVersion) : u.versionUnavailable}
            {version.dirty && <span className="text-warning"> (!)</span>}
          </dd>
        </div>
        <SideVersionRow label="Desktop interface" value={version.clientVersion} />
        <SideVersionRow label="Kova agent" value={version.backendVersion} />
      </dl>
      <details className="mt-3 border-t border-border/70 pt-2 text-xs">
        <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
          Build details
        </summary>
        <dl className="mt-3 grid gap-2 text-sm">
          {version.commit && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{u.versionDetailsCommit}</dt>
              <dd className="break-all text-right">
                <ExternalLink
                  className="break-all font-mono text-xs"
                  href={`https://github.com/OpenKova/Kova/commit/${version.commit}`}
                  native
                >
                  {version.commit.slice(0, 14)}
                </ExternalLink>
                {version.dirty && <span className="text-warning"> {u.versionDetailsUncommittedChanges}</span>}
              </dd>
            </div>
          )}
          <ChannelRow action={channelAction} />
          {source && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{u.versionDetailsBuildOrigin}</dt>
              <dd>
                {source}
                {version.branch && version.branch !== 'main' ? ` (${version.branch})` : ''}
              </dd>
            </div>
          )}
          {distribution && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{u.versionDetailsDistribution}</dt>
              <dd>{distribution}</dd>
            </div>
          )}
          {runtime && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{u.versionDetailsRuntime}</dt>
              <dd className="break-all text-right">{runtime}</dd>
            </div>
          )}
          {version.installId && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{u.versionDetailsInstallId}</dt>
              <dd className="break-all text-right font-mono text-xs">
                {version.installId} ({version.kovaRoot})
              </dd>
            </div>
          )}
        </dl>
      </details>
    </div>
  )
}
