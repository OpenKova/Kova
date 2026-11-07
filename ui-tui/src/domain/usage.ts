import type { Usage } from '@kova/shared/gateway-events'

export { usageFromTick } from '@kova/shared/usage-tick'

export const ZERO: Usage = { calls: 0, input: 0, output: 0, total: 0 }
