import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach, expect, vi } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { server } from './server'

const unexpectedRequests: string[] = []

// Chart-heavy DOM suites can take more than the default second on slower hosts.
// This changes only the wait budget, not assertions, retries, or network policy.
configure({ asyncUtilTimeout: 5000 })

// Register once per isolated test environment, never once per request/test.
beforeAll(() => {
  server.events.on('response:bypass', ({ request }) => {
    unexpectedRequests.push(`Bypassed: ${request.method} ${request.url}`)
  })
  server.listen({
    onUnhandledRequest(request, print) {
      unexpectedRequests.push(`Unhandled: ${request.method} ${request.url}`)
      // Block the real request, even if application error handling catches it.
      print.error()
    },
  })
})
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 800, 300),
  )
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  sessionStorage.clear()
  vi.useRealTimers()
  // A caught network error must not accidentally make an unmocked test pass.
  const unexpected = unexpectedRequests.splice(0)
  expect(unexpected, 'All test requests must be handled by MSW').toEqual([])
})
afterAll(() => server.close())

// jsdom has no layout engine; chart rendering is checked in the real browser.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub)
