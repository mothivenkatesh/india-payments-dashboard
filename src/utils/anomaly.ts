/** Z-score of a value within a series (population std dev) */
export function zscore(series: number[], value: number): number {
  if (series.length < 4) return 0
  const mean = series.reduce((a, b) => a + b, 0) / series.length
  const variance = series.reduce((a, b) => a + (b - mean) ** 2, 0) / series.length
  const std = Math.sqrt(variance)
  if (std === 0) return 0
  return (value - mean) / std
}

/** Percentile rank of value within series (0–100). Excludes value itself. */
export function percentileRank(series: number[], value: number): number {
  if (series.length === 0) return 0
  const below = series.filter(v => v < value).length
  return Math.round((below / series.length) * 100)
}

/**
 * Count consecutive months in same direction at end of series.
 * Returns positive for consecutive increases, negative for consecutive decreases.
 */
export function consecutiveTrend(series: number[]): number {
  if (series.length < 2) return 0
  const dir = series[series.length - 1] > series[series.length - 2] ? 1 : -1
  let count = 1
  for (let i = series.length - 2; i > 0; i--) {
    const d = series[i] > series[i - 1] ? 1 : -1
    if (d === dir) count++
    else break
  }
  return count * dir
}
