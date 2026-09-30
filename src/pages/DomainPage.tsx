import { Link, useLocation } from 'react-router'
import { domains } from '../app/navigation'
import { PageHeader } from '../components/layout/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/States'

export default function DomainPage() {
  const { pathname } = useLocation()
  const domain = domains.find((item) => item.path === pathname)
  if (!domain) return null
  const Icon = domain.icon
  return (
    <>
      <PageHeader
        title={`${domain.title} analytics`}
        description={domain.description}
        action={<Badge>Coming soon</Badge>}
      />
      <Card>
        <div className="flex items-center gap-4 border-b border-line p-6">
          <Icon aria-hidden="true" className="text-accent" />
          <div>
            <h2 className="font-semibold">{domain.question}</h2>
            <p className="mt-1 text-sm text-muted">
              Planned source: {domain.provider}
            </p>
          </div>
        </div>
        <EmptyState
          title="This data source is not connected yet"
          description={`The ${domain.title.toLowerCase()} workspace is ready for its future integration. Live indicators, comparisons, and historical analysis will appear here when available.`}
        />
      </Card>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline"
      >
        Back to overview
      </Link>
    </>
  )
}
