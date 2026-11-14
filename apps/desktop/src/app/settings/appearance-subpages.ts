export const APPEARANCE_SUBPAGES = [
  { id: 'general', labelKey: 'appearanceGeneral' },
  { id: 'theme', labelKey: 'appearanceTheme' },
  { id: 'pet', labelKey: 'appearancePet' }
] as const

export type AppearanceSubpageId = (typeof APPEARANCE_SUBPAGES)[number]['id']
export type AppearanceSectionId = AppearanceSubpageId | 'typography' | 'window-layout' | 'chat-display'
