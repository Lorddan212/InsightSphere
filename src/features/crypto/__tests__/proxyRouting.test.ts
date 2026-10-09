import { expect, it, vi } from 'vitest'
import type { Connect, ViteDevServer } from 'vite'
import { cryptoProxyPlugin } from '../../../../server/crypto/vite'

function middleware() {
  const use = vi.fn<(handler: Connect.NextHandleFunction) => void>()
  const configure = cryptoProxyPlugin('').configureServer
  if (typeof configure !== 'function') throw new Error('Missing server hook')
  // This hook uses only middleware registration, not Vite's plugin context.
  configure.call(
    {} as ThisParameterType<typeof configure>,
    { middlewares: { use } } as unknown as ViteDevServer,
  )
  return use.mock.calls[0][0]
}

it.each(['/api/cryptography', '/api/crypto-extra', '/weather'])(
  'leaves unrelated path %s to the next middleware',
  (url) => {
    const next = vi.fn()
    const end = vi.fn()
    middleware()(
      { url, method: 'GET' } as Parameters<Connect.NextHandleFunction>[0],
      { end } as unknown as Parameters<Connect.NextHandleFunction>[1],
      next,
    )
    expect(next).toHaveBeenCalledOnce()
    expect(end).not.toHaveBeenCalled()
  },
)

it('handles the crypto namespace with safe JSON and no network when unconfigured', async () => {
  const next = vi.fn()
  const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() }
  middleware()(
    {
      url: '/api/crypto/global',
      method: 'GET',
    } as Parameters<Connect.NextHandleFunction>[0],
    response as unknown as Parameters<Connect.NextHandleFunction>[1],
    next,
  )
  await vi.waitFor(() => expect(response.end).toHaveBeenCalledOnce())
  expect(next).not.toHaveBeenCalled()
  expect(response.statusCode).toBe(503)
  expect(response.setHeader).toHaveBeenCalledWith('cache-control', 'no-store')
  expect(response.setHeader).toHaveBeenCalledWith(
    'content-type',
    'application/json',
  )
  expect(JSON.parse(response.end.mock.calls[0][0] as string)).toEqual({
    error: {
      code: 'NOT_CONFIGURED',
      message:
        'Cryptocurrency data is not available in this workspace yet. You can continue using weather, currency, and economy analytics.',
    },
  })
})
