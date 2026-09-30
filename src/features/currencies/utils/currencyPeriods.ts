import type {
  CurrencyDateRange,
  CurrencyPeriod,
} from '../types/currencies.types'

export const CURRENCY_PERIODS: CurrencyPeriod[] = ['7D', '1M', '3M', '1Y']

export function getCurrencyDateRange(
  period: CurrencyPeriod,
  now = new Date(),
): CurrencyDateRange {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const start = new Date(end)
  if (period === '7D') start.setUTCDate(start.getUTCDate() - 6)
  else {
    const day = start.getUTCDate()
    start.setUTCDate(1)
    start.setUTCMonth(
      start.getUTCMonth() - (period === '1M' ? 1 : period === '3M' ? 3 : 12),
    )
    const lastDay = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
    ).getUTCDate()
    start.setUTCDate(Math.min(day, lastDay))
  }
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  }
}
