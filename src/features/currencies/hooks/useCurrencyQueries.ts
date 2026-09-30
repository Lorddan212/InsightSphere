import { useQuery } from '@tanstack/react-query'
import { retryTransientError } from '../../../lib/api/request'
import {
  fetchCurrencies,
  fetchHistoricalRates,
  fetchLatestRate,
} from '../api/currencies.api'
import { currencyKeys } from '../api/currencies.keys'
import type {
  CurrencyDateRange,
  CurrencySelection,
} from '../types/currencies.types'

const options = {
  retry: retryTransientError,
  refetchOnWindowFocus: false,
  gcTime: 24 * 60 * 60_000,
}
export function useCurrencies() {
  return useQuery({
    ...options,
    queryKey: currencyKeys.supported(),
    queryFn: ({ signal }) => fetchCurrencies(signal),
    staleTime: 24 * 60 * 60_000,
  })
}
export function useLatestRate(selection: CurrencySelection | null) {
  const base = selection?.base ?? ''
  const quote = selection?.quote ?? ''
  return useQuery({
    ...options,
    queryKey: currencyKeys.latest(base, quote),
    queryFn: ({ signal }) => fetchLatestRate(base, quote, signal),
    enabled: !!selection && base !== quote,
    staleTime: 30 * 60_000,
  })
}
export function useHistoricalRates(
  selection: CurrencySelection | null,
  range: CurrencyDateRange,
) {
  const base = selection?.base ?? ''
  const quote = selection?.quote ?? ''
  return useQuery({
    ...options,
    queryKey: currencyKeys.history(base, quote, range),
    queryFn: ({ signal }) => fetchHistoricalRates(base, quote, range, signal),
    enabled: !!selection && base !== quote,
    staleTime: 60 * 60_000,
  })
}
