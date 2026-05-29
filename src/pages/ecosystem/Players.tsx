/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import Icon from '../../components/Icon'
import AppLogo from '../../components/AppLogo'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import { useUPIAppData } from '../../hooks/useUpiData'
import { useCardsBankLatest, useBankDetail } from '../../hooks/useCardsData'
import { APP_COLORS } from '../../data/upiAppData'
import clsx from 'clsx'

type Tab = 'apps' | 'banks'

const fmt = (v: number, u: 'vol' | 'val') =>
  u === 'vol' ? (v >= 1000 ? `${(v/1000).toFixed(2)}B` : `${v.toFixed(0)}M`)
              : (v >= 100000 ? `₹${(v/100000).toFixed(2)}L Cr` : `₹${(v/1000).toFixed(1)}K Cr`)

const fmtBank = (v: number) =>
  v >= 100000 ? `₹${(v/100000).toFixed(2)}L Cr` : v >= 1000 ? `₹${(v/1000).toFixed(1)}K Cr` : `₹${v.toFixed(0)} Cr`

function cagr(first: number, last: number, months: number) {
  if (!first || !last || months <= 0) return 0
  return (Math.pow(last/first, 12/months) - 1) * 100
}

const BANK_COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#0EA5E9','#EC4899','#F97316','#6366F1','#14B8A6']
const CATEGORIES = ['All', 'Public Sector Banks', 'Private Sector Banks', 'Foreign Banks', 'Small Finance Banks', 'Payments Banks']

export default function Players() {
  const [tab, setTab] = useState<Tab>('apps')

  // UPI app state
  const app = useUPIAppData()
  const [selectedApp, setSelectedApp] = useState(app.latestRanked[0]?.app ?? 'PhonePe')

  // Cards bank state
  const { banks, latestDate, isLoading: banksLoading } = useCardsBankLatest()
  const [drill, setDrill] = useState<string|null>(null)
  const [catFilter, setCatFilter] = useState('All')
  const { bankData } = useBankDetail(drill ?? '')

  const filtered = catFilter === 'All' ? banks : banks.filter(b => b.bankCategory === catFilter)
  const top10Banks = filtered.slice(0, 10)

  const TABS = [
    { id: 'apps' as Tab, label: 'UPI App Race', icon: 'grid' },
    { id: 'banks' as Tab, label: 'Bank Leaderboard', icon: 'briefcase' },
  ]

  // App deep dive
  const series = app.appSeries[selectedApp] ?? []
  const nonZero = series.filter(d => d.volume > 0)
  const latest = nonZero[nonZero.length-1]
  const prev = nonZero[nonZero.length-2]
  const first = nonZero[0]
  const rankRow = app.latestRanked.find(r => r.app === selectedApp)
  const color = APP_COLORS[selectedApp] ?? '#3B82F6'
  const momVol = prev?.volume > 0 ? ((latest.volume-prev.volume)/prev.volume)*100 : 0
  const yoyRow = nonZero.length >= 13 ? nonZero[nonZero.length-13] : null
  const yoyVol = (yoyRow && yoyRow.volume > 0) ? ((latest.volume - yoyRow.volume) / yoyRow.volume) * 100 : null
  const cagrVal = first && latest ? cagr(first.volume, latest.volume, nonZero.length-1) : 0

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">
      <div>
        <h1 class="text-xl font-semibold text-ink-gray-9">Players</h1>
        <p class="text-xs text-ink-gray-6 mt-0.5">Who is winning — UPI apps and card-issuing banks</p>
      </div>

      {/* Tab bar */}
      <div class="flex gap-1 bg-surface-gray-1 border border-outline-gray-2 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => { setTab(id); setDrill(null) }}
            class={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all',
              tab === id ? 'bg-surface-blue-1 text-ink-blue-3 border border-outline-blue-1' : 'text-ink-gray-7 hover:text-ink-gray-9'
            )}>
            <Icon name={icon} size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ─── UPI Apps Tab ─── */}
      {tab === 'apps' && (
        <div class="space-y-6">
          {/* App pills */}
          <div class="flex flex-wrap gap-2">
            {app.latestRanked.map(r => (
              <button key={r.app} onClick={() => setSelectedApp(r.app)}
                class={clsx('flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-xs font-medium transition-all border',
                  selectedApp === r.app ? 'text-ink-gray-9' : 'text-ink-gray-7 border-outline-gray-2 hover:border-outline-gray-3')}
                style={selectedApp === r.app ? { background:`${r.color}22`, borderColor:`${r.color}66`, color:r.color } : {}}>
                <AppLogo name={r.app} size={20} rounded="full" color={r.color} />
                #{r.rank} {r.app}
              </button>
            ))}
          </div>

          {/* App Leaderboard */}
          <div class="glass-card overflow-hidden">
            <div class="px-5 py-4 border-b border-outline-gray-1 flex items-center justify-between">
              <div>
                <h2 class="text-sm font-medium text-ink-gray-9">UPI App Leaderboard</h2>
                <p class="text-2xs text-ink-gray-5 mt-0.5">Ranked by latest-month volume · {app.latestLabel}</p>
              </div>
              <span class="text-2xs text-ink-gray-5">{app.latestRanked.length} apps</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-outline-gray-1">
                    {['Rank','App','MoM','Volume','Value','Vol Share','Val Share',''].map(h => (
                      <th key={h} class="text-left px-4 py-2.5 text-ink-gray-6 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {app.latestRanked.map((r, i) => {
                    const series = (app.appSeries[r.app] ?? []).filter(d => d.volume > 0)
                    const last = series[series.length - 1]
                    const prev = series[series.length - 2]
                    const mom  = prev?.volume > 0 ? ((last.volume - prev.volume) / prev.volume) * 100 : null
                    const isWinner = i === 0
                    const isLast   = i === app.latestRanked.length - 1
                    const isActive = selectedApp === r.app
                    return (
                      <tr key={r.app}
                        onClick={() => setSelectedApp(r.app)}
                        class={clsx(
                          'border-b border-outline-gray-1 last:border-0 cursor-pointer transition-colors',
                          isActive ? 'bg-surface-blue-1' :
                          isWinner ? 'bg-surface-blue-1/40' :
                          'hover:bg-surface-gray-1'
                        )}>
                        <td class="px-4 py-3 w-10">
                          <span class={clsx('text-sm font-bold tabular-nums',
                            isWinner ? 'text-ink-blue-2' : isLast ? 'text-ink-gray-5' : 'text-ink-gray-6')}>
                            {r.rank}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          <div class="flex items-center gap-2.5 min-w-0">
                            <AppLogo name={r.app} size={22} rounded="md" color={r.color} />
                            <span class={clsx('text-sm font-medium', isWinner ? 'text-ink-gray-9' : 'text-ink-gray-8')}>{r.app}</span>
                            {isWinner && (
                              <span class="text-2xs px-1.5 py-0.5 rounded border border-outline-green-1 bg-surface-green-1 text-ink-green-2 font-semibold">LEADING</span>
                            )}
                          </div>
                        </td>
                        <td class="px-4 py-3 w-20">
                          {mom !== null ? (
                            <span class={clsx('text-xs font-medium tabular-nums', mom >= 0 ? 'stat-positive' : 'stat-negative')}>
                              {mom >= 0 ? '+' : ''}{mom.toFixed(1)}%
                            </span>
                          ) : (
                            <span class="text-2xs text-ink-gray-5">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3 text-ink-gray-9 tabular-nums">{fmt(r.volume, 'vol')}</td>
                        <td class="px-4 py-3 text-ink-gray-9 tabular-nums">{fmt(r.value, 'val')}</td>
                        <td class="px-4 py-3 tabular-nums">
                          <span class="text-sm font-semibold" style={{ color: r.color }}>{r.volShare.toFixed(1)}%</span>
                        </td>
                        <td class="px-4 py-3 text-ink-gray-7 tabular-nums">{r.valShare.toFixed(1)}%</td>
                        <td class="px-4 py-3 w-12">
                          <Icon name="external-link" size={13} className="text-ink-gray-4" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* App profile */}
          <div class="glass-card p-5">
            <div class="flex items-center gap-4 mb-5">
              <AppLogo name={selectedApp} size={48} rounded="xl" color={color} />
              <div class="flex-1 min-w-0">
                <h2 class="text-lg font-semibold text-ink-gray-9">{selectedApp}</h2>
                <p class="text-xs text-ink-gray-7">Latest: {latest?.label}</p>
              </div>
              {rankRow && (
                <div class="text-right shrink-0">
                  <p class="text-3xl font-bold" style={{ color }}>#{rankRow.rank}</p>
                  <p class="text-xs text-ink-gray-6">by volume</p>
                </div>
              )}
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:'Volume', value:fmt(latest?.volume??0,'vol'), sub:latest?.label },
                { label:'Value',  value:fmt(latest?.value??0,'val'),  sub:latest?.label },
                { label:'Vol Share', value:rankRow?`${rankRow.volShare.toFixed(1)}%`:'—', sub:'of total UPI' },
                { label:'Val Share', value:rankRow?`${rankRow.valShare.toFixed(1)}%`:'—', sub:'of total UPI' },
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
              { label:'MoM Growth', value:momVol, suffix:'%' },
              { label:'YoY Growth', value:yoyVol, suffix:'%' },
              { label:'CAGR (all history)', value:cagrVal, suffix:'%' },
            ].map(({ label, value, suffix }) => (
              <div key={label} class="glass-card p-4">
                <p class="text-2xs text-ink-gray-6 tracking-wide mb-2">{label}</p>
                {value !== null ? (
                  <p class={clsx('text-2xl font-bold', value >= 0 ? 'stat-positive' : 'stat-negative')}>
                    {value >= 0 ? '+' : ''}{value.toFixed(1)}{suffix}
                  </p>
                ) : <p class="text-2xl font-bold text-ink-gray-6">N/A</p>}
              </div>
            ))}
          </div>

          {/* Trends */}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="glass-card p-5">
              <h2 class="text-sm font-medium text-ink-gray-9 mb-4">Volume Trend (Mn txns)</h2>
              <LineChart
                labels={nonZero.map(d=>d.label)}
                datasets={[{ label:selectedApp, data:nonZero.map(d=>d.volume), borderColor:color, backgroundColor:`${color}15`, fill:true, tension:0.3, pointRadius:0 }]}
                height={180} tickFormat={v=>v>=1000?`${(v/1000).toFixed(0)}B`:`${v}M`}
              />
            </div>
            <div class="glass-card p-5">
              <h2 class="text-sm font-medium text-ink-gray-9 mb-4">Value Trend (₹K Cr)</h2>
              <LineChart
                labels={nonZero.map(d=>d.label)}
                datasets={[{ label:selectedApp, data:nonZero.map(d=>+(d.value/1000).toFixed(0)), borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.08)', fill:true, tension:0.3, pointRadius:0 }]}
                height={180} tickFormat={v=>`₹${v}K`}
              />
            </div>
          </div>

          {/* Monthly table */}
          <div class="glass-card overflow-hidden">
            <div class="p-4 border-b border-outline-gray-2">
              <h2 class="text-sm font-medium text-ink-gray-9">Monthly Data — {selectedApp}</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-outline-gray-1">
                    {['Month','Volume','Value','Vol MoM','Val MoM','Source'].map(h => (
                      <th key={h} class="text-left px-4 py-2.5 text-ink-gray-6 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nonZero.slice(-12).reverse().map((row, i, arr) => {
                    const prevRow = arr[i+1]
                    const vMoM = prevRow?.volume > 0 ? ((row.volume-prevRow.volume)/prevRow.volume)*100 : null
                    const valMoM = prevRow?.value > 0 ? ((row.value-prevRow.value)/prevRow.value)*100 : null
                    return (
                      <tr key={row.date} class="border-b border-outline-gray-1 hover:bg-surface-gray-1">
                        <td class="px-4 py-2.5 text-ink-gray-9 font-medium">{row.label}</td>
                        <td class="px-4 py-2.5 text-ink-gray-9 tabular-nums">{fmt(row.volume,'vol')}</td>
                        <td class="px-4 py-2.5 text-ink-gray-9 tabular-nums">{fmt(row.value,'val')}</td>
                        <td class={clsx('px-4 py-2.5 tabular-nums', vMoM===null?'text-ink-gray-5':vMoM>=0?'stat-positive':'stat-negative')}>
                          {vMoM!==null?`${vMoM>=0?'+':''}${vMoM.toFixed(1)}%`:'—'}
                        </td>
                        <td class={clsx('px-4 py-2.5 tabular-nums', valMoM===null?'text-ink-gray-5':valMoM>=0?'stat-positive':'stat-negative')}>
                          {valMoM!==null?`${valMoM>=0?'+':''}${valMoM.toFixed(1)}%`:'—'}
                        </td>
                        <td class="px-4 py-2.5">
                          <span class={clsx('pill', row.estimated?'bg-surface-amber-1 text-ink-amber-2 border border-outline-amber-1':'pill-green')}>
                            {row.estimated?'Est.':'NPCI'}
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
      )}

      {/* ─── Banks Tab ─── */}
      {tab === 'banks' && (
        <div class="space-y-6">
          {drill ? (
            <>
              <button onClick={() => setDrill(null)}
                class="flex items-center gap-1.5 text-xs text-ink-gray-7 hover:text-ink-gray-9 px-3 py-1.5 rounded-lg border border-outline-gray-2 hover:border-outline-gray-3 transition-all">
                <Icon name="arrow-left" size={14} /> All Banks
              </button>
              <BankDetail bankName={drill} bankData={bankData} />
            </>
          ) : (
            <>
              {/* Category filter */}
              <div class="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCatFilter(c)}
                    class={clsx('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                      catFilter===c ? 'bg-surface-blue-1 border-outline-blue-1 text-ink-blue-3' : 'border-outline-gray-2 text-ink-gray-7 hover:text-ink-gray-9 hover:border-outline-gray-3')}>
                    {c}
                  </button>
                ))}
              </div>

              {/* Bar chart */}
              <div class="glass-card p-5">
                <h2 class="text-sm font-medium text-ink-gray-9 mb-4">
                  Top Banks by CC Spend
                  {catFilter !== 'All' && <span class="text-ink-gray-6 font-normal ml-1.5">· {catFilter}</span>}
                </h2>
                {banksLoading ? <div class="h-[260px] bg-surface-gray-1 rounded animate-pulse" /> : (
                  <BarChart
                    labels={top10Banks.map(b=>b.bankName)}
                    datasets={[{
                      label:'CC Spend',
                      data:top10Banks.map(b=>b.totalCCSpendVal),
                      backgroundColor:top10Banks.map((_,i)=>`${BANK_COLORS[i%10]}cc`),
                      borderColor:top10Banks.map((_,i)=>BANK_COLORS[i%10]),
                      borderWidth:1, borderRadius:4,
                    }]}
                    horizontal height={260}
                    tickFormat={v=>v>=100000?`${(v/100000).toFixed(1)}L`:`${(v/1000).toFixed(0)}K`}
                  />
                )}
              </div>

              {/* Leaderboard table */}
              <div class="glass-card overflow-hidden">
                <div class="p-4 border-b border-outline-gray-2 flex items-center justify-between">
                  <h2 class="text-sm font-medium text-ink-gray-9">Bank Leaderboard</h2>
                  <span class="text-xs text-ink-gray-6">{filtered.length} banks · {latestDate}</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="border-b border-outline-gray-1">
                        {['Rank','Bank','Category','CC Spend','DC Spend','CC Cards','DC Cards',''].map(h => (
                          <th key={h} class="text-left px-4 py-2.5 text-ink-gray-6 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(banksLoading ? [...Array(8)] : filtered.slice(0,20)).map((b: typeof filtered[0]|undefined, i) => (
                        <tr key={b?.bankName??i} class="border-b border-outline-gray-1 hover:bg-surface-gray-1 transition-colors">
                          {b ? (
                            <>
                              <td class="px-4 py-2.5 text-ink-gray-6 tabular-nums">#{i+1}</td>
                              <td class="px-4 py-2.5 text-ink-gray-9 font-medium max-w-[220px]">
                                <div class="flex items-center gap-2 min-w-0">
                                  <AppLogo name={b.bankName} size={20} rounded="md" />
                                  <span class="truncate">{b.bankName}</span>
                                </div>
                              </td>
                              <td class="px-4 py-2.5"><span class="pill bg-surface-gray-2 text-ink-gray-6 border border-outline-gray-2 whitespace-nowrap">{b.bankCategory}</span></td>
                              <td class="px-4 py-2.5 text-ink-gray-9 tabular-nums">{fmtBank(b.totalCCSpendVal)}</td>
                              <td class="px-4 py-2.5 text-ink-gray-9 tabular-nums">{fmtBank(b.totalDCSpendVal)}</td>
                              <td class="px-4 py-2.5 text-ink-gray-7 tabular-nums">{b.creditCards.toLocaleString('en-IN')}</td>
                              <td class="px-4 py-2.5 text-ink-gray-7 tabular-nums">{b.debitCards.toLocaleString('en-IN')}</td>
                              <td class="px-4 py-2.5">
                                <button onClick={() => setDrill(b.bankName)} class="text-ink-blue-2 hover:text-ink-blue-3 flex items-center gap-1 transition-colors">
                                  <Icon name="external-link" size={13} /> Drill
                                </button>
                              </td>
                            </>
                          ) : (
                            <td colSpan={8} class="px-4 py-2.5"><div class="h-4 bg-surface-gray-1 rounded animate-pulse" /></td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function BankDetail({ bankName, bankData }: { bankName: string; bankData: ReturnType<typeof useBankDetail>['bankData'] }) {
  const latest = bankData[bankData.length-1]
  const prev = bankData[bankData.length-2]
  const momCC = prev?.totalCCSpendVal > 0
    ? ((latest?.totalCCSpendVal-prev.totalCCSpendVal)/prev.totalCCSpendVal)*100 : null

  return (
    <div class="space-y-6">
      <div class="glass-card p-5">
        <div class="flex items-center gap-3">
          <AppLogo name={bankName} size={40} rounded="lg" />
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-ink-gray-9 truncate">{bankName}</h2>
            <p class="text-xs text-ink-gray-7 mt-0.5">Latest: {latest?.label} · {bankData.length} months</p>
          </div>
        </div>
        {latest && (
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { label:'CC Spend', val:fmtBank(latest.totalCCSpendVal) },
              { label:'DC Spend', val:fmtBank(latest.totalDCSpendVal) },
              { label:'CC Cards', val:latest.creditCards.toLocaleString('en-IN') },
              { label:'MoM CC',   val:momCC!==null?`${momCC>=0?'+':''}${momCC.toFixed(1)}%`:'—', trend:momCC },
            ].map(({ label, val, trend }) => (
              <div key={label} class="bg-surface-gray-1 rounded-lg p-3 border border-outline-gray-1">
                <p class="text-2xs text-ink-gray-6 tracking-wide mb-1">{label}</p>
                <p class={clsx('text-lg font-semibold', trend!==undefined&&trend!==null?(trend>=0?'stat-positive':'stat-negative'):'text-ink-gray-9')}>{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-4">CC Spend Trend (₹K Cr)</h2>
          <LineChart
            labels={bankData.map(d=>d.label)}
            datasets={[
              { label:'PoS', data:bankData.map(d=>+(d.ccPosVal/1000).toFixed(1)), borderColor:'#3B82F6', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
              { label:'Online', data:bankData.map(d=>+(d.ccOnlineVal/1000).toFixed(1)), borderColor:'#8B5CF6', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
            ]}
            height={180} tickFormat={v=>`₹${v}K`}
          />
        </div>
        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-4">DC Spend Trend (₹K Cr)</h2>
          <LineChart
            labels={bankData.map(d=>d.label)}
            datasets={[
              { label:'PoS', data:bankData.map(d=>+(d.dcPosVal/1000).toFixed(1)), borderColor:'#10B981', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
              { label:'Online', data:bankData.map(d=>+(d.dcOnlineVal/1000).toFixed(1)), borderColor:'#34D399', tension:0.3, pointRadius:0, backgroundColor:'transparent' },
            ]}
            height={180} tickFormat={v=>`₹${v}K`}
          />
        </div>
      </div>
    </div>
  )
}
