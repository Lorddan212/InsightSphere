export function WeatherPageSkeleton() {
  return (
    <div role="status" aria-label="Loading weather" className="space-y-6">
      <span className="sr-only">Loading weather…</span>
      <div
        aria-hidden="true"
        className="h-64 animate-pulse rounded-xl bg-line"
      />
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-36 animate-pulse rounded-xl bg-line" />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="h-80 animate-pulse rounded-xl bg-line"
      />
      <div
        aria-hidden="true"
        className="h-52 animate-pulse rounded-xl bg-line"
      />
      <div
        aria-hidden="true"
        className="h-96 animate-pulse rounded-xl bg-line"
      />
    </div>
  )
}
