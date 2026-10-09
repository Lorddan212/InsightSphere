import { Component, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from './Button'
import { ErrorState } from './States'

export class FeatureErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="space-y-4">
        <ErrorState
          title="This view could not load"
          description="An unexpected problem interrupted this view. Try again, reload the page, or choose another section from navigation."
          onRetry={() => this.setState({ failed: false })}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={() => window.location.reload()}>Reload page</Button>
          <Link
            className="inline-flex min-h-11 items-center rounded text-sm text-accent underline"
            to="/"
          >
            Return to overview
          </Link>
        </div>
      </div>
    )
  }
}
