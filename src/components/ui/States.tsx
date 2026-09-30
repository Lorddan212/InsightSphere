import { CircleAlert, Database } from 'lucide-react'
import { Button } from './Button'

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <Database aria-hidden="true" className="mb-4 size-8 text-muted" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
    </div>
  )
}

export function ErrorState({
  title = 'This view could not load',
  description,
  onRetry,
}: {
  title?: string
  description: string
  onRetry?: () => void
}) {
  return (
    <div role="alert" className="rounded-xl border border-line bg-panel p-8">
      <CircleAlert aria-hidden="true" className="mb-3 text-accent" />
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="my-3 text-muted">{description}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-6">
      <span className="sr-only">Loading page…</span>
      <div
        aria-hidden="true"
        className="h-10 w-52 animate-pulse rounded-lg bg-line"
      />
      <div
        aria-hidden="true"
        className="h-64 animate-pulse rounded-xl bg-line"
      />
    </div>
  )
}
