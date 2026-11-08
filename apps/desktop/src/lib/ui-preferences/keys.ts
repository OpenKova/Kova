/**
 * Which persisted keys are machine-level UI preferences (#145213).
 *
 * Only these leave localStorage for the machine's shared store, so native
 * Desktop and every browser that opens this machine's Webapp show the same
 * choices. Scoped families keep their scope inside the key name (a
 * `….profile.<name>` or per-connection suffix): only the location changes.
 *
 * Deliberately NOT here (they stay in this browser/window):
 * - credentials, grants and connection config: gateway registry, custom model
 *   endpoints, plugin decisions and preview-script grants, embed permissions;
 * - per-window or per-device runtime state: layout tree, open tiles and tabs,
 *   last route/session, scroll, zoom, pet and popout geometry, keep-awake;
 * - drafts, queues, journals and caches: composer queue, in-flight turns,
 *   pending/prepared submissions, previews, pricing, backend skin cache, the
 *   "provider configured" onboarding cache (each backend answers that itself);
 * - one-off notices: butterbar, update and real-profile prompts.
 */

const SHARED_KEYS: ReadonlySet<string> = new Set([
  // Appearance.
  'hermes-desktop-theme-v2',
  'hermes-desktop-mode-v1',
  'hermes-desktop-profile-themes-v1',
  'hermes-desktop-profile-modes-v1',
  'hermes-desktop-user-themes-v1',
  'kova.desktop.backdrop.v1',
  'kova.desktop.chat-text-scale.v1',
  'kova.desktop.interfaceMode.v1',
  'kova.desktop.textDirection',
  'kova.desktop.translucency.v2',
  'kova.desktop.user-bubble-transparency.v1',
  // Sessions sidebar and profile rail.
  'kova.desktop.agentsGroupedByWorkspace',
  'kova.desktop.profileColors',
  'kova.desktop.profileOrder',
  'kova.desktop.profileRailVisible',
  'kova.desktop.sessionListDensity',
  'kova.desktop.sessionOrder',
  'kova.desktop.sessionOrder.manual',
  'kova.desktop.showAllProfiles',
  'kova.desktop.sidebarAgentsGrouped.allProfiles',
  'kova.desktop.sidebarCardRows',
  'kova.desktop.sidebarGrouping',
  'kova.desktop.sidebarGrouping.allProfiles',
  'kova.desktop.sidebarRowMeta',
  'kova.desktop.sidebarShowAllSessions',
  'kova.desktop.sidebarShowArchived',
  'kova.desktop.sidebarSortKey',
  // Status bar.
  'kova.desktop.statusbarHidden.v2',
  'kova.desktop.statusbarVisible.v2',
  // Transcript and tools.
  'kova.desktop.hideThreadTimeline',
  'kova.desktop.reasoning.collapsedByDefault',
  'kova.desktop.toolView.hideCodeDiffs',
  'kova.desktop.toolView.technical',
  // Shell, panes and behaviour.
  'kova.desktop.alwaysExternalLinks.v1',
  'kova.desktop.capabilities.catalogCardView',
  'kova.desktop.composerPopout.enabled',
  'kova.desktop.composerPopout.gesturesEnabled',
  'kova.desktop.files.showIgnored',
  'kova.desktop.keybinds',
  'kova.desktop.layoutPresets.v2',
  'kova.desktop.panesFlipped',
  'kova.desktop.tabStripDefault',
  'kova.desktop.titlebarAppActions',
  // Guidance: what the user already skipped, saw or dismissed does not come
  // back in every new browser or origin (#145600).
  'hermes-onboarding-skipped-v1',
  'kova.desktop.tips.last.v1',
  'kova.desktop.tips.next.v1',
  'kova.desktop.tips.retired.v1',
  'kova.desktop.tips.rotation.v1',
  'kova.desktop.tips.shownAt.v1',
  'kova.desktop.tours.v1',
  // Sound and media.
  'kova.desktop.autoSpeakReplies',
  'kova.desktop.completionSoundVariantId',
  'kova.desktop.hapticsMuted',
  'kova.desktop.videoPlaybackSpeed',
  // Model picker.
  'kova.desktop.collapsed-providers',
  'kova.desktop.favorite-models',
  // visible-models is a diff against known-models: they only make sense together.
  'kova.desktop.known-models',
  'kova.desktop.model-presets',
  'kova.desktop.visible-models'
])

/** Families whose scope rides in the key suffix (gateway aliases/order/collapsed). */
const SHARED_PREFIXES: readonly string[] = ['kova.desktop.sidebar.gatewayGroups.v1.']

export function isSharedPreferenceKey(key: string): boolean {
  return SHARED_KEYS.has(key) || SHARED_PREFIXES.some(prefix => key.startsWith(prefix))
}
