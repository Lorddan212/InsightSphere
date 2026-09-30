import type { ExchangeRatePoint } from '../types/currencies.types'

export function calculateCurrencyMetrics(points: ExchangeRatePoint[]) {
  const valid = points
    .filter(
      (p): p is ExchangeRatePoint & { rate: number } =>
        p.rate !== null && Number.isFinite(p.rate) && p.rate > 0,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
  const first = valid[0]
  const last = valid.at(-1)
  const change =
    first && last && valid.length > 1 ? last.rate - first.rate : null
  const percentage =
    change !== null && first ? (change / first.rate) * 100 : null
  return {
    first,
    last,
    count: valid.length,
    high: valid.length ? Math.max(...valid.map((p) => p.rate)) : null,
    low: valid.length ? Math.min(...valid.map((p) => p.rate)) : null,
    change: change !== null && Number.isFinite(change) ? change : null,
    percentage:
      percentage !== null && Number.isFinite(percentage) ? percentage : null,
  }
}

export function parseCurrencyAmount(input: string): {
  value: number | null
  error: string | null
} {
  if (!input.trim()) return { value: null, error: null }
  if (!/^\d+(\.\d{0,6})?$/.test(input.trim()))
    return {
      value: null,
      error:
        'Enter a non-negative decimal with up to 6 decimal places, without commas or exponents.',
    }
  const value = Number(input)
  if (!Number.isFinite(value) || value > 1_000_000_000_000)
    return { value: null, error: 'Enter an amount no greater than 1 trillion.' }
  return { value, error: null }
}

export function convertCurrency(
  amount: number | null,
  rate: number | null,
): number | null {
  if (
    amount === null ||
    rate === null ||
    !Number.isFinite(amount) ||
    !Number.isFinite(rate) ||
    amount < 0 ||
    rate <= 0
  )
    return null
  const result = amount * rate
  return Number.isFinite(result) && result <= Number.MAX_SAFE_INTEGER
    ? result
    : null
}
