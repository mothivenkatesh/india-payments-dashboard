/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import Icon from '../../components/Icon'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import { useUPIAppData } from '../../hooks/useUpiData'
import { APP_COLORS } from '../../data/upiAppData'
import clsx from 'clsx'

const SELECTABLE = ['PhonePe', 'Google Pay', 'Paytm', 'Navi', 'CRED', 'BHIM', 'Amazon Pay', 'WhatsApp Pay']

export default function UPITrends() {
  const [selected, setSelected] = useState(['PhonePe', 'Google Pay', 'Paytm'])
  const [mode, setMode] = useState<'vol' | 'val'>('vol')
  const app = useUPIAppData()

  const last24 = app.monthKeys.slice(-24)

  const toggle = (a: string) => {
    setSelected(s =>
      s.includes(a) ? s.filter(x => x !== a) : s.length < 5 ? [...s, a] : s
    )
  }

  // Market share evolution data (stacked bar, last 12 months)
  const last12 = app.monthKeys.slice(-12)
  const topApps = ['PhonePe', 'Google Pay', 'Paytm', 'Navi', 'Others']

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">
      <div>
        <h1 class="view-h1 text-ink-gray-9">UPI Trends Explorer</h1>
        <p class="text-xs text-ink-gray-6 mt-0.5">Compare up to 5 apps over time</p>
      </div>

      {/* App selector */}
      <div class="glass-card p-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-ink-gray-7">Select apps to compare (max 5)</p>
          <div class="flex rounded-lg overflow-hidden border border-outline-gray-2 text-xs">
            {(['vol', 'val'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                class={clsx('px-3 py-1 transition-colors', mode === m ? 'bg-surface-blue-1 text-ink-blue-3' : 'text-ink-gray-7 hover:text-ink-gray-9')}>
                {m === 'vol' ? 'Volume' : 'Value'}
              </button>
            ))}
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          {SELECTABLE.map(a => {
            const isOn = selected.includes(a)
            const color = APP_COLORS[a] ?? '#6B7280'
            return (
              <button key={a} onClick={() => toggle(a)}
                class={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  isOn ? 'text-ink-gray-9' : 'text-ink-gray-7 border-outline-gray-2 hover:border-outline-gray-3 bg-transparent')}
                /* one-ui-allow: per-app brand tint computed from the data color */
                style={isOn ? { background: `${color}22`, borderColor: `${color}66`, color } : {}}>
                {isOn && <Icon name="check" size={11} />}
                {a}
              </button>
            )
          })}
        </div>
      </div>

      {/* Line chart: selected apps */}
      <div class="glass-card p-5">
        <h2 class="text-sm font-medium text-ink-gray-9 mb-4">
          {mode === 'vol' ? 'Transaction Volume (Mn)' : 'Transaction Value (₹ Cr)'} — Last 24 months
        </h2>
        <LineChart
          labels={last24.map(k => {
            const [y, m] = k.split('-')
            const months = ['J','F','M','A','M','J','J','A','S','O','N','D']
            return `${months[parseInt(m)-1]}'${y.slice(2)}`
          })}
          datasets={selected.map(a => ({
            label: a,
            data: last24.map(key => {
              const [year, month] = key.split('-').map(Number)
              const row = app.appSeries[a]?.find(r => r.date === key)
              return row ? (mode === 'vol' ? row.volume : row.value / 1000) : 0
            }),
            borderColor: APP_COLORS[a] ?? '#6B7280',
            backgroundColor: 'transparent',
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          }))}
          height={240}
          tickFormat={v => mode === 'vol' ? `${v >= 1000 ? `${(v/1000).toFixed(0)}B` : `${v}M`}` : `₹${v}K`}
        />
      </div>

      {/* MoM growth rate */}
      <div class="glass-card p-5">
        <h2 class="text-sm font-medium text-ink-gray-9 mb-1">MoM Growth Rate (%)</h2>
        <p class="text-xs text-ink-gray-6 mb-4">Month-over-month volume change per app</p>
        <LineChart
          labels={last24.slice(1).map(k => {
            const [y, m] = k.split('-')
            const months = ['J','F','M','A','M','J','J','A','S','O','N','D']
            return `${months[parseInt(m)-1]}'${y.slice(2)}`
          })}
          datasets={selected.map(a => {
            const series = app.appSeries[a] ?? []
            const growth = last24.slice(1).map((key, i) => {
              const prevKey = last24[i]
              const curr = series.find(r => r.date === key)?.volume ?? 0
              const prev = series.find(r => r.date === prevKey)?.volume ?? 0
              return prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : 0
            })
            return {
              label: a,
              data: growth,
              borderColor: APP_COLORS[a] ?? '#6B7280',
              backgroundColor: 'transparent',
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 1.5,
            }
          })}
          height={180}
          tickFormat={v => `${v}%`}
        />
      </div>

      {/* Market share evolution (stacked bar) */}
      <div class="glass-card p-5">
        <h2 class="text-sm font-medium text-ink-gray-9 mb-1">Market Share Evolution</h2>
        <p class="text-xs text-ink-gray-6 mb-4">Volume share % by app — last 12 months</p>
        <BarChart
          labels={last12.map(k => {
            const [y, m] = k.split('-')
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            return `${months[parseInt(m)-1]} ${y.slice(2)}`
          })}
          datasets={topApps.map(a => {
            const color = APP_COLORS[a] ?? '#6B7280'
            return {
              label: a,
              data: last12.map(key => {
                const [year, month] = key.split('-').map(Number)
                const rows = app.monthlyTotals.find(d => d.date === key)
                const total = rows?.volume ?? 1
                const row = app.appSeries[a]?.find(r => r.date === key)
                const vol = row?.volume ?? 0
                return total > 0 ? +((vol / total) * 100).toFixed(1) : 0
              }),
              backgroundColor: `${color}cc`,
              borderColor: color,
              borderWidth: 0,
            }
          })}
          stacked
          height={220}
          tickFormat={v => `${v}%`}
        />
      </div>
    </div>
  )
}
