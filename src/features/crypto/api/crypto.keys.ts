import type { CryptoPeriod } from '../types/crypto'
export const cryptoKeys = {
  all: ['crypto'] as const,
  global: () => ['crypto', 'global'] as const,
  markets: () => ['crypto', 'markets', 'usd', 1] as const,
  asset: (id: string) => ['crypto', 'asset', id, 'usd'] as const,
  history: (id: string, period: CryptoPeriod) =>
    ['crypto', 'history', id, 'usd', period] as const,
}
