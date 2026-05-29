/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import Icon from '../../components/Icon'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import { useUPIAppData, useUPITimeSeries } from '../../hooks/useUpiData'
import { useCardsTimeSeries } from '../../hooks/useCardsData'
import { useMode } from '../../hooks/useMode'
import { APP_COLORS } from '../../data/upiAppData'
import clsx from 'clsx'

type Tab = 'upi' | 'cards' | 'cross'

const SELECTABLE = ['PhonePe', 'Google Pay', 'Paytm', 'Navi', 'CRED', 'BHIM', 'Amazon Pay', 'WhatsApp Pay']
const TOP_APPS = ['PhonePe', 'Google Pay', 'Paytm', 'Navi', 'Others']

export default function Growth() {
  const [tab, setTab] = useState<Tab>('upi')
  const [selected, setSelected] = useState(['PhonePe', 'Google Pay', 'Paytm'])
  const [mode, setMode] = useMode()

  const app = useUPIAppData()
  const { data: upiRaw } = useUPITimeSeries()
  const upiPoints = upiRaw ?? []
  const { monthly: cardMonthly, isLoading: cardsLoading } = useCardsTimeSeries()

  const last24keys = app.monthKeys.slice(-24)
  const last12keys = app.monthKeys.slice(-12)
  const cardTrend = cardMonthly.slice(-24)

  const toggle = (a: string) =>
    setSelected(s => s.includes(a) ? s.filter(x => x !== a) : s.length < 5 ? [...s, a] : s)

  // Cross-rail alignment
  const cardDateMap = new Map(cardMonthly.map(m => [m.date, m]))
  const aligned = upiPoints.filter(p => cardDateMap.has(p.date)).slice(-30)
  const cardsAligned = aligned.map(p => cardDateMap.get(p.date)!)
  const ratioSeries = aligned.map((p, i) => {
    const m = cardsAligned[i]
    return m && p.value > 0 ? +((m.dcPosVal / p.value) * 100).toFixed(2) : 0
  })

  const shortLabel = (key: string) => {
    const [y, m] = key.split('-')
    const months = ['J','F','M','A','M','J','J','A','S','O','N','D']
    return `${months[parseInt(m)-1]}'${y.slice(2)}`
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'upi',   label: 'UPI Growth',   icon: 'activity'       },
    { id: 'cards', label: 'Cards Growth',  icon: 'trending-up'    },
    { id: 'cross', label: 'Cross-Rail',    icon: 'shuffle'        },
  ]

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">
      <div>
        <h1 class="text-xl font-semibold text-ink-gray-9">Growth Signals</h1>
        <p class="text-xs text-ink-gray-6 mt-0.5">What is accelerating, what is slowing</p>
      </div>

      {/* Tab bar */}
      <div class="flex gap-1 bg-surface-gray-1 border border-outline-gray-2 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            class={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all',
              tab === id ? 'bg-surface-blue-1 text-ink-blue-3 border border-outline-blue-1' : 'text-ink-gray-7 hover:text-ink-gray-9'
            )}>
            <Icon name={icon} size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── UPI Growth Tab ─── */}
      {tab === 'upi' && (
        <div class="space-y-6">
          {/* App selector */}
          <div class="glass-card p-4">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs text-ink-gray-7">Compare apps (max 5)</p>
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
                      isOn ? 'text-ink-gray-9' : 'text-ink-gray-7 border-outline-gray-2 hover:border-outline-gray-3')}
                    style={isOn ? { background:`${color}22`, borderColor:`${color}66`, color } : {}}>
                    {isOn && <Icon name="check" size={11} />}
                    {a}
                  </button>
                )
              })}
            </div>
          </div>

          {/* App comparison line */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-4">
              {mode === 'vol' ? 'Volume (Mn txns)' : 'Value (₹K Cr)'} — 24 months
            </h2>
            <LineChart
              labels={last24keys.map(shortLabel)}
              datasets={selected.map(a => ({
                label: a,
                data: last24keys.map(key => {
                  const row = app.appSeries[a]?.find(r => r.date === key)
                  return row ? (mode === 'vol' ? row.volume : row.value / 1000) : 0
                }),
                borderColor: APP_COLORS[a] ?? '#6B7280',
                backgroundColor: 'transparent',
                tension: 0.3, pointRadius: 0, borderWidth: 2,
              }))}
              height={240}
              tickFormat={v => mode === 'vol' ? (v >= 1000 ? `${(v/1000).toFixed(0)}B` : `${v}M`) : `₹${v}K`}
            />
          </div>

          {/* MoM growth rate */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-1">MoM Growth Rate (%)</h2>
            <p class="text-xs text-ink-gray-6 mb-4">Month-over-month volume change per app</p>
            <LineChart
              labels={last24keys.slice(1).map(shortLabel)}
              datasets={selected.map(a => {
                const series = app.appSeries[a] ?? []
                return {
                  label: a,
                  data: last24keys.slice(1).map((key, i) => {
                    const prev = last24keys[i]
                    const curr = series.find(r => r.date === key)?.volume ?? 0
                    const prevV = series.find(r => r.date === prev)?.volume ?? 0
                    return prevV > 0 ? +((curr - prevV) / prevV * 100).toFixed(1) : 0
                  }),
                  borderColor: APP_COLORS[a] ?? '#6B7280',
                  backgroundColor: 'transparent',
                  tension: 0.3, pointRadius: 0, borderWidth: 1.5,
                }
              })}
              height={180}
              tickFormat={v => `${v}%`}
            />
          </div>

          {/* Market share stacked bar */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-1">Market Share Evolution</h2>
            <p class="text-xs text-ink-gray-6 mb-4">Volume share % — last 12 months</p>
            <BarChart
              labels={last12keys.map(k => {
                const [y,m] = k.split('-')
                return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]} ${y.slice(2)}`
              })}
              datasets={TOP_APPS.map(a => {
                const color = APP_COLORS[a] ?? '#6B7280'
                return {
                  label: a,
                  data: last12keys.map(key => {
                    const total = app.monthlyTotals.find(d => d.date === key)?.volume ?? 1
                    const vol = app.appSeries[a]?.find(r => r.date === key)?.volume ?? 0
                    return total > 0 ? +((vol / total) * 100).toFixed(1) : 0
                  }),
                  backgroundColor: `${color}cc`,
                  borderColor: color,
                  borderWidth: 0,
                }
              })}
              stacked height={220}
              tickFormat={v => `${v}%`}
            />
          </div>
        </div>
      )}

      {/* ─── Cards Growth Tab ─── */}
      {tab === 'cards' && (
        <div class="space-y-6">
          {cardsLoading ? (
            <div class="space-y-4">{[...Array(3)].map((_,i) => <div key={i} class="glass-card h-48 animate-pulse" />)}</div>
          ) : (
            <>
              {/* CC vs DC spend */}
              <div class="glass-card p-5">
                <h2 class="text-sm font-medium text-ink-gray-9 mb-1">CC vs DC Spend Trend (₹L Cr)</h2>
                <p class="text-xs text-ink-gray-6 mb-4">Credit and debit card total spend — 24 months</p>
                <LineChart
                  labels={cardTrend.map(d => d.label)}
                  datasets={[
                    { label:'Credit Card', data:cardTrend.map(d=>+(d.ccTotalSpend/100000).toFixed(2)), borderColor:'#3B82F6', fill:true, tension:0.3, pointRadius:0, borderWidth:2 },
                    { label:'Debit Card',  data:cardTrend.map(d=>+(d.dcTotalSpend/100000).toFixed(2)), borderColor:'#10B981', fill:false, tension:0.3, pointRadius:0, borderWidth:2 },
                  ]}
                  height={200}
                  tickFormat={v => `${v}L`}
                />
              </div>

              {/* Channel breakdown */}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="glass-card p-5">
                  <h2 class="text-sm font-medium text-ink-gray-9 mb-1">CC: PoS vs Online (₹K Cr)</h2>
                  <p class="text-xs text-ink-gray-6 mb-4">Credit card channel breakdown</p>
                  <LineChart
                    labels={cardTrend.map(d=>d.label)}
                    datasets={[
                      { label:'PoS', data:cardTrend.map(d=>+(d.ccPosVal/1000).toFixed(0)), borderColor:'#3B82F6', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
                      { label:'Online', data:cardTrend.map(d=>+(d.ccOnlineVal/1000).toFixed(0)), borderColor:'#8B5CF6', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
                      { label:'ATM', data:cardTrend.map(d=>+(d.ccAtmVal/1000).toFixed(0)), borderColor:'#0EA5E9', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
                    ]}
                    height={180} tickFormat={v=>`₹${v}K`}
                  />
                </div>
                <div class="glass-card p-5">
                  <h2 class="text-sm font-medium text-ink-gray-9 mb-1">DC: PoS vs Online (₹K Cr)</h2>
                  <p class="text-xs text-ink-gray-6 mb-4">Debit card channel breakdown — watch PoS decline</p>
                  <LineChart
                    labels={cardTrend.map(d=>d.label)}
                    datasets={[
                      { label:'PoS', data:cardTrend.map(d=>+(d.dcPosVal/1000).toFixed(0)), borderColor:'#10B981', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
                      { label:'Online', data:cardTrend.map(d=>+(d.dcOnlineVal/1000).toFixed(0)), borderColor:'#34D399', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
                    ]}
                    height={180} tickFormat={v=>`₹${v}K`}
                  />
                </div>
              </div>

              {/* MoM growth bar */}
              <div class="glass-card p-5">
                <h2 class="text-sm font-medium text-ink-gray-9 mb-1">MoM Spend Growth (%) — CC vs DC</h2>
                <p class="text-xs text-ink-gray-6 mb-4">Month-over-month change in total spend</p>
                <BarChart
                  labels={cardTrend.slice(1).map(d=>d.label)}
                  datasets={[
                    { label:'CC MoM %', data:cardTrend.slice(1).map(d=>+(d.momCC??0).toFixed(1)), backgroundColor:cardTrend.slice(1).map(d=>(d.momCC??0)>=0?'rgba(59,130,246,0.7)':'rgba(239,68,68,0.7)'), borderRadius:3 },
                    { label:'DC MoM %', data:cardTrend.slice(1).map(d=>+(d.momDC??0).toFixed(1)), backgroundColor:cardTrend.slice(1).map(d=>(d.momDC??0)>=0?'rgba(16,185,129,0.7)':'rgba(239,68,68,0.4)'), borderRadius:3 },
                  ]}
                  height={180} tickFormat={v=>`${v}%`}
                />
              </div>

              {/* Cards outstanding */}
              <div class="glass-card p-5">
                <h2 class="text-sm font-medium text-ink-gray-9 mb-1">Cards in Circulation (Cr)</h2>
                <p class="text-xs text-ink-gray-6 mb-4">Credit growing · Debit plateauing</p>
                <LineChart
                  labels={cardTrend.map(d=>d.label)}
                  datasets={[
                    { label:'Credit Cards', data:cardTrend.map(d=>+(d.creditCards/10000000).toFixed(2)), borderColor:'#3B82F6', fill:true, tension:0.3, pointRadius:0, backgroundColor:'rgba(59,130,246,0.08)' },
                    { label:'Debit Cards',  data:cardTrend.map(d=>+(d.debitCards/10000000).toFixed(2)),  borderColor:'#8B5CF6', fill:true, tension:0.3, pointRadius:0, backgroundColor:'rgba(139,92,246,0.06)' },
                  ]}
                  height={180} tickFormat={v=>`${v}Cr`}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Cross-Rail Tab ─── */}
      {tab === 'cross' && (
        <div class="space-y-6">
          <div class="glass-card p-4 border-l-2 border-amber-500/40">
            <p class="text-sm text-ink-gray-8 leading-relaxed">
              UPI and debit card POS spend are competing for the same merchant checkout moment.
              This view shows the structural shift — DC POS as a shrinking share of UPI value.
            </p>
          </div>

          {/* UPI vs DC POS dual axis */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-1">UPI Value vs DC POS Spend</h2>
            <p class="text-xs text-ink-gray-6 mb-4">Left: UPI (L Cr) · Right: DC POS (K Cr) · {aligned.length} months overlap</p>
            <LineChart
              labels={aligned.map(p => p.label)}
              datasets={[
                { label:'UPI Value', data:aligned.map(p=>+(p.value/100000).toFixed(2)), borderColor:'#3B82F6', fill:true, tension:0.35, pointRadius:0, borderWidth:2, yAxisID:'y' },
                { label:'DC POS Spend', data:cardsAligned.map(m=>+(m.dcPosVal/1000).toFixed(1)), borderColor:'#F59E0B', fill:false, tension:0.35, pointRadius:0, borderWidth:2, yAxisID:'y2' },
              ]}
              height={240}
              tickFormat={v=>`${v}L`}
              y2TickFormat={v=>`${v}K`}
            />
          </div>

          {/* Substitution ratio */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-1">DC POS as % of UPI Value</h2>
            <p class="text-xs text-ink-gray-6 mb-4">
              Falling = UPI winning at merchant checkout · Started: {ratioSeries[0]?.toFixed(1)}% → Now: {ratioSeries[ratioSeries.length-1]?.toFixed(1)}%
            </p>
            <LineChart
              labels={aligned.map(p=>p.label)}
              datasets={[{
                label:'DC POS / UPI Value (%)',
                data: ratioSeries,
                borderColor:'#F59E0B', fill:true, tension:0.3, pointRadius:0, borderWidth:2,
              }]}
              height={200} tickFormat={v=>`${v}%`}
            />
          </div>

          {/* Summary ratios */}
          {aligned.length > 0 && cardsAligned.length > 0 && (() => {
            const latestUPI = aligned[aligned.length-1]
            const latestCard = cardsAligned[cardsAligned.length-1]
            const totalCards = (latestCard?.ccTotalSpend ?? 0) + (latestCard?.dcTotalSpend ?? 0)
            return (
              <div class="grid grid-cols-3 gap-4">
                <div class="glass-card p-4 text-center">
                  <div class="text-2xl font-bold text-ink-blue-2">
                    {totalCards > 0 ? (latestUPI.value / totalCards).toFixed(0) : '—'}×
                  </div>
                  <div class="text-xs text-ink-gray-7 mt-1">UPI vs total card spend</div>
                </div>
                <div class="glass-card p-4 text-center">
                  <div class="text-2xl font-bold text-ink-amber-2">
                    {latestUPI.value > 0 ? ((latestCard.dcPosVal / latestUPI.value)*100).toFixed(1) + '%' : '—'}
                  </div>
                  <div class="text-xs text-ink-gray-7 mt-1">DC POS of UPI value today</div>
                </div>
                <div class="glass-card p-4 text-center">
                  <div class={clsx('text-2xl font-bold', (ratioSeries[ratioSeries.length-1]??0) < (ratioSeries[0]??0) ? 'text-ink-red-3' : 'text-ink-green-2')}>
                    {ratioSeries[0] > 0 ? (((ratioSeries[ratioSeries.length-1]-ratioSeries[0])/ratioSeries[0])*100).toFixed(0) + '%' : '—'}
                  </div>
                  <div class="text-xs text-ink-gray-7 mt-1">DC POS share change</div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
