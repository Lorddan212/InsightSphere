import { createCryptoProxy } from '../server/crypto/proxy.js'

// One handler per warm instance preserves the proxy's cache and request budget.
const handle = createCryptoProxy({
  apiKey: process.env.COINGECKO_API_KEY ?? '',
})

export default { fetch: handle }
