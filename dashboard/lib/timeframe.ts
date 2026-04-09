export const TIMEFRAMES = ['1h', '6h', '24h', '7d', '30d'] as const
export type Timeframe = (typeof TIMEFRAMES)[number]
export const DEFAULT_TIMEFRAME: Timeframe = '24h'
