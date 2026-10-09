import { createBrowserRouter, Navigate } from 'react-router'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { RouteErrorPage } from '../pages/RouteErrorPage'

import {
  DashboardOverview,
  SettingsPage,
  NotFoundPage,
  WeatherPage,
  CurrencyPage,
  EconomyPage,
  CryptoPage,
} from './lazyPages'

export const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardOverview /> },
      { path: 'dashboard', element: <Navigate to="/" replace /> },
      { path: '/weather', element: <WeatherPage /> },
      { path: '/currencies', element: <CurrencyPage /> },
      { path: '/economy', element: <EconomyPage /> },
      { path: '/crypto', element: <CryptoPage /> },
      { path: '/crypto/:coinId', element: <CryptoPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
