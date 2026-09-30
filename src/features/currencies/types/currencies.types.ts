export interface Currency {
  code: string
  name: string
}
export type CurrencyPeriod = '7D' | '1M' | '3M' | '1Y'
export interface CurrencySelection {
  base: string
  quote: string
  period: CurrencyPeriod
}
export interface CurrencyDateRange {
  from: string
  to: string
}
export interface ExchangeRatePoint {
  date: string
  rate: number | null
}
export interface LatestExchangeRate extends ExchangeRatePoint {
  base: string
  quote: string
}
