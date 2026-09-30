import { useState } from 'react'
import { selectionSchema } from '../schemas/currencies.schema'
import type { Currency, CurrencySelection } from '../types/currencies.types'

export const CURRENCY_STORAGE_KEY = 'insightsphere.currencies.selection'
function readSelection(): CurrencySelection | null {
  try {
    const result = selectionSchema.safeParse(
      JSON.parse(sessionStorage.getItem(CURRENCY_STORAGE_KEY) ?? 'null'),
    )
    return result.success ? result.data : null
  } catch {
    return null
  }
}
export function resolveCurrencySelection(
  saved: CurrencySelection | null,
  currencies: Currency[],
): CurrencySelection | null {
  if (!currencies.length) return null
  const supports = (code: string) =>
    currencies.some((currency) => currency.code === code)
  const base =
    saved && supports(saved.base)
      ? saved.base
      : supports('USD')
        ? 'USD'
        : currencies[0].code
  const quote =
    saved && supports(saved.quote)
      ? saved.quote
      : supports('NGN')
        ? 'NGN'
        : supports('EUR')
          ? 'EUR'
          : (currencies.find((currency) => currency.code !== base)?.code ??
            base)
  return { base, quote, period: saved?.period ?? '1M' }
}
export function useCurrencySelection(currencies: Currency[]) {
  const [saved, setSaved] = useState(readSelection)
  const selection = resolveCurrencySelection(saved, currencies)
  function select(next: CurrencySelection) {
    setSaved(next)
    try {
      sessionStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* Selection still works when storage is unavailable. */
    }
  }
  return { selection, select }
}
