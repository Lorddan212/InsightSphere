import { useState } from 'react'
import { economySelectionSchema } from '../schemas/economy.schema'
import type { Country, EconomySelection } from '../types/economy.types'
import {
  DEFAULT_COUNTRY_ID,
  DEFAULT_INDICATOR,
} from '../utils/economicIndicators'

export const ECONOMY_STORAGE_KEY = 'insightsphere.economy.selection'
function readSelection(): EconomySelection | null {
  try {
    const parsed = economySelectionSchema.safeParse(
      JSON.parse(sessionStorage.getItem(ECONOMY_STORAGE_KEY) ?? 'null'),
    )
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
export function resolveEconomySelection(
  saved: EconomySelection | null,
  countries: Country[],
): EconomySelection | null {
  if (!countries.length) return null
  const supports = (id: string) =>
    countries.some((country) => country.id === id)
  const country =
    saved && supports(saved.country)
      ? saved.country
      : supports(DEFAULT_COUNTRY_ID)
        ? DEFAULT_COUNTRY_ID
        : countries[0].id
  return {
    country,
    indicator: saved?.indicator ?? DEFAULT_INDICATOR.code,
    period: saved?.period ?? '10Y',
    comparisons: [...new Set(saved?.comparisons ?? [])]
      .filter((id) => supports(id) && id !== country)
      .slice(0, 2),
  }
}
export function useEconomySelection(countries: Country[]) {
  const [saved, setSaved] = useState(readSelection)
  const selection = resolveEconomySelection(saved, countries)
  function select(next: EconomySelection) {
    setSaved(next)
    try {
      sessionStorage.setItem(ECONOMY_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* Keep usable state when storage is blocked. */
    }
  }
  return { selection, select }
}
