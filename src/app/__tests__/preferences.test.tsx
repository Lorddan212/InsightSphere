import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import themeScript from '../../../public/theme.js?raw'
import { ThemeProvider } from '../ThemeProvider'
import SettingsPage from '../../pages/SettingsPage'
import { mockMedia } from '../../test/browserMocks'
import {
  DEFAULT_LOCATION,
  resetWeatherLocationMemory,
  useWeatherLocation,
  WEATHER_STORAGE_KEY,
} from '../../features/weather/hooks/useWeatherLocation'
import {
  CURRENCY_STORAGE_KEY,
  useCurrencySelection,
} from '../../features/currencies/hooks/useCurrencySelection'
import {
  ECONOMY_STORAGE_KEY,
  useEconomySelection,
} from '../../features/economy/hooks/useEconomySelection'
import {
  CRYPTO_STORAGE_KEY,
  useCryptoPreferences,
} from '../../features/crypto/hooks/useCryptoPreferences'

const keys = [
  WEATHER_STORAGE_KEY,
  CURRENCY_STORAGE_KEY,
  ECONOMY_STORAGE_KEY,
  CRYPTO_STORAGE_KEY,
]
beforeEach(() => {
  localStorage.clear()
  resetWeatherLocationMemory()
  mockMedia()
  delete document.documentElement.dataset.theme
})
function PreferenceProbe() {
  const { location, selectLocation } = useWeatherLocation()
  const { selection: currency } = useCurrencySelection([
    { code: 'USD', name: 'Dollar' },
    { code: 'NGN', name: 'Naira' },
  ])
  const { selection: economy } = useEconomySelection([
    {
      id: 'NGA',
      iso2Code: 'NG',
      name: 'Nigeria',
      region: 'Africa',
      incomeLevel: '',
    },
  ])
  const { preferences: crypto } = useCryptoPreferences()
  return (
    <>
      <p>
        {location.name} · {currency?.base}/{currency?.quote} ·{' '}
        {economy?.country} · {crypto.coinId}
      </p>
      <button
        onClick={() =>
          selectLocation({
            ...DEFAULT_LOCATION,
            name: 'Tokyo',
            latitude: 35.6,
            longitude: 139.6,
          })
        }
      >
        Choose Tokyo
      </button>
      <Link to="/settings">Settings</Link>
    </>
  )
}
function mount(path = '/settings') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/weather" element={<PreferenceProbe />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('Appearance and preference controls', () => {
  it('persists an intentional theme and restores it after remount', async () => {
    const user = userEvent.setup()
    const first = mount()
    await user.click(screen.getByRole('radio', { name: /Dark/ }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('insightsphere.theme')).toBe('dark')
    first.unmount()
    mount()
    expect(screen.getByRole('radio', { name: /Dark/ })).toBeChecked()
  })
  it('follows system changes only when System is selected', async () => {
    const change = mockMedia(true)
    const user = userEvent.setup()
    mount()
    expect(screen.getByRole('radio', { name: /System/ })).toBeChecked()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    act(() => change('(prefers-color-scheme: dark)', false))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    await user.click(screen.getByRole('radio', { name: /Dark/ }))
    act(() => change('(prefers-color-scheme: dark)', false))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
  it('falls back from invalid appearance values and supports keyboard selection', async () => {
    localStorage.setItem('insightsphere.theme', 'unknown')
    const user = userEvent.setup()
    mount()
    expect(screen.getByRole('radio', { name: /System/ })).toBeChecked()
    screen.getByRole('radio', { name: /Dark/ }).focus()
    await user.keyboard(' ')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
  it('keeps appearance usable when browser storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('radio', { name: /Dark/ }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
  it('cancels reset without changing preferences and restores focus', async () => {
    localStorage.setItem('insightsphere.theme', 'dark')
    sessionStorage.setItem(
      CRYPTO_STORAGE_KEY,
      JSON.stringify({ coinId: 'ethereum', period: '30D' }),
    )
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByRole('button', { name: 'Reset preferences' }))
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(
      screen.queryByRole('button', { name: 'Confirm reset' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reset preferences' }),
    ).toHaveFocus()
    expect(localStorage.getItem('insightsphere.theme')).toBe('dark')
    expect(sessionStorage.getItem(CRYPTO_STORAGE_KEY)).toContain('ethereum')
  })
  it('resets only InsightSphere settings, including in-memory weather, then uses defaults', async () => {
    const user = userEvent.setup()
    mount('/weather')
    await user.click(screen.getByRole('button', { name: 'Choose Tokyo' }))
    await user.click(screen.getByRole('link', { name: 'Settings' }))
    keys.slice(1).forEach((key) => sessionStorage.setItem(key, '{broken'))
    localStorage.setItem('unrelated', 'keep')
    sessionStorage.setItem('unrelated', 'keep')
    await user.click(screen.getByRole('radio', { name: /Dark/ }))
    await user.click(screen.getByRole('button', { name: 'Reset preferences' }))
    screen.getByRole('button', { name: 'Confirm reset' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Preferences reset.')
    expect(screen.getByRole('radio', { name: /System/ })).toBeChecked()
    expect(keys.map((key) => sessionStorage.getItem(key))).toEqual([
      null,
      null,
      null,
      null,
    ])
    expect(localStorage.getItem('unrelated')).toBe('keep')
    expect(sessionStorage.getItem('unrelated')).toBe('keep')
    await user.click(
      screen.getByRole('link', { name: 'Manage weather location' }),
    )
    expect(
      screen.getByText('Abuja · USD/NGN · NGA · bitcoin'),
    ).toBeInTheDocument()
  })
  it('reports blocked reset storage honestly while updating appearance', async () => {
    const user = userEvent.setup()
    mount()
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    await user.click(screen.getByRole('button', { name: 'Reset preferences' }))
    await user.click(screen.getByRole('button', { name: 'Confirm reset' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Some browser preferences could not be cleared',
    )
    expect(screen.getByRole('radio', { name: /System/ })).toBeChecked()
  })
  it('applies persisted or device appearance before React starts, even with blocked storage', () => {
    localStorage.setItem('insightsphere.theme', 'dark')
    new Function(themeScript)()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    mockMedia(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    new Function(themeScript)()
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })
})
