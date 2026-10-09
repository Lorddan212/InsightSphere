export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

export async function requestJson(
  url: URL,
  signal?: AbortSignal,
): Promise<unknown> {
  const timeout = AbortSignal.timeout(15_000)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  try {
    const response = await fetch(url, {
      signal: combined,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      const message =
        response.status === 429
          ? 'The data provider is limiting requests. Please wait a few minutes before trying again.'
          : response.status >= 500
            ? 'The data provider is temporarily unavailable. Please try again.'
            : 'The data provider could not accept this request. Try another selection.'
      throw new ApiError('http', message, response.status)
    }
    let data: unknown
    try {
      data = await response.json()
    } catch (error) {
      if (combined.aborted) throw error
      throw new ApiError(
        'invalid',
        'The data provider returned unreadable data. Please try again later.',
      )
    }
    if (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      data.error === true
    ) {
      throw new ApiError(
        'invalid',
        'The data provider could not return the requested data.',
      )
    }
    return data
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeout.aborted)
      throw new ApiError('timeout', 'The request timed out. Please try again.')
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'network',
      'Could not connect to the data provider. Check your connection and try again.',
    )
  }
}

export function retryTransientError(
  failureCount: number,
  error: Error,
): boolean {
  if (!(error instanceof ApiError) || failureCount >= 2) return false
  return (
    error.kind === 'network' ||
    error.kind === 'timeout' ||
    (error.status !== undefined && error.status >= 500)
  )
}
