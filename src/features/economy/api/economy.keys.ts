import type { EconomicRange } from '../types/economy.types'
export const economyKeys = {
  all: ['economy'] as const,
  countries: () => [...economyKeys.all, 'countries'] as const,
  metadata: (indicator: string) =>
    [...economyKeys.all, 'metadata', indicator] as const,
  series: (country: string, indicator: string, range: EconomicRange) =>
    [
      ...economyKeys.all,
      'series',
      country,
      indicator,
      range.from,
      range.to,
    ] as const,
}
