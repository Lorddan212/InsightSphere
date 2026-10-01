import { useQueries, useQuery } from '@tanstack/react-query'
import { retryTransientError } from '../../../lib/api/request'
import {
  fetchCountries,
  fetchEconomicSeries,
  fetchIndicatorMetadata,
} from '../api/economy.api'
import { economyKeys } from '../api/economy.keys'
import type { EconomicRange } from '../types/economy.types'

const DAY = 24 * 60 * 60_000
const options = {
  retry: retryTransientError,
  refetchOnWindowFocus: false,
  gcTime: 7 * DAY,
}
export function useEconomyCountries() {
  return useQuery({
    ...options,
    queryKey: economyKeys.countries(),
    queryFn: ({ signal }) => fetchCountries(signal),
    staleTime: 7 * DAY,
  })
}
export function useIndicatorMetadata(indicator: string, enabled: boolean) {
  return useQuery({
    ...options,
    queryKey: economyKeys.metadata(indicator),
    queryFn: ({ signal }) => fetchIndicatorMetadata(indicator, signal),
    enabled,
    staleTime: 7 * DAY,
  })
}
export function useEconomicSeries(
  countries: string[],
  indicator: string,
  range: EconomicRange,
) {
  return useQueries({
    queries: countries.map((country) => ({
      ...options,
      queryKey: economyKeys.series(country, indicator, range),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchEconomicSeries(country, indicator, range, signal),
      staleTime: DAY,
    })),
  })
}
