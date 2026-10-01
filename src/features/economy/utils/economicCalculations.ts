import type {
  EconomicIndicator,
  EconomicObservation,
  EconomicRange,
  EconomicSeries,
} from '../types/economy.types'

export function calculateEconomicMetrics(
  observations: EconomicObservation[],
  indicator: EconomicIndicator,
) {
  const valid = observations
    .filter(
      (point): point is EconomicObservation & { value: number } =>
        point.value !== null && Number.isFinite(point.value),
    )
    .sort((a, b) => a.year - b.year)
  const first = valid[0] ?? null
  const last = valid.at(-1) ?? null
  const difference =
    valid.length > 1 && first && last ? last.value - first.value : null
  const rawChange =
    difference === null
      ? null
      : indicator.change === 'relative'
        ? first && first.value > 0
          ? (difference / first.value) * 100
          : null
        : difference
  return {
    first,
    last,
    count: valid.length,
    difference:
      difference !== null && Number.isFinite(difference) ? difference : null,
    change: rawChange !== null && Number.isFinite(rawChange) ? rawChange : null,
    high: valid.length ? Math.max(...valid.map((point) => point.value)) : null,
    low: valid.length ? Math.min(...valid.map((point) => point.value)) : null,
  }
}

// Null markers break chart lines across omitted years; no values are imputed.
export function economicChartPoints(
  observations: EconomicObservation[],
  range: EconomicRange,
): EconomicObservation[] {
  const byYear = new Map(observations.map((point) => [point.year, point.value]))
  return Array.from(
    { length: Math.max(0, range.to - range.from + 1) },
    (_, index) => ({
      year: range.from + index,
      value: byYear.get(range.from + index) ?? null,
    }),
  )
}
export function latestComparableYear(series: EconomicSeries[]): number | null {
  if (series.length < 2) return null
  const yearSets = series.map(
    (item) =>
      new Set(
        item.observations
          .filter((point) => point.value !== null)
          .map((point) => point.year),
      ),
  )
  const common = [...yearSets[0]].filter((year) =>
    yearSets.every((years) => years.has(year)),
  )
  return common.length ? Math.max(...common) : null
}
