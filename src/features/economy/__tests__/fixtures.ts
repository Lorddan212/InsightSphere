import { DEFAULT_INDICATOR } from '../utils/economicIndicators'

export const countriesFixture = [
  {
    id: 'NGA',
    iso2Code: 'NG',
    name: 'Nigeria',
    region: { id: 'SSF', value: 'Sub-Saharan Africa' },
    incomeLevel: { value: 'Lower middle income' },
  },
  {
    id: 'GHA',
    iso2Code: 'GH',
    name: 'Ghana',
    region: { id: 'SSF', value: 'Sub-Saharan Africa' },
    incomeLevel: { value: 'Lower middle income' },
  },
  {
    id: 'ZAF',
    iso2Code: 'ZA',
    name: 'South Africa',
    region: { id: 'SSF', value: 'Sub-Saharan Africa' },
    incomeLevel: { value: 'Upper middle income' },
  },
  {
    id: 'WLD',
    iso2Code: '1W',
    name: 'World',
    region: { id: 'NA', value: 'Aggregates' },
    incomeLevel: { value: 'Aggregates' },
  },
]
export function pageFixture(
  rows: unknown[] | null,
  meta: Record<string, unknown> = {},
) {
  return [
    { page: 1, pages: 1, per_page: '100', total: rows?.length ?? 0, ...meta },
    rows,
  ]
}
export function observationFixture(
  year: number,
  value: number | null,
  country = 'NGA',
  indicator = DEFAULT_INDICATOR.code,
) {
  return {
    indicator: { id: indicator, value: 'Fixture indicator' },
    country: { id: country.slice(0, 2), value: country },
    countryiso3code: country,
    date: String(year),
    value,
    unit: '',
    obs_status: '',
    decimal: 0,
  }
}
export function indicatorFixture(code = DEFAULT_INDICATOR.code) {
  return pageFixture([
    {
      id: code,
      name: 'Provider indicator name',
      sourceNote: 'A provider definition for this indicator.',
      source: { id: '2', value: 'World Development Indicators' },
    },
  ])
}
