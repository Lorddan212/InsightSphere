import { ErrorState } from '../components/ui/States'

export function RouteErrorPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <ErrorState
        description="Reload this page to try again. If it keeps failing, return to the overview."
        onRetry={() => window.location.reload()}
      />
      <a className="mt-6 inline-block text-accent underline" href="/">
        Return to overview
      </a>
    </main>
  )
}
