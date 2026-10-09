import { Link, useParams } from 'react-router'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import {
  EmptyState,
  ErrorState,
  PageSkeleton,
} from '../../../components/ui/States'
import { coinIdSchema, periodSchema } from '../schemas/crypto.schemas'
import { useCryptoPreferences } from '../hooks/useCryptoPreferences'
import { useCryptoQueries } from '../hooks/useCryptoQueries'
import { GlobalMetrics, AssetMetrics } from './CryptoMetrics'
import { CryptoMarketTable } from './CryptoMarketTable'
import { CryptoChart } from './CryptoChart'

export default function CryptoPage() {
  const { coinId } = useParams()
  const { preferences, save } = useCryptoPreferences()
  const id = coinId ?? preferences.coinId
  const valid = coinIdSchema.safeParse(id).success
  const { global, markets, asset, history, selected, listed } =
    useCryptoQueries(id, preferences.period, valid)
  const fetching =
    global.isFetching ||
    markets.isFetching ||
    asset.isFetching ||
    history.isFetching
  const refresh = () => {
    void global.refetch()
    void markets.refetch()
    if (valid && !listed) void asset.refetch()
    if (selected && valid) void history.refetch()
  }
  const selectedError = listed ? null : asset.error
  return (
    <div className="space-y-7">
      <PageHeader
        title="Cryptocurrency Analytics"
        description="Understand market scale, daily activity, and historical prices. All monetary values are in USD."
        action={
          <Button onClick={refresh} disabled={fetching}>
            <RefreshCw aria-hidden="true" size={16} />
            {fetching ? 'Updating crypto…' : 'Refresh crypto'}
          </Button>
        }
      />
      <p className="text-sm text-muted">
        HTTP market snapshots, not streaming prices. Refresh may reuse recent
        cached data.
      </p>
      {global.isPending && <PageSkeleton />}
      {global.error && (
        <ErrorState
          headingLevel="h2"
          title="Global market could not refresh"
          description={`${global.error.message}${global.data ? ' Previously retrieved data is still shown.' : ''}`}
          onRetry={() => void global.refetch()}
        />
      )}
      {global.data && <GlobalMetrics data={global.data} />}
      <Card className="min-w-0 p-5 sm:p-6">
        {!valid ? (
          <ErrorState
            headingLevel="h2"
            title="Invalid asset ID"
            description="Use a CoinGecko asset ID or choose an asset from the market table."
          />
        ) : (
          <>
            {!selected && (markets.isPending || asset.isPending) && (
              <PageSkeleton />
            )}
            {selectedError && (
              <ErrorState
                headingLevel="h2"
                title="Asset could not refresh"
                description={`${selectedError.message}${selected ? ' Previously retrieved data is still shown.' : ''}`}
                onRetry={() => void asset.refetch()}
              />
            )}
            {selected && (
              <>
                <AssetMetrics asset={selected} />
                <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold">Asset price trend</h3>
                  <div
                    role="group"
                    aria-label="Crypto history period"
                    className="flex flex-wrap gap-2"
                  >
                    {periodSchema.options.map((period) => (
                      <Button
                        key={period}
                        aria-pressed={preferences.period === period}
                        onClick={() => save({ period, coinId: id })}
                        className={
                          preferences.period === period
                            ? 'bg-soft text-accent'
                            : ''
                        }
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
                {history.isPending && <PageSkeleton />}
                {history.error && (
                  <ErrorState
                    headingLevel="h2"
                    title="Price history could not refresh"
                    description={`${history.error.message}${history.data ? ' Previously retrieved observations are still shown.' : ''}`}
                    onRetry={() => void history.refetch()}
                  />
                )}
                {history.data &&
                  (history.data.some((point) => point.price !== null) ? (
                    <CryptoChart
                      points={history.data}
                      name={selected.name}
                      period={preferences.period}
                    />
                  ) : (
                    <EmptyState
                      title="No price observations"
                      description="CoinGecko has no usable prices for this asset and period. Try another period."
                    />
                  ))}
              </>
            )}
          </>
        )}
        {(coinId || !valid || (selectedError && id !== 'bitcoin')) && (
          <Link
            to="/crypto"
            onClick={() => save({ coinId: 'bitcoin' })}
            className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-accent"
          >
            Back to Bitcoin overview
          </Link>
        )}
      </Card>
      {markets.isPending && <PageSkeleton />}
      {markets.error && (
        <ErrorState
          headingLevel="h2"
          title="Market table could not refresh"
          description={`${markets.error.message}${markets.data ? ' Previously retrieved market data is still shown.' : ''}`}
          onRetry={() => void markets.refetch()}
        />
      )}
      {markets.data && (
        <CryptoMarketTable
          assets={markets.data}
          selectedId={id}
          onSelect={(coinId) => save({ coinId })}
        />
      )}
      <p className="text-xs leading-6 text-muted">
        Data provided by{' '}
        <a
          href="https://www.coingecko.com/en/api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          CoinGecko
        </a>
        . History is limited to the past 365 days on the Demo plan. This view
        describes market data and does not provide investment advice.
      </p>
    </div>
  )
}
