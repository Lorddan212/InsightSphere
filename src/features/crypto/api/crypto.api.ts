import { z } from 'zod'
import { ApiError } from '../../../lib/api/request'
import {
  CRYPTO_ERRORS,
  coinIdSchema,
  globalSchema,
  historySchema,
  marketsSchema,
} from '../schemas/crypto.schemas'
import {
  normalizeAsset,
  normalizeGlobal,
  normalizeHistory,
} from '../utils/crypto'
import type { CryptoPeriod } from '../types/crypto'

const errorSchema = z.object({
  error: z.object({
    code: z.enum(
      Object.keys(CRYPTO_ERRORS) as [
        keyof typeof CRYPTO_ERRORS,
        ...Array<keyof typeof CRYPTO_ERRORS>,
      ],
    ),
  }),
})
async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const timeout = AbortSignal.timeout(20000)
  try {
    const response = await fetch(
      new URL(`/api/crypto/${path}`, window.location.origin),
      {
        headers: { Accept: 'application/json' },
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      },
    )
    let raw: unknown
    try {
      raw = await response.json()
    } catch (error) {
      if (signal?.aborted || timeout.aborted) throw error
      throw new ApiError(
        response.ok ? 'invalid' : 'http',
        response.ok ? CRYPTO_ERRORS.INVALID_DATA : CRYPTO_ERRORS.PROVIDER,
        response.status,
      )
    }
    if (!response.ok) {
      const error = errorSchema.safeParse(raw)
      throw new ApiError(
        'http',
        error.success
          ? CRYPTO_ERRORS[error.data.error.code]
          : CRYPTO_ERRORS.PROVIDER,
        response.status,
      )
    }
    const parsed = schema.safeParse(raw)
    if (!parsed.success)
      throw new ApiError('invalid', CRYPTO_ERRORS.INVALID_DATA)
    return parsed.data
  } catch (error) {
    if (signal?.aborted) throw error
    if (error instanceof ApiError) throw error
    if (timeout.aborted) throw new ApiError('timeout', CRYPTO_ERRORS.TIMEOUT)
    throw new ApiError(
      'network',
      'Crypto data could not load. Check your connection and try again.',
    )
  }
}
export async function fetchMarkets(signal?: AbortSignal) {
  return (await request('markets?currency=usd', marketsSchema, signal)).map(
    normalizeAsset,
  )
}
export async function fetchAsset(id: string, signal?: AbortSignal) {
  if (!coinIdSchema.safeParse(id).success)
    throw new ApiError('invalid', CRYPTO_ERRORS.INVALID_INPUT)
  const rows = await request(`coins/${id}?currency=usd`, marketsSchema, signal)
  if (!rows.length) throw new ApiError('http', CRYPTO_ERRORS.NOT_FOUND, 404)
  if (rows.length !== 1 || rows[0].id !== id)
    throw new ApiError('invalid', CRYPTO_ERRORS.INVALID_DATA)
  return normalizeAsset(rows[0])
}
export async function fetchHistory(
  id: string,
  period: CryptoPeriod,
  signal?: AbortSignal,
) {
  if (!coinIdSchema.safeParse(id).success)
    throw new ApiError('invalid', CRYPTO_ERRORS.INVALID_INPUT)
  return normalizeHistory(
    await request(
      `coins/${id}/history?currency=usd&period=${period}`,
      historySchema,
      signal,
    ),
  )
}
export async function fetchGlobal(signal?: AbortSignal) {
  return normalizeGlobal(await request('global', globalSchema, signal))
}
