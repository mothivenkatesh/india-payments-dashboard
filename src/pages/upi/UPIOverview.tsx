/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import KPICard from '../../components/KPICard'
import Icon from '../../components/Icon'
import BarChart from '../../components/charts/BarChart'
import DoughnutChart from '../../components/charts/DoughnutChart'
import LineChart from '../../components/charts/LineChart'
import SwatchDot from '../../components/SwatchDot'
import { useUPIAppData, useUPITimeSeries } from '../../hooks/useUpiData'
import { APP_COLORS } from '../../data/upiAppData'
import clsx from 'clsx'

const fmt = (v: number, u: 'vol' | 'val') =>
  u === 'vol'
    ? v >= 1000 ? `${(v / 1000).toFixed(1)}B` : `${v.toFixed(0)}M`
    : v >= 100000 ? `₹${(v / 100000).toFixed(2)}L Cr` : `₹${(v / 1000).toFixed(1)}K Cr`

export default function UPIOverview() {
  const [barMode, setBarMode] = useState<'vol' | 'val'>('vol')
  const { data: timeSeries } = useUPITimeSeries()
  const app = useUPIAppData()

  const top10 = app.latestRanked.slice(0, 10)
  const leader = app.latestRanked[0]

  // Trend: prefer live API, fall back to bundled
  const trend24 = (timeSeries && timeSeries.length > 0 ? timeSeries : app.monthlyTotals).slice(-24)
  const isLive = timeSeries && timeSeries.length > 0

  // Sparkline data (last 12 months) for KPI cards
  const spark12 = trend24.slice(-12)
  const sparkVol = spark12.map(d => d.volume)
  const sparkVal = spark12.map(d => d.value)

  // totalVal in Rs Cr (1 Cr = 1e7), totalVol in Mn (1 Mn = 1e6)
  // avg = (totalVal × 1e7) / (totalVol × 1e6) = totalVal / totalVol × 10
  const avgTxnVal = app.totalVol > 0
    ? Math.round((app.totalVal / app.totalVol) * 10)
    : 0

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-ink-gray-9">UPI Ecosystem</h1>
          <p class="text-xs text-ink-gray-6 mt-0.5">Latest: {app.latestLabel}</p>
        </div>
        <span class={clsx('pill flex items-center gap-1', isLive ? 'pill-green' : 'bg-surface-gray-2 text-ink-gray-6 border border-outline-gray-2')}>
          <Icon name={isLive ? 'circle' : 'clock'} size={10} />
          {isLive ? 'Live API' : 'Bundled data'}
        </span>
      </div>

      {/* KPIs */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Volume" value={fmt(app.totalVol, 'vol')} trend={app.momVol} sub="MoM" icon="repeat" accentClass="text-ink-blue-2" sparkData={sparkVol} sparkColor="var(--ink-blue-2)" />
        <KPICard label="Total Value"  value={fmt(app.totalVal, 'val')} trend={app.momVal} sub="MoM" icon="dollar-sign" accentClass="text-ink-green-2" sparkData={sparkVal} sparkColor="var(--ink-green-2)" />
        <KPICard label="Active Apps"  value={String(app.activeApps)} sub={app.latestLabel} icon="grid" accentClass="text-ink-gray-6" />
        <KPICard label="Avg Txn Value" value={`₹${avgTxnVal.toLocaleString('en-IN')}`} sub="per transaction" icon="file-text" accentClass="text-ink-amber-2" />
      </div>

      {/* Market Leader */}
      {leader && (
        <div class="glass-card p-5">
          <p class="text-2xs text-ink-gray-6 tracking-wide mb-3 flex items-center gap-1.5">
            <Icon name="award" size={13} className="text-ink-amber-2" /> Market Leader · {app.latestLabel}
          </p>
          <div class="flex items-center gap-5">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              /* one-ui-allow: leader badge tint from the app brand color */
              style={{ background: `${leader.color}22`, border: `1px solid ${leader.color}44` }}>
              <span class="text-lg font-bold" /* one-ui-allow: initial colored by app brand */ style={{ color: leader.color }}>{leader.app[0]}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-ink-gray-9 font-semibold truncate">{leader.app}</p>
              <p class="text-xs text-ink-gray-7 mt-0.5">{fmt(leader.volume, 'vol')} · {fmt(leader.value, 'val')}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-2xl font-bold" /* one-ui-allow: share colored by app brand */ style={{ color: leader.color }}>{leader.volShare.toFixed(1)}%</p>
              <p class="text-xs text-ink-gray-6">volume share</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-2xl font-bold text-ink-green-2">{leader.valShare.toFixed(1)}%</p>
              <p class="text-xs text-ink-gray-6">value share</p>
            </div>
          </div>
        </div>
      )}

      {/* Bar + Donut */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="glass-card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-medium text-ink-gray-9">Top Apps — {app.latestLabel}</h2>
            <div class="flex rounded-lg overflow-hidden border border-outline-gray-2 text-xs">
              {(['vol', 'val'] as const).map(m => (
                <button key={m} onClick={() => setBarMode(m)}
                  class={clsx('px-3 py-1 transition-colors', barMode === m ? 'bg-surface-blue-1 text-ink-blue-3' : 'text-ink-gray-7 hover:text-ink-gray-9')}>
                  {m === 'vol' ? 'Volume' : 'Value'}
                </button>
              ))}
            </div>
          </div>
          <BarChart
            labels={top10.map(r => r.app)}
            datasets={[{
              data: top10.map(r => barMode === 'vol' ? r.volume : r.value),
              backgroundColor: top10.map(r => `${r.color}cc`),
              borderColor: top10.map(r => r.color),
              borderWidth: 1,
              borderRadius: 4,
            }]}
            horizontal
            height={220}
            tickFormat={v => barMode === 'vol' ? `${(v/1000).toFixed(1)}B` : `₹${(v/100000).toFixed(1)}L`}
          />
        </div>

        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-4">Market Share (Volume)</h2>
          <DoughnutChart
            labels={top10.map(r => r.app)}
            data={top10.map(r => r.volume)}
            colors={top10.map(r => r.color)}
            height={175}
            tooltipFormat={v => fmt(v, 'vol')}
          />
          <div class="space-y-1.5 mt-3">
            {top10.slice(0, 5).map(r => (
              <div key={r.app} class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-1.5 text-ink-gray-8">
                  <SwatchDot color={r.color} square />
                  {r.app}
                </span>
                <span class="text-ink-gray-7 tabular-nums">{r.volShare.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend */}
      <div class="glass-card p-5">
        <div class="flex items-center gap-2 mb-1">
          <h2 class="text-sm font-medium text-ink-gray-9">Total UPI Trend (24 months)</h2>
          {isLive && <span class="pill-green text-2xs flex items-center gap-1"><Icon name="wifi" size={9} />Live</span>}
        </div>
        <p class="text-xs text-ink-gray-6 mb-4">Volume (Bn txns) &amp; Value (₹ Lakh Cr)</p>
        <LineChart
          labels={trend24.map(d => d.label)}
          datasets={[
            {
              label: 'Volume (Bn)',
              data: trend24.map(d => +(d.volume / 1000).toFixed(2)),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59,130,246,0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              yAxisID: 'y',
            },
            {
              label: 'Value (₹L Cr)',
              data: trend24.map(d => +(d.value / 100000).toFixed(2)),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16,185,129,0.06)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              yAxisID: 'y2',
            },
          ]}
          height={200}
          tickFormat={v => `${v}B`}
          y2TickFormat={v => `${v}L`}
        />
      </div>
    </div>
  )
}
