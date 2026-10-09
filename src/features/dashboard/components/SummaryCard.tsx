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
  children,
}: Props) {
  return (
    <section aria-labelledby={`${id}-heading`} className="min-w-0">
      <Card className="flex h-full flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id={`${id}-heading`} className="text-lg font-semibold">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">{context}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label={`${error ? 'Retry' : 'Refresh'} ${title.toLowerCase()} summary`}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line text-accent disabled:opacity-50"
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
          <div className="flex-1 space-y-4">{children}</div>
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
      <dd className="mt-1 break-words text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </dd>
    </dl>
  )
}
