import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cryptoKeys } from '../api/crypto.keys'
import type { CryptoAsset } from '../types/crypto'
import { assetOptions, globalOptions } from './useCryptoQueries'

// The overview needs a quote, not the full market list or price history.
export function useCryptoSnapshot(id: string) {
  const client = useQueryClient()
  const global = useQuery(globalOptions())
  const asset = useQuery({
    ...assetOptions(id),
    initialData: () =>
      client
        .getQueryData<CryptoAsset[]>(cryptoKeys.markets())
        ?.find((item) => item.id === id),
    initialDataUpdatedAt: () =>
      client.getQueryState(cryptoKeys.markets())?.dataUpdatedAt,
  })
  return { global, asset }
}
