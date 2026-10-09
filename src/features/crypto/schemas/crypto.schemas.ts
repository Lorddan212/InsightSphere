import { z } from 'zod'

export const coinIdSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,99}$/)
export const periodSchema = z.enum(['24H', '7D', '30D', '1Y'])
export const PERIOD_DAYS = { '24H': 1, '7D': 7, '30D': 30, '1Y': 365 } as const
const metric = z.number().nonnegative().nullable()
const timestamp = z.number().int().nonnegative().max(8.64e15)
const updated = z.iso.datetime({ offset: true }).nullable()
export const marketAssetSchema = z.object({
  id: coinIdSchema,
  symbol: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  image: z.string().nullable(),
  current_price: metric,
  market_cap: metric,
  market_cap_rank: z.number().int().positive().nullable(),
  total_volume: metric,
  high_24h: metric,
  low_24h: metric,
  price_change_percentage_24h: z.number().nullable(),
  circulating_supply: metric,
  last_updated: updated,
})
export const marketsSchema = z
  .array(marketAssetSchema)
  .max(50)
  .refine((rows) => new Set(rows.map((row) => row.id)).size === rows.length)
export const historySchema = z.object({
  prices: z.array(z.tuple([timestamp, metric])).max(10000),
})
export const globalSchema = z.object({
  data: z.object({
    total_market_cap: z.object({ usd: metric.optional() }),
    total_volume: z.object({ usd: metric.optional() }),
    market_cap_percentage: z.object({
      btc: z.number().min(0).max(100).nullable().optional(),
      eth: z.number().min(0).max(100).nullable().optional(),
    }),
    updated_at: timestamp.max(8.64e12).nullable(),
  }),
})

export const CRYPTO_ERRORS = {
  INVALID_INPUT: 'This cryptocurrency request is not valid.',
  NOT_FOUND:
    'This asset is unavailable. Choose an asset from the market table.',
  METHOD: 'This request method is not supported.',
  NOT_CONFIGURED:
    'Crypto is not configured. Set COINGECKO_API_KEY on the server and restart it.',
  AUTH: 'CoinGecko authentication failed. Check the server API configuration.',
  RATE_LIMIT:
    'Crypto requests are temporarily rate limited. Wait before trying again.',
  PROVIDER: 'CoinGecko is temporarily unavailable. Try again later.',
  INVALID_DATA: 'The cryptocurrency provider returned unexpected data.',
  TIMEOUT: 'The cryptocurrency request timed out. Try again later.',
} as const
export type CryptoErrorCode = keyof typeof CRYPTO_ERRORS
