export function formatRate(value: number | null): string {
  return value === null || !Number.isFinite(value)
    ? 'Unavailable'
    : new Intl.NumberFormat('en', { maximumSignificantDigits: 7 }).format(value)
}
export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(value)
}
export function formatCurrencyDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}
export function formatChange(value: number | null): string {
  return value === null
    ? 'Unavailable'
    : new Intl.NumberFormat('en', {
        maximumFractionDigits: 2,
        signDisplay: 'exceptZero',
      }).format(value) + '%'
}
