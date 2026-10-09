import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { ApiError, requestJson, retryTransientError } from './request'

const endpoint = new URL('https://provider.example.test/data')

describe('shared offline request boundary', () => {
  it.each([400, 401, 403, 404, 429, 500, 502, 503])(
    'classifies HTTP %s without exposing the provider body',
    async (status) => {
      server.use(
        http.get(
          endpoint.href,
          () => new HttpResponse('private provider diagnostic', { status }),
        ),
      )
      const error = await requestJson(endpoint).catch((value: unknown) => value)
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ kind: 'http', status })
      if (!(error instanceof ApiError)) throw new Error('Expected ApiError')
      expect(error.message).not.toContain('private provider diagnostic')
      expect(error.message).not.toContain('location')
      expect(retryTransientError(0, error)).toBe(status >= 500)
      expect(retryTransientError(2, error)).toBe(false)
    },
  )

  it('rejects malformed JSON without retrying a deterministic data error', async () => {
    server.use(http.get(endpoint.href, () => new HttpResponse('{broken')))
    await expect(requestJson(endpoint)).rejects.toMatchObject({
      kind: 'invalid',
    })
    expect(retryTransientError(0, new ApiError('invalid', 'bad data'))).toBe(
      false,
    )
  })

  it('rejects an error envelope even on HTTP success', async () => {
    server.use(
      http.get(endpoint.href, () => HttpResponse.json({ error: true })),
    )
    await expect(requestJson(endpoint)).rejects.toMatchObject({
      kind: 'invalid',
    })
  })

  it('classifies a mocked connection failure as retryable', async () => {
    server.use(http.get(endpoint.href, () => HttpResponse.error()))
    await expect(requestJson(endpoint)).rejects.toMatchObject({
      kind: 'network',
    })
    expect(retryTransientError(0, new ApiError('network', 'offline'))).toBe(
      true,
    )
  })

  it('classifies timeout cancellation without waiting fifteen seconds', async () => {
    server.use(http.get(endpoint.href, () => HttpResponse.json({ value: 1 })))
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(
      AbortSignal.abort(new DOMException('Timed out', 'TimeoutError')),
    )
    await expect(requestJson(endpoint)).rejects.toMatchObject({
      kind: 'timeout',
    })
    expect(retryTransientError(0, new ApiError('timeout', 'timeout'))).toBe(
      true,
    )
  })

  it('preserves caller cancellation instead of reporting a provider failure', async () => {
    server.use(http.get(endpoint.href, () => HttpResponse.json({ value: 1 })))
    const reason = new DOMException('Selection changed', 'AbortError')
    await expect(requestJson(endpoint, AbortSignal.abort(reason))).rejects.toBe(
      reason,
    )
    expect(retryTransientError(0, reason)).toBe(false)
  })

  it('requests JSON and preserves zero and null for domain validation', async () => {
    server.use(
      http.get(endpoint.href, ({ request }) => {
        expect(request.headers.get('Accept')).toBe('application/json')
        return HttpResponse.json({ zero: 0, missing: null })
      }),
    )
    await expect(requestJson(endpoint)).resolves.toEqual({
      zero: 0,
      missing: null,
    })
  })
})
