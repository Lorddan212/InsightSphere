import { createBrowserRouter, Navigate } from 'react-router'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { domains } from './navigation'

import {
  DashboardOverview,
  DomainPage,
  SettingsPage,
  NotFoundPage,
  WeatherPage,
} from './lazyPages'

export const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardOverview /> },
      { path: 'dashboard', element: <Navigate to="/" replace /> },
      { path: '/weather', element: <WeatherPage /> },
      ...domains
        .filter(({ path }) => path !== '/weather')
        .map(({ path }) => ({ path, element: <DomainPage /> })),
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
