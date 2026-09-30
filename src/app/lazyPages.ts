import { lazy } from 'react'

export const DashboardOverview = lazy(
  () => import('../features/dashboard/components/DashboardOverview'),
)
export const DomainPage = lazy(() => import('../pages/DomainPage'))
export const SettingsPage = lazy(() => import('../pages/SettingsPage'))
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
