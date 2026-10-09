import type { z } from 'zod'
import type {
  globalSchema,
  historySchema,
  marketAssetSchema,
} from '../schemas/crypto.schemas'
import type {
  CryptoAsset,
  CryptoPricePoint,
  GlobalCryptoMarket,
} from '../types/crypto'

export function safeCoinImage(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      ['coin-images.coingecko.com', 'assets.coingecko.com'].includes(
        url.hostname,
      )
      ? url.href
      : null
  } catch {
    return null
  }
}
export function normalizeAsset(
  raw: z.infer<typeof marketAssetSchema>,
): CryptoAsset {
  return {
    id: raw.id,
    name: raw.name,
    symbol: raw.symbol.toUpperCase(),
    image: safeCoinImage(raw.image),
    price: raw.current_price,
    marketCap: raw.market_cap,
    rank: raw.market_cap_rank,
    volume: raw.total_volume,
    high: raw.high_24h,
    low: raw.low_24h,
    change24h: raw.price_change_percentage_24h,
    supply: raw.circulating_supply,
    updatedAt: raw.last_updated,
  }
}
export function normalizeHistory(
  raw: z.infer<typeof historySchema>,
): CryptoPricePoint[] {
  return Array.from(new Map(raw.prices).entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, price]) => ({ timestamp, price }))
}
export function normalizeGlobal({
  data,
}: z.infer<typeof globalSchema>): GlobalCryptoMarket {
  return {
    marketCap: data.total_market_cap.usd ?? null,
    volume: data.total_volume.usd ?? null,
    bitcoinDominance: data.market_cap_percentage.btc ?? null,
    ethereumDominance: data.market_cap_percentage.eth ?? null,
    updatedAt: data.updated_at === null ? null : data.updated_at * 1000,
  }
}
export function formatPrice(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Unavailable'
  if (value !== 0 && Math.abs(value) < 0.00000001)
    return `$${value.toExponential(4)}`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value >= 1 || value === 0 ? 2 : 0,
    maximumFractionDigits:
      value >= 1 || value === 0
        ? 2
        : Math.min(
            15,
            Math.max(4, 3 - Math.floor(Math.log10(Math.abs(value)))),
          ),
  }).format(value)
}
export function formatCompact(value: number | null, money = true): string {
  if (value === null || !Number.isFinite(value)) return 'Unavailable'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
    ...(money ? { style: 'currency', currency: 'USD' } : {}),
  }).format(value)
}
export function formatChange(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? 'Unavailable'
    : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}
export function formatUpdated(value: string | number | null): string {
  if (value === null || !Number.isFinite(new Date(value).getTime()))
    return 'Update time unavailable'
  return `Updated ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))} UTC`
}
export function periodChange(points: CryptoPricePoint[]): number | null {
  if (points.length < 2) return null
  const first = points[0].price
  const last = points.at(-1)?.price
  if (first === null || first === 0 || last == null) return null
  const change = ((last - first) / first) * 100
  return Number.isFinite(change) ? change : null
}
