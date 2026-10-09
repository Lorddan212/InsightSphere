import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { cryptoProxyPlugin } from './server/crypto/vite.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'COINGECKO_')
  return {
    plugins: [
      react(),
      tailwindcss(),
      cryptoProxyPlugin(env.COINGECKO_API_KEY ?? ''),
    ],
  }
})
