export function EconomyLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="my-5 rounded-xl border border-line bg-panel p-5"
    >
      <span className="text-sm text-muted">{label}…</span>
      <div
        aria-hidden="true"
        className="mt-4 h-32 animate-pulse rounded-lg bg-line"
      />
    </div>
  )
}
