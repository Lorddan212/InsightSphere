import {
  WEATHER_STORAGE_KEY,
  resetWeatherLocationMemory,
} from '../../features/weather/hooks/useWeatherLocation'
import { CURRENCY_STORAGE_KEY } from '../../features/currencies/hooks/useCurrencySelection'
import { ECONOMY_STORAGE_KEY } from '../../features/economy/hooks/useEconomySelection'
import { CRYPTO_STORAGE_KEY } from '../../features/crypto/hooks/useCryptoPreferences'

// Explicit allowlist: unrelated keys, query data and credentials are never cleared.
export function resetPreferences(): boolean {
  let cleared = true
  for (const key of [
    WEATHER_STORAGE_KEY,
    CURRENCY_STORAGE_KEY,
    ECONOMY_STORAGE_KEY,
    CRYPTO_STORAGE_KEY,
  ]) {
    try {
      sessionStorage.removeItem(key)
    } catch {
      cleared = false
    }
  }
  try {
    localStorage.removeItem('insightsphere.theme')
  } catch {
    cleared = false
  }
  resetWeatherLocationMemory()
  return cleared
}
