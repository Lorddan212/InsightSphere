import { Card } from '../../../components/ui/Card'
import type { CryptoAsset, GlobalCryptoMarket } from '../types/crypto'
import {
  formatChange,
  formatCompact,
  formatPrice,
  formatUpdated,
} from '../utils/crypto'

export function Change({ value }: { value: number | null }) {
  return (
    <span
      className={
        value === null || value === 0
          ? 'text-muted'
          : value > 0
            ? 'text-success'
            : 'text-danger'
      }
    >
      {formatChange(value)}
    </span>
  )
}
export function GlobalMetrics({ data }: { data: GlobalCryptoMarket }) {
  return (
    <section aria-label="Global cryptocurrency market" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Global market cap', formatCompact(data.marketCap)],
          ['Global 24h volume', formatCompact(data.volume)],
          [
            'Bitcoin dominance',
            data.bitcoinDominance === null
              ? 'Unavailable'
              : `${data.bitcoinDominance.toFixed(2)}%`,
          ],
          [
            'Ethereum dominance',
            data.ethereumDominance === null
              ? 'Unavailable'
              : `${data.ethereumDominance.toFixed(2)}%`,
          ],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted">
        Global snapshot · {formatUpdated(data.updatedAt)}
      </p>
    </section>
  )
}
export function AssetMetrics({ asset }: { asset: CryptoAsset }) {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="break-words text-2xl font-semibold">
            {asset.name}{' '}
            <span className="text-sm text-muted">{asset.symbol}</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Market rank: {asset.rank ?? 'Unavailable'} · CoinGecko ID:{' '}
            {asset.id}
          </p>
        </div>
        <p className="text-xs text-muted">{formatUpdated(asset.updatedAt)}</p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-sm text-muted">Current price (USD)</dt>
          <dd className="mt-2 break-words text-2xl font-semibold tabular-nums">
            {formatPrice(asset.price)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">24h change</dt>
          <dd className="mt-2 text-2xl font-semibold tabular-nums">
            <Change value={asset.change24h} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Market cap</dt>
          <dd className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCompact(asset.marketCap)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">24h volume</dt>
          <dd className="mt-2 text-2xl font-semibold tabular-nums">
            {formatCompact(asset.volume)}
          </dd>
        </div>
      </dl>
      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-muted">24h high</dt>
          <dd>{formatPrice(asset.high)}</dd>
        </div>
        <div>
          <dt className="text-muted">24h low</dt>
          <dd>{formatPrice(asset.low)}</dd>
        </div>
        <div>
          <dt className="text-muted">Circulating supply</dt>
          <dd>
            {formatCompact(asset.supply, false)}{' '}
            {asset.supply !== null && asset.symbol}
          </dd>
        </div>
      </dl>
      {[
        asset.price,
        asset.marketCap,
        asset.volume,
        asset.change24h,
        asset.high,
        asset.low,
        asset.supply,
      ].includes(null) && (
        <p className="mt-4 text-sm text-muted">
          Some provider metrics are unavailable. Missing values are not zero.
        </p>
      )}
    </>
  )
}
