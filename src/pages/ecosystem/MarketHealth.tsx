/** @jsxImportSource preact */
import Icon from '../../components/Icon'
import AppLogo from '../../components/AppLogo'
import { useMode } from '../../hooks/useMode'
import FreshnessPill from '../../components/FreshnessPill'
import BarChart from '../../components/charts/BarChart'
import DoughnutChart from '../../components/charts/DoughnutChart'
import LineChart from '../../components/charts/LineChart'
import { useUPIAppData, useUPITimeSeries } from '../../hooks/useUpiData'
import { useCardsTimeSeries, useCardsBankLatest } from '../../hooks/useCardsData'
import { APP_COLORS } from '../../data/upiAppData'
import clsx from 'clsx'

const fmtVol = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}B` : `${v.toFixed(0)}M`
const fmtVal = (v: number) => v >= 100000 ? `₹${(v/100000).toFixed(2)}L Cr` : `₹${(v/1000).toFixed(1)}K Cr`
const fmtCard = (v: number) => v >= 100000 ? `₹${(v/100000).toFixed(2)}L Cr` : v >= 1000 ? `₹${(v/1000).toFixed(1)}K Cr` : `₹${v.toFixed(0)} Cr`
const fmtCount = (v: number) => v >= 10000000 ? `${(v/10000000).toFixed(2)}Cr` : v >= 100000 ? `${(v/100000).toFixed(1)}L` : v.toLocaleString('en-IN')

function lagDays(d: string) {
  const [y,m] = d.split('-').map(Number)
  return Math.round((Date.now() - new Date(y, m, 0).getTime()) / 86400000)
}

const CARD_COLORS = { CC_POS:'#3B82F6', CC_ONLINE:'#8B5CF6', CC_ATM:'#0EA5E9', DC_POS:'#10B981', DC_ONLINE:'#34D399', DC_ATM:'#6EE7B7' }

export default function MarketHealth() {
  const [barMode, setBarMode] = useMode()
  const app = useUPIAppData()
  const { data: timeSeries } = useUPITimeSeries()
  const { monthly: cardMonthly, latest: cardLatest, isLoading: cardsLoading } = useCardsTimeSeries()
  const { banks } = useCardsBankLatest()

  const trend24 = (timeSeries && timeSeries.length > 0 ? timeSeries : app.monthlyTotals).slice(-24)
  const top5 = app.latestRanked.slice(0, 5)
  const top5Banks = banks.slice(0, 5)
  const leader = app.latestRanked[0]
  const prevMonth = app.monthlyTotals[app.monthlyTotals.length - 2]

  const momCC = cardLatest && cardMonthly.length > 1
    ? ((cardLatest.ccTotalSpend - (cardMonthly[cardMonthly.length-2]?.ccTotalSpend ?? 0)) / (cardMonthly[cardMonthly.length-2]?.ccTotalSpend ?? 1)) * 100 : undefined
  const momDC = cardLatest && cardMonthly.length > 1
    ? ((cardLatest.dcTotalSpend - (cardMonthly[cardMonthly.length-2]?.dcTotalSpend ?? 0)) / (cardMonthly[cardMonthly.length-2]?.dcTotalSpend ?? 1)) * 100 : undefined

  const avgTxnVal = app.totalVol > 0 ? Math.round((app.totalVal / app.totalVol) * 10) : 0
  const freshDate = app.latestLabel
  const lag = trend24.length > 0 ? lagDays(trend24[trend24.length-1].date ?? '2025-01') : undefined

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-ink-gray-9">Market Health</h1>
          <p class="text-xs text-ink-gray-6 mt-0.5">State of Indian digital payments — UPI + Cards, one view</p>
        </div>
        <FreshnessPill dataDate={freshDate} lagDays={lag} />
      </div>

      {/* KPI ribbon — UPI + Cards */}
      <div class="space-y-2">
        {/* UPI strip */}
        <div class="flex items-center gap-2 px-1">
          <span class="text-2xs font-semibold text-ink-blue-2 uppercase tracking-widest w-8">UPI</span>
          <div class="flex-1 h-px bg-surface-blue-1" />
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:'Total Volume', value: fmtVol(app.totalVol), delta: app.momVol, icon:'repeat', color:'text-ink-blue-2' },
            { label:'Total Value',  value: fmtVal(app.totalVal), delta: app.momVal, icon:'dollar-sign', color:'text-ink-green-2' },
            { label:'Avg Txn Size', value:`₹${avgTxnVal.toLocaleString('en-IN')}`, icon:'file-text', color:'text-sky-400' },
            { label:'Active Apps',  value: String(app.activeApps), icon:'grid', color:'text-ink-gray-6' },
          ].map(({ label, value, delta, icon, color }) => (
            <div key={label} class="glass-card p-4 flex items-center gap-3">
              <span class={clsx('p-1.5 rounded-lg bg-surface-gray-1 shrink-0', color)}>
                <Icon name={icon} size={15} />
              </span>
              <div class="min-w-0">
                <p class="text-2xs text-ink-gray-6 uppercase tracking-wider truncate">{label}</p>
                <p class="text-base font-semibold text-ink-gray-9 leading-tight">{value}</p>
                {delta !== undefined && (
                  <span class={clsx('text-2xs font-medium', delta >= 0 ? 'stat-positive' : 'stat-negative')}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% MoM
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cards strip */}
        <div class="flex items-center gap-2 px-1 mt-2">
          <span class="text-2xs font-semibold text-ink-gray-6 uppercase tracking-widest w-12">Cards</span>
          <div class="flex-1 h-px bg-surface-gray-2" />
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:'CC Outstanding', value: cardLatest ? fmtCount(cardLatest.creditCards) : '—', icon:'credit-card', color:'text-ink-blue-2' },
            { label:'DC Outstanding', value: cardLatest ? fmtCount(cardLatest.debitCards) : '—', icon:'credit-card', color:'text-ink-gray-6' },
            { label:'CC Spend', value: cardLatest ? fmtCard(cardLatest.ccTotalSpend) : '—', delta: momCC, icon:'credit-card', color:'text-ink-green-2' },
            { label:'DC Spend', value: cardLatest ? fmtCard(cardLatest.dcTotalSpend) : '—', delta: momDC, icon:'shopping-bag', color:'text-ink-amber-2' },
          ].map(({ label, value, delta, icon, color }) => (
            <div key={label} class="glass-card p-4 flex items-center gap-3">
              <span class={clsx('p-1.5 rounded-lg bg-surface-gray-1 shrink-0', color)}>
                <Icon name={icon} size={15} />
              </span>
              <div class="min-w-0">
                <p class="text-2xs text-ink-gray-6 uppercase tracking-wider truncate">{label}</p>
                <p class="text-base font-semibold text-ink-gray-9 leading-tight">{value}</p>
                {delta !== undefined && (
                  <span class={clsx('text-2xs font-medium', delta >= 0 ? 'stat-positive' : 'stat-negative')}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% MoM
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market leader + UPI bar + market share donut */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leader + top 5 apps */}
        <div class="glass-card p-5 lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-ink-gray-9">UPI App Race — {app.latestLabel}</h2>
            <div class="flex rounded-lg overflow-hidden border border-outline-gray-2 text-xs">
              {(['vol','val'] as const).map(m => (
                <button key={m} onClick={() => setBarMode(m)}
                  class={clsx('px-3 py-1 transition-colors', barMode === m ? 'bg-surface-blue-1 text-ink-blue-3' : 'text-ink-gray-7 hover:text-ink-gray-9')}>
                  {m === 'vol' ? 'Volume' : 'Value'}
                </button>
              ))}
            </div>
          </div>
          {leader && (
            <div class="flex items-center gap-3 p-3 rounded-xl bg-surface-gray-1 border border-outline-gray-1">
              <AppLogo name={leader.app} size={32} rounded="lg" color={leader.color} />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-ink-gray-9 truncate">{leader.app}</p>
                <p class="text-2xs text-ink-gray-7">{fmtVol(leader.volume)} txns · {fmtVal(leader.value)}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-lg font-bold" style={{ color:leader.color }}>{leader.volShare.toFixed(1)}%</p>
                <p class="text-2xs text-ink-gray-6">vol share</p>
              </div>
            </div>
          )}
          <BarChart
            labels={app.latestRanked.slice(0,8).map(r => r.app)}
            datasets={[{
              data: app.latestRanked.slice(0,8).map(r => barMode==='vol' ? r.volume : r.value),
              backgroundColor: app.latestRanked.slice(0,8).map(r => `${r.color}cc`),
              borderColor: app.latestRanked.slice(0,8).map(r => r.color),
              borderWidth:1, borderRadius:4,
            }]}
            horizontal height={200}
            tickFormat={v => barMode==='vol' ? `${(v/1000).toFixed(1)}B` : `₹${(v/100000).toFixed(1)}L`}
          />
        </div>

        {/* Market share donut */}
        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-3">Market Share</h2>
          <DoughnutChart
            labels={top5.map(r=>r.app)}
            data={top5.map(r=>r.volume)}
            colors={top5.map(r=>r.color)}
            height={160}
            tooltipFormat={v => fmtVol(v)}
          />
          <div class="space-y-2 mt-3">
            {top5.map(r => (
              <div key={r.app} class="flex items-center justify-between text-xs">
                <span class="flex items-center gap-1.5 text-ink-gray-8">
                  <span class="w-2 h-2 rounded-sm shrink-0" style={{ background:r.color }} />
                  {r.app}
                </span>
                <span class="text-ink-gray-7 tabular-nums">{r.volShare.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards channel mix + top banks */}
      {cardLatest && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-3">CC Channel Mix</h2>
            <DoughnutChart
              labels={['PoS','Online','ATM']}
              data={[cardLatest.ccPosVal, cardLatest.ccOnlineVal, cardLatest.ccAtmVal]}
              colors={[CARD_COLORS.CC_POS, CARD_COLORS.CC_ONLINE, CARD_COLORS.CC_ATM]}
              height={130} tooltipFormat={fmtCard}
            />
            <div class="space-y-1.5 mt-3">
              {[{l:'PoS',v:cardLatest.ccPosVal,c:CARD_COLORS.CC_POS},{l:'Online',v:cardLatest.ccOnlineVal,c:CARD_COLORS.CC_ONLINE},{l:'ATM',v:cardLatest.ccAtmVal,c:CARD_COLORS.CC_ATM}].map(({l,v,c}) => {
                const total = cardLatest.ccPosVal+cardLatest.ccOnlineVal+cardLatest.ccAtmVal
                return (
                  <div key={l} class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-1.5 text-ink-gray-8"><span class="w-2 h-2 rounded-sm" style={{background:c}}/>{l}</span>
                    <span class="text-ink-gray-7 tabular-nums">{total>0?`${((v/total)*100).toFixed(1)}%`:'—'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-3">DC Channel Mix</h2>
            <DoughnutChart
              labels={['PoS','Online','ATM']}
              data={[cardLatest.dcPosVal, cardLatest.dcOnlineVal, cardLatest.dcAtmVal]}
              colors={[CARD_COLORS.DC_POS, CARD_COLORS.DC_ONLINE, CARD_COLORS.DC_ATM]}
              height={130} tooltipFormat={fmtCard}
            />
            <div class="space-y-1.5 mt-3">
              {[{l:'PoS',v:cardLatest.dcPosVal,c:CARD_COLORS.DC_POS},{l:'Online',v:cardLatest.dcOnlineVal,c:CARD_COLORS.DC_ONLINE},{l:'ATM',v:cardLatest.dcAtmVal,c:CARD_COLORS.DC_ATM}].map(({l,v,c}) => {
                const total = cardLatest.dcPosVal+cardLatest.dcOnlineVal+cardLatest.dcAtmVal
                return (
                  <div key={l} class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-1.5 text-ink-gray-8"><span class="w-2 h-2 rounded-sm" style={{background:c}}/>{l}</span>
                    <span class="text-ink-gray-7 tabular-nums">{total>0?`${((v/total)*100).toFixed(1)}%`:'—'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-3">Top Banks by CC Spend</h2>
            {cardsLoading ? (
              <div class="space-y-2">{[...Array(5)].map((_,i)=><div key={i} class="h-10 bg-surface-gray-1 rounded animate-pulse"/>)}</div>
            ) : (
              <div class="space-y-2">
                {top5Banks.map((b,i) => {
                  const maxVal = top5Banks[0]?.totalCCSpendVal ?? 1
                  return (
                    <div key={b.bankName} class="space-y-1">
                      <div class="flex items-center gap-2 text-xs">
                        <span class="text-ink-gray-5 tabular-nums w-4 shrink-0">{i+1}</span>
                        <AppLogo name={b.bankName} size={18} rounded="sm" />
                        <span class="text-ink-gray-8 truncate flex-1 min-w-0" title={b.bankName}>{b.bankName}</span>
                        <span class="text-ink-gray-7 shrink-0 tabular-nums">{fmtCard(b.totalCCSpendVal)}</span>
                      </div>
                      <div class="h-1 bg-surface-gray-1 rounded-full overflow-hidden ml-9">
                        <div class="h-full rounded-full" style={{width:`${(b.totalCCSpendVal/maxVal)*100}%`, background:'var(--ink-blue-2)'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPI 24mo trend */}
      <div class="glass-card p-5">
        <h2 class="text-sm font-medium text-ink-gray-9 mb-1">UPI 24-Month Trajectory</h2>
        <p class="text-xs text-ink-gray-6 mb-4">Volume (Bn) · Value (₹L Cr)</p>
        <LineChart
          labels={trend24.map(d=>d.label)}
          datasets={[
            { label:'Volume (Bn)', data:trend24.map(d=>+(d.volume/1000).toFixed(2)), borderColor:'#3B82F6', fill:true, tension:0.3, pointRadius:0, yAxisID:'y' },
            { label:'Value (₹L Cr)', data:trend24.map(d=>+(d.value/100000).toFixed(2)), borderColor:'#10B981', fill:false, tension:0.3, pointRadius:0, yAxisID:'y2' },
          ]}
          height={200}
          tickFormat={v=>`${v}B`}
          y2TickFormat={v=>`${v}L`}
        />
      </div>
    </div>
  )
}
