import type { CryptoAsset } from '../types/crypto'

export type AssetSortKey =
  'rank' | 'price' | 'change24h' | 'marketCap' | 'volume'
export type SortDirection = 'ascending' | 'descending'

export function sortAssets(
  assets: CryptoAsset[],
  key: AssetSortKey,
  direction: SortDirection,
): CryptoAsset[] {
  // Copy query data. Nulls stay last in either direction; ties retain source order.
  return [...assets].sort((a, b) => {
    const left = a[key]
    const right = b[key]
    if (left === null) return right === null ? 0 : 1
    if (right === null) return -1
    return direction === 'ascending' ? left - right : right - left
  })
}
