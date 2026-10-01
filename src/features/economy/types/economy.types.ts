export interface Country {
  id: string
  iso2Code: string
  name: string
  region: string
  incomeLevel: string
}
export type EconomicPeriod = '10Y' | '20Y' | '30Y' | 'MAX'
export interface EconomicRange {
  from: number
  to: number
}
export type IndicatorFormat = 'usd' | 'people' | 'percent' | 'years'
export interface EconomicIndicator {
  code: string
  name: string
  unit: string
  description: string
  format: IndicatorFormat
  change: 'relative' | 'points' | 'absolute'
}
export interface IndicatorMetadata {
  code: string
  name: string
  description: string
  source: string
}
export interface EconomicObservation {
  year: number
  value: number | null
}
export interface EconomicSeries {
  countryId: string
  indicatorCode: string
  observations: EconomicObservation[]
  latest: EconomicObservation | null
  updated: string | null
}
export interface EconomySelection {
  country: string
  indicator: string
  period: EconomicPeriod
  comparisons: string[]
}
