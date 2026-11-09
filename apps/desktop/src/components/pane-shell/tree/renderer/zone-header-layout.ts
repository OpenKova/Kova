import { TITLEBAR_HEIGHT, TOUCH_TITLEBAR_HEIGHT } from '@/app/shell/titlebar'
import { useTouchTitlebar } from '@/app/shell/use-touch-titlebar'

/** The desktop tab strip's row (`h-7`). */
const TAB_STRIP_HEIGHT = 28

interface ZoneHeaderLayoutInput {
  /** The titlebar measured too little room beside its controls for the tabs. */
  measuredBelowControls: boolean
  narrow: boolean
  shown: readonly string[]
  /** No workspace or main pane in the zone. */
  sidebarGroup: boolean
  topEdge: boolean
}

export interface ZoneHeaderLayout {
  tabStripHeight: number
  /** A top-edge zone's tabs take their own row under the window controls. */
  tabsBelowControls: boolean
  /** A top-edge zone's tabs share the titlebar band with the controls. */
  tabsInTitlebar: boolean
  titlebarHeight: number
}

/** Where a zone's tabs sit relative to the window titlebar, and how tall the
 *  titlebar band and the tab row are. */
export function useZoneHeaderLayout({
  measuredBelowControls,
  sidebarGroup,
  topEdge
}: ZoneHeaderLayoutInput): ZoneHeaderLayout {
  const touchTitlebar = useTouchTitlebar()
  const tabsBelowControls = topEdge && (sidebarGroup || measuredBelowControls)

  return {
    tabStripHeight: TAB_STRIP_HEIGHT,
    tabsBelowControls,
    tabsInTitlebar: topEdge && !tabsBelowControls,
    titlebarHeight: touchTitlebar ? TOUCH_TITLEBAR_HEIGHT : TITLEBAR_HEIGHT
  }
}
