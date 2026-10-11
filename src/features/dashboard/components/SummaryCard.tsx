import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { Card } from '../../../components/ui/Card'

interface Props {
  id: string
  title: string
  context: string
  source: string
  href: string
  loading: boolean
  refreshing: boolean
  error: Error | null
  hasData: boolean
  onRefresh: () => void
  metric: ReactNode
  trend?: ReactNode
  children: ReactNode
}
export function SummaryCard({
  id,
  title,
  context,
  source,
  href,
  loading,
  refreshing,
  error,
  hasData,
  onRefresh,
  metric,
  trend,
  children,
}: Props) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      data-domain={id}
      className="min-w-0"
    >
      <Card className="summary-panel flex h-full flex-col p-5 sm:p-6 2xl:p-8">
        <div className="mb-7 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={`${id}-heading`}
              className="text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">{context}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label={`${error ? 'Retry' : 'Refresh'} ${title.toLowerCase()} summary`}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted transition-colors hover:border-accent hover:bg-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw aria-hidden="true" size={17} />
          </button>
        </div>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-line bg-soft p-3 text-sm"
          >
            <p className="font-medium">
              {hasData
                ? 'Some data could not be refreshed. Available data is retained and may be stale.'
                : `${title} is unavailable.`}
            </p>
            <p className="mt-1">{error.message}</p>
          </div>
        )}
        {loading && !hasData ? (
          <div role="status" className="min-h-44 py-8 text-sm text-muted">
            Loading {title.toLowerCase()} summary…
            <div
              aria-hidden="true"
              className="mt-4 space-y-3 motion-safe:animate-pulse"
            >
              <div className="h-8 w-1/2 rounded bg-soft" />
              <div className="h-24 rounded bg-soft" />
            </div>
          </div>
        ) : (
          <div className="summary-content flex-1">
            <div className="summary-reading">
              {metric}
              <div className="mt-4 space-y-3">{children}</div>
            </div>
            {trend && <div className="summary-trend">{trend}</div>}
          </div>
        )}
        {refreshing && hasData && (
          <p role="status" className="mt-3 text-xs text-muted">
            Refreshing {title.toLowerCase()}…
          </p>
        )}
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
          <span>Source: {source}</span>
          <Link
            to={href}
            className="inline-flex min-h-11 items-center gap-1 rounded font-semibold text-accent"
          >
            Explore {title.toLowerCase()}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </footer>
      </Card>
    </section>
  )
}
export function SummaryValue({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <dl>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="summary-value metric-value mt-3">{value}</dd>
    </dl>
  )
}
