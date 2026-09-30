import type { CurrencyDateRange } from '../types/currencies.types'
export const currencyKeys = {
  all: ['currencies'] as const,
  supported: () => [...currencyKeys.all, 'supported'] as const,
  latest: (base: string, quote: string) =>
    [...currencyKeys.all, 'latest', base, quote] as const,
  history: (base: string, quote: string, range: CurrencyDateRange) =>
    [
      ...currencyKeys.all,
      'history',
      base,
      quote,
      range.from,
      range.to,
    ] as const,
}
