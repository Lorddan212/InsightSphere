import { useQuery } from '@tanstack/react-query'
import {
  fetchAsset,
  fetchGlobal,
  fetchHistory,
  fetchMarkets,
} from '../api/crypto.api'
import { cryptoKeys } from '../api/crypto.keys'
import type { CryptoPeriod } from '../types/crypto'

const policy = {
  staleTime: 60000,
  gcTime: 30 * 60000,
  retry: false,
  refetchOnWindowFocus: false,
} as const
export function useCryptoQueries(
  id: string,
  period: CryptoPeriod,
  valid: boolean,
) {
  const global = useQuery({
    queryKey: cryptoKeys.global(),
    queryFn: ({ signal }) => fetchGlobal(signal),
    ...policy,
    staleTime: 120000,
  })
  const markets = useQuery({
    queryKey: cryptoKeys.markets(),
    queryFn: ({ signal }) => fetchMarkets(signal),
    ...policy,
  })
  // Reuse the list's quote. Only deep links outside the top 50 need a detail request.
  const listed = markets.data?.find((asset) => asset.id === id)
  const asset = useQuery({
    queryKey: cryptoKeys.asset(id),
    queryFn: ({ signal }) => fetchAsset(id, signal),
    ...policy,
    enabled: valid && !listed && !markets.isPending,
  })
  const selected = listed ?? asset.data
  const history = useQuery({
    queryKey: cryptoKeys.history(id, period),
    queryFn: ({ signal }) => fetchHistory(id, period, signal),
    ...policy,
    staleTime: 300000,
    enabled: valid && !!selected,
  })
  return { global, markets, asset, history, selected, listed }
}
