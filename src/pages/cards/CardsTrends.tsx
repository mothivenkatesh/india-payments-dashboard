/** @jsxImportSource preact */
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import ErrorState from '../../components/ErrorState'
import { useCardsTimeSeries } from '../../hooks/useCardsData'

export default function CardsTrends() {
  const { monthly, isLoading, error, refetch } = useCardsTimeSeries()

  if (error) return <ErrorState message={error.message} onRetry={refetch} />
  if (isLoading) return (
    <div class="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} class="glass-card h-64 animate-pulse" />)}
    </div>
  )

  const trend = monthly.slice(-24)

  return (
    <div class="space-y-6 max-w-7xl">
      <div>
        <h1 class="text-xl font-semibold text-ink-gray-9">Cards Trends Explorer</h1>
        <p class="text-xs text-ink-gray-6 mt-0.5">Credit &amp; debit card dynamics over time · 85 banks aggregated</p>
      </div>

      {/* Total spend trend */}
      <div class="glass-card p-5">
        <h2 class="text-sm font-medium text-ink-gray-9 mb-1">Total Card Spend (₹L Cr)</h2>
        <p class="text-xs text-ink-gray-6 mb-4">Credit + Debit combined, last 24 months</p>
        <LineChart
          labels={trend.map(d => d.label)}
          datasets={[{
            label: 'Total Spend',
            data: trend.map(d => +(d.totalSpend / 100000).toFixed(2)),
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245,158,11,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
          }]}
          height={180}
          tickFormat={v => `${v}L`}
        />
      </div>

      {/* PoS vs Online trend: CC */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-1">CC: PoS vs Online (₹K Cr)</h2>
          <p class="text-xs text-ink-gray-6 mb-4">Credit card channel breakdown</p>
          <LineChart
            labels={trend.map(d => d.label)}
            datasets={[
              {
                label: 'PoS',
                data: trend.map(d => +(d.ccPosVal / 1000).toFixed(0)),
                borderColor: '#3B82F6',
                tension: 0.3,
                pointRadius: 0,
                backgroundColor: 'transparent',
              },
              {
                label: 'Online',
                data: trend.map(d => +(d.ccOnlineVal / 1000).toFixed(0)),
                borderColor: '#8B5CF6',
                tension: 0.3,
                pointRadius: 0,
                backgroundColor: 'transparent',
              },
              {
                label: 'ATM',
                data: trend.map(d => +(d.ccAtmVal / 1000).toFixed(0)),
                borderColor: '#0EA5E9',
                tension: 0.3,
                pointRadius: 0,
                backgroundColor: 'transparent',
                borderDash: [4, 4],
              },
            ]}
            height={180}
            tickFormat={v => `₹${v}K`}
          />
        </div>

        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-1">DC: PoS vs Online (₹K Cr)</h2>
          <p class="text-xs text-ink-gray-6 mb-4">Debit card channel breakdown</p>
          <LineChart
            labels={trend.map(d => d.label)}
            datasets={[
              {
                label: 'PoS',
                data: trend.map(d => +(d.dcPosVal / 1000).toFixed(0)),
                borderColor: '#10B981',
                tension: 0.3,
                pointRadius: 0,
                backgroundColor: 'transparent',
              },
              {
                label: 'Online',
                data: trend.map(d => +(d.dcOnlineVal / 1000).toFixed(0)),
                borderColor: '#34D399',
                tension: 0.3,
                pointRadius: 0,
                backgroundColor: 'transparent',
              },
            ]}
            height={180}
            tickFormat={v => `₹${v}K`}
          />
        </div>
      </div>

      {/* MoM growth bar chart */}
      <div class="glass-card p-5">
        <h2 class="text-sm font-medium text-ink-gray-9 mb-1">MoM Growth (%)</h2>
        <p class="text-xs text-ink-gray-6 mb-4">Month-over-month spend change — CC vs DC</p>
        <BarChart
          labels={trend.slice(1).map(d => d.label)}
          datasets={[
            {
              label: 'CC MoM %',
              data: trend.slice(1).map(d => +(d.momCC ?? 0).toFixed(1)),
              backgroundColor: trend.slice(1).map(d => (d.momCC ?? 0) >= 0 ? 'rgba(59,130,246,0.7)' : 'rgba(239,68,68,0.7)'),
              borderRadius: 3,
            },
            {
              label: 'DC MoM %',
              data: trend.slice(1).map(d => +(d.momDC ?? 0).toFixed(1)),
              backgroundColor: trend.slice(1).map(d => (d.momDC ?? 0) >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.4)'),
              borderRadius: 3,
            },
          ]}
          height={180}
          tickFormat={v => `${v}%`}
        />
      </div>

      {/* Cards outstanding trend */}
      <div class="glass-card p-5">
        <h2 class="text-sm font-medium text-ink-gray-9 mb-1">Cards Outstanding Trend</h2>
        <p class="text-xs text-ink-gray-6 mb-4">Credit &amp; debit cards in circulation (Cr)</p>
        <LineChart
          labels={trend.map(d => d.label)}
          datasets={[
            {
              label: 'Credit Cards',
              data: trend.map(d => +(d.creditCards / 10000000).toFixed(2)),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59,130,246,0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
            },
            {
              label: 'Debit Cards',
              data: trend.map(d => +(d.debitCards / 10000000).toFixed(2)),
              borderColor: '#8B5CF6',
              backgroundColor: 'rgba(139,92,246,0.06)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
            },
          ]}
          height={180}
          tickFormat={v => `${v}Cr`}
        />
      </div>
    </div>
  )
}
