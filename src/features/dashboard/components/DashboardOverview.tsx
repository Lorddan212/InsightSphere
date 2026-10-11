import { PageHeader } from '../../../components/layout/PageHeader'
import { WeatherSummary } from './WeatherSummary'
import { CurrencySummary } from './CurrencySummary'
import { EconomySummary } from './EconomySummary'
import { CryptoSummary } from './CryptoSummary'

export default function DashboardOverview() {
  return (
    <>
      <PageHeader
        title="Analytics Overview"
        description="Monitor weather, foreign exchange, economic and digital-asset indicators from one workspace."
      />
      <p className="data-note mb-7">
        Summaries follow your saved selections. Each provider publishes on its
        own schedule; observation dates identify the period each value
        describes.
      </p>
      <div className="grid items-stretch gap-6 xl:grid-cols-2">
        <WeatherSummary />
        <CurrencySummary />
        <EconomySummary />
        <CryptoSummary />
      </div>
    </>
  )
}
