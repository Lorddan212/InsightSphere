import { ApiError } from '../../../lib/api/request'
import type { RawRate } from '../schemas/currencies.schema'
import type {
  CurrencyDateRange,
  ExchangeRatePoint,
  LatestExchangeRate,
} from '../types/currencies.types'

export function mapLatestRate(
  raw: RawRate,
  base: string,
  quote: string,
): LatestExchangeRate {
  if (raw.base !== base || raw.quote !== quote)
    throw new ApiError(
      'invalid',
      'The provider returned a different currency pair. Please retry.',
    )
  return { base, quote, date: raw.date, rate: raw.rate ?? null }
}
export function mapHistoricalRates(
  raw: RawRate[],
  base: string,
  quote: string,
  range: CurrencyDateRange,
): ExchangeRatePoint[] {
  const dates = new Map<string, number | null>()
  for (const row of raw) {
    const point = mapLatestRate(row, base, quote)
    if (point.date < range.from || point.date > range.to) continue
    if (dates.has(point.date) && dates.get(point.date) !== point.rate)
      throw new ApiError(
        'invalid',
        'The provider returned conflicting rates for one date. Please retry.',
      )
    dates.set(point.date, point.rate)
  }
  return Array.from(dates, ([date, rate]) => ({ date, rate })).sort((a, b) =>
    a.date.localeCompare(b.date),
  )
}
