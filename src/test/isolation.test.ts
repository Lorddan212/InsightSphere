import { expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { mockDialog, mockMedia } from './browserMocks'
import {
  DEFAULT_LOCATION,
  useWeatherLocation,
} from '../features/weather/hooks/useWeatherLocation'

const originalMedia = window.matchMedia
const originalDialog = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
)

// Both cases start clean and then dirty the same state, so either execution
// order exercises the shared afterEach cleanup without depending on fixtures.
it.each([1, 2])('isolates browser and preference state (case %s)', () => {
  expect(localStorage.length).toBe(0)
  expect(sessionStorage.length).toBe(0)
  expect(document.documentElement.dataset.theme).toBeUndefined()
  expect(document.body.style.overflow).toBe('')
  expect(document.title).toBe('')
  expect(window.matchMedia).toBe(originalMedia)
  expect(
    Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'),
  ).toEqual(originalDialog)
  expect(typeof ResizeObserver).toBe('function')
  const { result } = renderHook(useWeatherLocation)
  expect(result.current.location).toEqual(DEFAULT_LOCATION)

  mockMedia(true)
  mockDialog()
  localStorage.setItem('insightsphere.theme', 'dark')
  document.documentElement.dataset.theme = 'dark'
  document.body.style.overflow = 'hidden'
  document.title = 'Previous view'
  act(() =>
    result.current.selectLocation({ ...DEFAULT_LOCATION, name: 'Test city' }),
  )
})
