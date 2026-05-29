/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import Icon from '../../components/Icon'
import AppLogo from '../../components/AppLogo'
import LineChart from '../../components/charts/LineChart'
import { useUPIAppData } from '../../hooks/useUpiData'
import { APP_COLORS, toMonthLabel } from '../../data/upiAppData'
import clsx from 'clsx'

const fmt = (v: number, u: 'vol' | 'val') =>
  u === 'vol'
    ? v >= 1000 ? `${(v / 1000).toFixed(2)}B` : `${v.toFixed(0)}M`
    : v >= 100000 ? `₹${(v / 100000).toFixed(2)}L Cr` : `₹${(v / 1000).toFixed(1)}K Cr`

function cagr(first: number, last: number, months: number) {
  if (!first || !last || months <= 0) return 0
  return ((Math.pow(last / first, 12 / months) - 1) * 100)
}

export default function UPIApps() {
  const app = useUPIAppData()
  const [selected, setSelected] = useState(app.latestRanked[0]?.app ?? 'PhonePe')

  const series = app.appSeries[selected] ?? []
  const nonZero = series.filter(d => d.volume > 0)
  const latest = nonZero[nonZero.length - 1]
  const prev = nonZero[nonZero.length - 2]
  const first = nonZero[0]

  const momVol = prev && prev.volume > 0 ? ((latest.volume - prev.volume) / prev.volume) * 100 : 0
  const yoyIdx = nonZero.length - 13
  const yoyRow = yoyIdx >= 0 ? nonZero[yoyIdx] : null
  const yoyVol = yoyRow && yoyRow.volume > 0 ? ((latest.volume - yoyRow.volume) / yoyRow.volume) * 100 : null
  const cagrVal = first && latest ? cagr(first.volume, latest.volume, nonZero.length - 1) : 0

  const color = APP_COLORS[selected] ?? '#3B82F6'

  // Monthly table (last 12)
  const table12 = nonZero.slice(-12).reverse()

  // Rank
  const rankRow = app.latestRanked.find(r => r.app === selected)

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">
      <div>
        <h1 class="text-xl font-semibold text-ink-gray-9">App Deep Dive</h1>
        <p class="text-xs text-ink-gray-6 mt-0.5">Full trend, growth metrics, and monthly table per app</p>
      </div>

      {/* App selector pills */}
      <div class="flex flex-wrap gap-2">
        {app.latestRanked.map(r => (
          <button key={r.app} onClick={() => setSelected(r.app)}
            class={clsx('flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-xs font-medium transition-all border',
              selected === r.app ? 'text-ink-gray-9' : 'text-ink-gray-7 border-outline-gray-2 hover:border-outline-gray-3')}
            style={selected === r.app ? { background: `${r.color}22`, borderColor: `${r.color}66`, color: r.color } : {}}>
            <AppLogo name={r.app} size={20} rounded="full" color={r.color} />
            #{r.rank} {r.app}
          </button>
        ))}
      </div>

      {/* Profile header */}
      <div class="glass-card p-5">
        <div class="flex items-center gap-4">
          <AppLogo name={selected} size={48} rounded="xl" color={color} />
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-semibold text-ink-gray-9">{selected}</h2>
            <p class="text-xs text-ink-gray-7">Latest: {latest?.label}</p>
          </div>
          {rankRow && (
            <div class="text-right shrink-0">
              <p class="text-3xl font-bold" style={{ color }}>#{rankRow.rank}</p>
              <p class="text-xs text-ink-gray-6">by volume</p>
            </div>
          )}
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Volume', value: fmt(latest?.volume ?? 0, 'vol'), sub: latest?.label },
            { label: 'Value',  value: fmt(latest?.value ?? 0, 'val'),  sub: latest?.label },
            { label: 'Vol Share', value: rankRow ? `${rankRow.volShare.toFixed(1)}%` : '—', sub: 'of total UPI' },
            { label: 'Val Share', value: rankRow ? `${rankRow.valShare.toFixed(1)}%` : '—', sub: 'of total UPI' },
          ].map(({ label, value, sub }) => (
            <div key={label} class="bg-surface-gray-1 rounded-lg p-3 border border-outline-gray-1">
              <p class="text-2xs text-ink-gray-6 tracking-wide mb-1">{label}</p>
              <p class="text-lg font-semibold text-ink-gray-9">{value}</p>
              <p class="text-2xs text-ink-gray-6 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth metrics */}
      <div class="grid grid-cols-3 gap-4">
        {[
          { label: 'MoM Growth', value: momVol, suffix: '%' },
          { label: 'YoY Growth', value: yoyVol, suffix: '%' },
          { label: 'CAGR', value: cagrVal, suffix: '%' },
        ].map(({ label, value, suffix }) => (
          <div key={label} class="glass-card p-4">
            <p class="text-2xs text-ink-gray-6 tracking-wide mb-2">{label}</p>
            {value !== null ? (
              <p class={clsx('text-2xl font-bold', value >= 0 ? 'stat-positive' : 'stat-negative')}>
                {value >= 0 ? '+' : ''}{value.toFixed(1)}{suffix}
              </p>
            ) : (
              <p class="text-2xl font-bold text-ink-gray-6">N/A</p>
            )}
          </div>
        ))}
      </div>

      {/* Volume + Value trend charts */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-4">Volume Trend (Mn txns)</h2>
          <LineChart
            labels={nonZero.map(d => d.label)}
            datasets={[{
              label: selected,
              data: nonZero.map(d => d.volume),
              borderColor: color,
              backgroundColor: `${color}15`,
              fill: true,
              tension: 0.3,
              pointRadius: 0,
            }]}
            height={180}
            tickFormat={v => v >= 1000 ? `${(v/1000).toFixed(0)}B` : `${v}M`}
          />
        </div>
        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-4">Value Trend (₹K Cr)</h2>
          <LineChart
            labels={nonZero.map(d => d.label)}
            datasets={[{
              label: selected,
              data: nonZero.map(d => +(d.value / 1000).toFixed(0)),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16,185,129,0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
            }]}
            height={180}
            tickFormat={v => `₹${v}K`}
          />
        </div>
      </div>

      {/* Monthly data table */}
      <div class="glass-card overflow-hidden">
        <div class="p-4 border-b border-outline-gray-2">
          <h2 class="text-sm font-medium text-ink-gray-9">Monthly Data — {selected}</h2>
        </div>
        <div class="overflow-x-auto" tabIndex={0}>
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-outline-gray-1">
                {['Month', 'Volume', 'Value', 'Vol MoM', 'Val MoM', 'Source'].map(h => (
                  <th key={h} class="text-left px-4 py-2.5 text-ink-gray-6 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table12.map((row, i) => {
                const prevRow = table12[i + 1]
                const vMoM = prevRow && prevRow.volume > 0 ? ((row.volume - prevRow.volume) / prevRow.volume) * 100 : null
                const valMoM = prevRow && prevRow.value > 0 ? ((row.value - prevRow.value) / prevRow.value) * 100 : null
                return (
                  <tr key={row.date} class="border-b border-outline-gray-1 hover:bg-surface-gray-1 transition-colors">
                    <td class="px-4 py-2.5 text-ink-gray-9 font-medium">{row.label}</td>
                    <td class="px-4 py-2.5 text-ink-gray-9 tabular-nums">{fmt(row.volume, 'vol')}</td>
                    <td class="px-4 py-2.5 text-ink-gray-9 tabular-nums">{fmt(row.value, 'val')}</td>
                    <td class={clsx('px-4 py-2.5 tabular-nums', vMoM === null ? 'text-ink-gray-5' : vMoM >= 0 ? 'stat-positive' : 'stat-negative')}>
                      {vMoM !== null ? `${vMoM >= 0 ? '+' : ''}${vMoM.toFixed(1)}%` : '—'}
                    </td>
                    <td class={clsx('px-4 py-2.5 tabular-nums', valMoM === null ? 'text-ink-gray-5' : valMoM >= 0 ? 'stat-positive' : 'stat-negative')}>
                      {valMoM !== null ? `${valMoM >= 0 ? '+' : ''}${valMoM.toFixed(1)}%` : '—'}
                    </td>
                    <td class="px-4 py-2.5">
                      <span class={clsx('pill', row.estimated ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'pill-green')}>
                        {row.estimated ? 'Est.' : 'NPCI'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
