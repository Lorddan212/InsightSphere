import { Link } from 'react-router'
import { ArrowUpRight, Layers3, ChartNoAxesCombined } from 'lucide-react'
import { domains } from '../../../app/navigation'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { EmptyState } from '../../../components/ui/States'

export default function DashboardOverview() {
  return (
    <>
      <PageHeader
        title="The bigger picture."
        description="Your starting point for weather, currencies, economies, and digital markets."
        action={<Badge>Workspace preview</Badge>}
      />
      <section
        aria-labelledby="overview-heading"
        className="mb-8 overflow-hidden rounded-xl border border-line bg-panel"
      >
        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-accent">
              <Layers3 aria-hidden="true" size={18} />
              Connected perspectives
            </div>
            <h2
              id="overview-heading"
              className="max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Four domains.
              <br />
              Room for deeper understanding.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
              Explore a workspace designed to bring different signals together.
              Live insights will appear here as each data source is connected.
            </p>
            <Link
              to="/weather"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-panel"
            >
              Explore weather <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="flex flex-col justify-center border-t border-line bg-soft/40 p-6 md:border-l md:border-t-0 sm:p-8">
            <h3 className="mb-4 text-sm font-semibold">
              Workspace at a glance
            </h3>
            <dl className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <dt className="text-sm text-muted">Analytical domains</dt>
                <dd className="text-xl font-semibold">4</dd>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-4">
                <dt className="text-sm text-muted">Connected sources</dt>
                <dd className="text-xl font-semibold">0</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted">Data availability</dt>
                <dd className="text-sm font-medium">Coming soon</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      <section aria-labelledby="domains-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="domains-heading" className="text-lg font-semibold">
            Explore your domains
          </h2>
          <span className="text-xs text-muted">Built for context</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {domains.map(({ path, title, icon: Icon, question, provider }) => (
            <Card key={path} className="p-5">
              <div className="mb-6 flex items-center justify-between">
                <Icon aria-hidden="true" className="size-6 text-accent" />
                <span className="text-xs text-muted">Not connected</span>
              </div>
              <h3 className="text-lg font-semibold">
                <Link
                  to={path}
                  className="inline-flex items-center gap-2 hover:text-accent"
                >
                  {title}
                  <ArrowUpRight aria-hidden="true" size={16} />
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">{question}</p>
              <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
                Planned source: {provider}
              </p>
            </Card>
          ))}
        </div>
      </section>
      <section aria-labelledby="insights-heading" className="mt-8">
        <Card>
          <div className="flex items-center gap-3 border-b border-line px-6 py-5">
            <ChartNoAxesCombined
              aria-hidden="true"
              size={20}
              className="text-accent"
            />
            <h2 id="insights-heading" className="font-semibold">
              Cross-domain insights
            </h2>
          </div>
          <EmptyState
            title="Your insights will grow here"
            description="Once sources are connected, this space will bring together key indicators, trends, and the context behind them. No live data is available yet."
          />
        </Card>
      </section>
    </>
  )
}
