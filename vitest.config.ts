import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Concurrent jsdom/chart suites exhaust constrained development machines.
    // Keep file isolation; run one worker at a time.
    maxWorkers: 1,
    testTimeout: 15000,
    env: { NODE_ENV: 'test' },
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
  },
})
