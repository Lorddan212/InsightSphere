import { useState } from 'react'
import { Link } from 'react-router'
import type { CryptoAsset } from '../types/crypto'
import { formatCompact, formatPrice, formatUpdated } from '../utils/crypto'
import { Change } from './CryptoMetrics'

export function CryptoMarketTable({
  assets,
  selectedId,
  onSelect,
}: {
  assets: CryptoAsset[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [filter, setFilter] = useState('')
  const rows = assets.filter((asset) =>
    `${asset.name} ${asset.symbol} ${asset.id}`
      .toLowerCase()
      .includes(filter.trim().toLowerCase()),
  )
  return (
    <section aria-labelledby="market-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="market-heading" className="text-lg font-semibold">
            Market leaders
          </h2>
          <p className="mt-1 text-sm text-muted">
            Up to 50 assets by market cap · USD · Select an asset to explore.
          </p>
        </div>
        <label className="text-sm">
          Filter these assets
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-panel px-3 sm:w-64"
          />
        </label>
      </div>
      <div
        className="overflow-x-auto rounded-xl border border-line bg-panel"
        role="region"
        aria-label="Scrollable market table"
        tabIndex={0}
      >
        <table className="w-full min-w-[740px] text-left text-sm tabular-nums">
          <caption className="sr-only">
            Cryptocurrency market rankings, prices and 24-hour activity in USD
          </caption>
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              {[
                'Rank',
                'Asset',
                'Price',
                '24h change',
                'Market cap',
                '24h volume',
              ].map((title) => (
                <th scope="col" key={title} className="px-4 py-4">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((asset) => (
              <tr
                key={asset.id}
                className={`border-b border-line last:border-0 ${selectedId === asset.id ? 'bg-soft' : ''}`}
              >
                <td className="px-4 py-4">{asset.rank ?? '—'}</td>
                <th scope="row" className="px-4 py-2 font-medium">
                  <Link
                    to={`/crypto/${asset.id}`}
                    onClick={() => onSelect(asset.id)}
                    aria-current={selectedId === asset.id ? 'true' : undefined}
                    className="flex min-h-11 items-center gap-3 text-accent"
                  >
                    {asset.image && (
                      <img
                        src={asset.image}
                        alt=""
                        width={28}
                        height={28}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                        className="size-7 shrink-0"
                      />
                    )}
                    <span className="max-w-52 break-words">
                      {asset.name}{' '}
                      <span className="ml-2 text-xs text-muted">
                        {asset.symbol}
                      </span>
                    </span>
                  </Link>
                  <span className="block text-xs font-normal text-muted">
                    {formatUpdated(asset.updatedAt)}
                  </span>
                </th>
                <td className="px-4 py-4">{formatPrice(asset.price)}</td>
                <td className="px-4 py-4">
                  <Change value={asset.change24h} />
                </td>
                <td className="px-4 py-4">{formatCompact(asset.marketCap)}</td>
                <td className="px-4 py-4">{formatCompact(asset.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-6 text-sm text-muted">
            {assets.length
              ? 'No assets match this filter.'
              : 'No market assets are available.'}
          </p>
        )}
      </div>
    </section>
  )
}
