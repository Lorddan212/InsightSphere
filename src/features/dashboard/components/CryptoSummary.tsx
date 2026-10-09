import { useCryptoPreferences } from '../../crypto/hooks/useCryptoPreferences'
import { useCryptoSnapshot } from '../../crypto/hooks/useCryptoSnapshot'
import {
  formatPrice,
  formatCompact,
  formatChange,
  formatUpdated,
} from '../../crypto/utils/crypto'
import { SummaryCard, SummaryValue } from './SummaryCard'

export function CryptoSummary() {
  const { preferences } = useCryptoPreferences()
  const { asset, global } = useCryptoSnapshot(preferences.coinId)
  const quote = asset.data
  const market = global.data
  return (
    <SummaryCard
      id="crypto-summary"
      title="Crypto"
      context={
        quote
          ? `${quote.name} · ${quote.symbol} / USD`
          : `${preferences.coinId} / USD`
      }
      source="CoinGecko"
      href={`/crypto/${preferences.coinId}`}
      loading={asset.isPending && global.isPending}
      refreshing={asset.isFetching || global.isFetching}
      error={asset.error ?? global.error}
      hasData={!!quote || !!market}
      onRefresh={() => {
        void asset.refetch()
        void global.refetch()
      }}
    >
      <SummaryValue
        label="Selected asset price · USD"
        value={formatPrice(quote?.price ?? null)}
      />
      <p className="text-sm text-muted">
        24-hour change: {formatChange(quote?.change24h ?? null)}
      </p>
      <p className="text-xs text-muted">
        Asset: {formatUpdated(quote?.updatedAt ?? null)}
      </p>
      <dl className="grid grid-cols-2 gap-4 rounded-lg bg-soft/50 p-4 text-sm">
        <div>
          <dt className="text-muted">Global market cap</dt>
          <dd className="mt-1 font-semibold">
            {formatCompact(market?.marketCap ?? null)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Global 24h volume</dt>
          <dd className="mt-1 font-semibold">
            {formatCompact(market?.volume ?? null)}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted">
        Global market: {formatUpdated(market?.updatedAt ?? null)}
      </p>
      <p className="text-xs text-muted">
        Prices can move between updates.{' '}
        <a href="https://www.coingecko.com/" className="underline">
          Data provided by CoinGecko
        </a>
        .
      </p>
    </SummaryCard>
  )
}
