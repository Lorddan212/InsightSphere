import { ApiError } from '../../../lib/api/request'
import type { RawCountry, RawObservation } from '../schemas/economy.schema'
import type {
  Country,
  EconomicRange,
  EconomicSeries,
} from '../types/economy.types'

export function mapCountries(rows: RawCountry[]): Country[] {
  const countries = rows
    .filter(
      (row) => row.region.id !== 'NA' && row.region.value !== 'Aggregates',
    )
    .map((row) => ({
      id: row.id,
      iso2Code: row.iso2Code,
      name: row.name,
      region: row.region.value.trim(),
      incomeLevel: row.incomeLevel.value,
    }))
  return Array.from(
    new Map(countries.map((country) => [country.id, country])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name))
}
export function mapEconomicSeries(
  rows: RawObservation[],
  countryId: string,
  indicatorCode: string,
  range: EconomicRange,
  updated: string | null,
): EconomicSeries {
  const years = new Map<number, number | null>()
  for (const row of rows) {
    if (row.countryiso3code !== countryId || row.indicator.id !== indicatorCode)
      throw new ApiError(
        'invalid',
        'World Bank returned data for a different country or indicator. Please retry.',
      )
    const year = Number(row.date)
    if (year < range.from || year > range.to) continue
    if (years.has(year) && years.get(year) !== row.value)
      throw new ApiError(
        'invalid',
        'World Bank returned conflicting observations for one year. Please retry.',
      )
    years.set(year, row.value)
  }
  const observations = Array.from(years, ([year, value]) => ({
    year,
    value,
  })).sort((a, b) => a.year - b.year)
  return {
    countryId,
    indicatorCode,
    observations,
    latest: observations.findLast((point) => point.value !== null) ?? null,
    updated,
  }
}
