import { ApiError, requestJson } from '../../../lib/api/request'
import {
  currenciesSchema,
  historySchema,
  rateSchema,
} from '../schemas/currencies.schema'
import type { Currency, CurrencyDateRange } from '../types/currencies.types'
import { mapHistoricalRates, mapLatestRate } from '../utils/mapCurrencyResponse'

export const CURRENCY_ENDPOINT = 'https://api.frankfurter.dev/v2'
async function requestCurrency(
  url: URL,
  signal?: AbortSignal,
): Promise<unknown> {
  try {
    return await requestJson(url, signal)
  } catch (error) {
    if (
      error instanceof ApiError &&
      [400, 404, 422].includes(error.status ?? 0)
    )
      throw new ApiError(
        'http',
        'The provider could not supply this currency data. Try another pair or period.',
        error.status,
      )
    throw error
  }
}
function invalidResponse(): ApiError {
  return new ApiError(
    'invalid',
    'The currency provider returned unexpected data. Please try again later.',
  )
}
export async function fetchCurrencies(
  signal?: AbortSignal,
): Promise<Currency[]> {
  const result = currenciesSchema.safeParse(
    await requestCurrency(new URL(`${CURRENCY_ENDPOINT}/currencies`), signal),
  )
  if (!result.success) throw invalidResponse()
  return Array.from(
    new Map(
      result.data.map((row) => [
        row.iso_code,
        { code: row.iso_code, name: row.name },
      ]),
    ).values(),
  ).sort((a, b) => a.code.localeCompare(b.code))
}
export async function fetchLatestRate(
  base: string,
  quote: string,
  signal?: AbortSignal,
) {
  const result = rateSchema.safeParse(
    await requestCurrency(
      new URL(
        `${CURRENCY_ENDPOINT}/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
      ),
      signal,
    ),
  )
  if (!result.success) throw invalidResponse()
  return mapLatestRate(result.data, base, quote)
}
export async function fetchHistoricalRates(
  base: string,
  quote: string,
  range: CurrencyDateRange,
  signal?: AbortSignal,
) {
  const url = new URL(`${CURRENCY_ENDPOINT}/rates`)
  url.search = new URLSearchParams({
    base,
    quotes: quote,
    from: range.from,
    to: range.to,
  }).toString()
  const result = historySchema.safeParse(await requestCurrency(url, signal))
  if (!result.success) throw invalidResponse()
  return mapHistoricalRates(result.data, base, quote, range)
}
