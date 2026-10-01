import { z } from 'zod'
import { ApiError, requestJson } from '../../../lib/api/request'
import {
  countrySchema,
  indicatorMetadataSchema,
  observationSchema,
  paginationSchema,
} from '../schemas/economy.schema'
import type { EconomicRange, IndicatorMetadata } from '../types/economy.types'
import { mapCountries, mapEconomicSeries } from '../utils/mapEconomicResponse'

export const ECONOMY_ENDPOINT = 'https://api.worldbank.org/v2'
function invalid(): ApiError {
  return new ApiError(
    'invalid',
    'World Bank returned incomplete or unexpected data. Please try again later.',
  )
}

async function fetchPages<T>(
  path: string,
  schema: z.ZodType<T>,
  parameters: Record<string, string>,
  signal?: AbortSignal,
): Promise<{ rows: T[]; updated: string | null }> {
  const pageSchema = z.tuple([
    paginationSchema,
    z.array(schema).nullable().optional(),
  ])
  const rows: T[] = []
  let expectedPages = 1
  let expectedTotal: number | null = null
  let updated: string | null = null
  for (let page = 1; page <= expectedPages; page++) {
    const url = new URL(`${ECONOMY_ENDPOINT}/${path}`)
    url.search = new URLSearchParams({
      format: 'json',
      per_page: '100',
      ...parameters,
      page: String(page),
    }).toString()
    let raw: unknown
    try {
      raw = await requestJson(url, signal)
    } catch (error) {
      if (
        error instanceof ApiError &&
        [400, 404, 422].includes(error.status ?? 0)
      )
        throw new ApiError(
          'http',
          'World Bank could not supply this country or indicator. Try another selection.',
          error.status,
        )
      throw error
    }
    if (
      Array.isArray(raw) &&
      raw[0] &&
      typeof raw[0] === 'object' &&
      'message' in raw[0]
    )
      throw new ApiError(
        'invalid',
        'World Bank could not process this country or indicator. Try another selection.',
      )
    const result = pageSchema.safeParse(raw)
    if (!result.success) throw invalid()
    const [meta, data] = result.data
    const pages = Math.max(1, meta.pages)
    if (
      meta.page !== page ||
      pages > 20 ||
      meta.total > 5000 ||
      (meta.total > 0 && (!data?.length || meta.pages === 0))
    )
      throw invalid()
    if (
      expectedTotal !== null &&
      (meta.total !== expectedTotal ||
        pages !== expectedPages ||
        (meta.lastupdated ?? null) !== updated)
    )
      throw invalid()
    expectedPages = pages
    expectedTotal = meta.total
    updated = meta.lastupdated ?? null
    rows.push(...(data ?? []))
  }
  if (rows.length !== expectedTotal) throw invalid()
  return { rows, updated }
}

export async function fetchCountries(signal?: AbortSignal) {
  const { rows } = await fetchPages(
    'country',
    countrySchema,
    { per_page: '400' },
    signal,
  )
  return mapCountries(rows)
}
export async function fetchIndicatorMetadata(
  code: string,
  signal?: AbortSignal,
): Promise<IndicatorMetadata | null> {
  const { rows } = await fetchPages(
    `indicator/${encodeURIComponent(code)}`,
    indicatorMetadataSchema,
    { source: '2' },
    signal,
  )
  if (!rows.length) return null
  const row = rows.find((item) => item.id === code && item.source.id === '2')
  if (!row) throw invalid()
  return {
    code,
    name: row.name,
    description: row.sourceNote,
    source: row.source.value,
  }
}
export async function fetchEconomicSeries(
  country: string,
  indicator: string,
  range: EconomicRange,
  signal?: AbortSignal,
) {
  const { rows, updated } = await fetchPages(
    `country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(indicator)}`,
    observationSchema,
    { source: '2', date: `${range.from}:${range.to}` },
    signal,
  )
  return mapEconomicSeries(rows, country, indicator, range, updated)
}
