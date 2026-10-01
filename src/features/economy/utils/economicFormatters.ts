import type { EconomicIndicator } from '../types/economy.types'
export function formatEconomicValue(
  value: number | null,
  indicator: EconomicIndicator,
  compact = true,
): string {
  if (value === null || !Number.isFinite(value)) return 'Unavailable'
  const formatted = new Intl.NumberFormat('en', {
    notation:
      compact && (indicator.format === 'usd' || indicator.format === 'people')
        ? 'compact'
        : 'standard',
    maximumFractionDigits: indicator.format === 'people' && !compact ? 0 : 2,
    ...(indicator.format === 'usd'
      ? { style: 'currency', currency: 'USD' }
      : {}),
  }).format(value)
  return `${formatted}${indicator.format === 'percent' ? '%' : indicator.format === 'years' ? ' years' : ''}`
}
export function formatEconomicChange(
  value: number | null,
  indicator: EconomicIndicator,
): string {
  if (value === null || !Number.isFinite(value)) return 'Unavailable'
  const amount = new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }).format(value)
  return `${amount}${indicator.change === 'relative' ? '%' : indicator.change === 'points' ? ' percentage points' : ' years'}`
}
