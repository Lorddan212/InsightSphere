import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import NotFoundPage from '../../pages/NotFoundPage'
import { mockDialog, mockMedia } from '../../test/browserMocks'

beforeEach(() => {
  mockMedia()
  mockDialog()
})
function mount(initial = '/', element = <h1>Working view</h1>) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<h1>Overview content</h1>} />
          <Route path="weather" element={element} />
          <Route path="crypto/:coinId" element={<h1>Crypto view</h1>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Workspace navigation and recovery', () => {
  it('identifies the active route, titles deep links and exposes a focusable skip destination', () => {
    mount('/crypto/bitcoin')
    expect(document.title).toBe('Cryptocurrency Analytics | InsightSphere')
    expect(screen.getByRole('link', { name: 'Crypto' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('link', { name: 'Skip to main content' }),
    ).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  })
  it('navigates with the keyboard and focuses the new main view', async () => {
    const user = userEvent.setup()
    mount()
    screen.getByRole('link', { name: 'Weather' }).focus()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('heading', { name: 'Working view' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveFocus()
    expect(document.title).toBe('Weather Analytics | InsightSphere')
  })
  it('closes mobile navigation after selection and focuses content rather than the menu trigger', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' })
    expect(document.body.style.overflow).toBe('hidden')
    const link = within(dialog).getByRole('link', { name: 'Weather' })
    link.focus()
    await user.keyboard('{Enter}')
    expect(dialog).not.toHaveAttribute('open')
    expect(document.body.style.overflow).toBe('')
    expect(screen.getByRole('main')).toHaveFocus()
  })
  it('restores trigger focus on explicit menu close and unlocks scrolling on unmount', async () => {
    const user = userEvent.setup()
    const view = mount()
    const trigger = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(trigger).toHaveFocus()
    await user.click(trigger)
    view.unmount()
    expect(document.body.style.overflow).toBe('')
  })
  it('closes the mobile dialog when the desktop breakpoint is reached', async () => {
    const change = mockMedia()
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: 'Open navigation' }))
    act(() => change('(min-width: 1024px)', true))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })
  it('keeps navigation available after render errors and can retry without exposing details', async () => {
    let broken = true
    function BrokenView() {
      if (broken) throw new Error('internal-private-diagnostic')
      return <h1>Recovered view</h1>
    }
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    mount('/weather', <BrokenView />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This view could not load',
    )
    expect(
      screen.queryByText(/internal-private-diagnostic/),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeInTheDocument()
    broken = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      screen.getByRole('heading', { name: 'Recovered view' }),
    ).toBeInTheDocument()
    expect(error).toHaveBeenCalled()
  })
  it('recovers on route changes after a render failure and supports not-found navigation', async () => {
    function BrokenView(): never {
      throw new Error('internal-private-diagnostic')
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const first = mount('/weather', <BrokenView />)
    await user.click(screen.getByRole('link', { name: 'Overview' }))
    expect(
      screen.getByRole('heading', { name: 'Overview content' }),
    ).toBeInTheDocument()
    first.unmount()
    mount('/missing')
    expect(document.title).toBe('Page not found | InsightSphere')
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Return to overview' }))
    expect(
      screen.getByRole('heading', { name: 'Overview content' }),
    ).toBeInTheDocument()
  })
})
