import { PageHeader } from '../../../components/layout/PageHeader'
import { WeatherSummary } from './WeatherSummary'
import { CurrencySummary } from './CurrencySummary'
import { EconomySummary } from './EconomySummary'
import { CryptoSummary } from './CryptoSummary'

export default function DashboardOverview() {
  return (
    <>
      <PageHeader
        title="Your analytics overview."
        description="Four perspectives, one workspace. Summaries follow your saved selections; explore a domain to change them or go deeper."
      />
      <p className="mb-6 max-w-3xl text-sm leading-6 text-muted">
        Each source publishes on its own schedule. Compare trends within their
        domain and use the observation dates below for context.
      </p>
      <div className="grid items-stretch gap-5 xl:grid-cols-2">
        <WeatherSummary />
        <CurrencySummary />
        <EconomySummary />
        <CryptoSummary />
      </div>
    </>
  )
}
