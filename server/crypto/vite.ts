import type { Plugin, Connect } from 'vite'
import { createCryptoProxy } from './proxy.ts'

export function cryptoProxyPlugin(apiKey: string): Plugin {
  const handle = createCryptoProxy({ apiKey })
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const path = req.url ?? ''
    if (!path.startsWith('/api/crypto')) return next()
    // Use a fixed local origin, never the untrusted Host header.
    const request = new Request(`http://localhost${path}`, {
      method: req.method ?? 'GET',
    })
    void handle(request)
      .then(async (response) => {
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(await response.text())
      })
      .catch(() => {
        res.statusCode = 500
        res.end('{"error":{"code":"PROVIDER"}}')
      })
  }
  return {
    name: 'crypto-server-proxy',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
