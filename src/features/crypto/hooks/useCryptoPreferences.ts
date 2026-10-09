import { useState } from 'react'
import { z } from 'zod'
import { coinIdSchema, periodSchema } from '../schemas/crypto.schemas'
import type { CryptoPeriod } from '../types/crypto'

export const CRYPTO_STORAGE_KEY = 'insightsphere.crypto.preferences.v1'
const schema = z.object({ coinId: coinIdSchema, period: periodSchema })
const defaults = { coinId: 'bitcoin', period: '7D' as CryptoPeriod }
function read() {
  try {
    return schema.parse(
      JSON.parse(sessionStorage.getItem(CRYPTO_STORAGE_KEY) ?? 'null'),
    )
  } catch {
    return defaults
  }
}
export function useCryptoPreferences() {
  const [preferences, setPreferences] = useState(read)
  function save(patch: Partial<typeof preferences>) {
    const next = { ...preferences, ...patch }
    setPreferences(next)
    try {
      sessionStorage.setItem(CRYPTO_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* Storage may be disabled. */
    }
  }
  return { preferences, save }
}
