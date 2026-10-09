import { vi } from 'vitest'

const dialogMethods = ['showModal', 'close'] as const
const originalDialogMethods = dialogMethods.map((name) =>
  Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name),
)

export function restoreBrowserMocks() {
  dialogMethods.forEach((name, index) => {
    const original = originalDialogMethods[index]
    if (original)
      Object.defineProperty(HTMLDialogElement.prototype, name, original)
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name)
  })
}

// jsdom does not implement media queries or native modal focus behavior.
// Tests can verify our handlers, not certify browser focus containment.
export function mockMedia(initialDark = false) {
  const media = new Map<string, MediaQueryList>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      if (!media.has(query))
        media.set(
          query,
          Object.assign(new EventTarget(), {
            matches: query.includes('prefers-color-scheme') && initialDark,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
          }) as MediaQueryList,
        )
      return media.get(query)!
    }),
  )
  return (query: string, matches: boolean) => {
    const item = window.matchMedia(query)
    Object.assign(item, { matches })
    item.dispatchEvent(new Event('change'))
  }
}

export function mockDialog() {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
      this.querySelector<HTMLButtonElement>('button')?.focus()
    }),
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }),
  })
}
