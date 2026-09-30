import { Link } from 'react-router'
import { PageHeader } from '../components/layout/PageHeader'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Page not found"
        description="This address does not match a page in your workspace."
      />
      <Link
        to="/"
        className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-panel"
      >
        Return to overview
      </Link>
    </>
  )
}
