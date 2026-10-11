import { PageHeader } from '../../../components/layout/PageHeader'
import { WeatherSummary } from './WeatherSummary'
import { CurrencySummary } from './CurrencySummary'
import { EconomySummary } from './EconomySummary'
import { CryptoSummary } from './CryptoSummary'

export default function DashboardOverview() {
  return (
    <>
      <PageHeader
        title="Global Intelligence Overview"
        description="Your selected markets, economies and conditions, in perspective."
      />
      <div className="overview-grid">
        <CurrencySummary />
        <WeatherSummary />
        <EconomySummary />
        <CryptoSummary />
      </div>
      <div className="mt-8 border-t border-line pt-5">
        <p className="max-w-3xl text-xs leading-6 text-muted">
          Summaries follow your saved selections. Each provider publishes on its
          own schedule; observation dates identify the period each value
          describes.
        </p>
      </div>
    </>
  )
}
