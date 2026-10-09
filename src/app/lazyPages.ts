import { lazy } from 'react'

export const DashboardOverview = lazy(
  () => import('../features/dashboard/components/DashboardOverview'),
)
export const WeatherPage = lazy(
  () => import('../features/weather/components/WeatherPage'),
)
export const CurrencyPage = lazy(
  () => import('../features/currencies/components/CurrencyPage'),
)
export const EconomyPage = lazy(
  () => import('../features/economy/components/EconomyPage'),
)
export const CryptoPage = lazy(
  () => import('../features/crypto/components/CryptoPage'),
)
export const SettingsPage = lazy(() => import('../pages/SettingsPage'))
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
