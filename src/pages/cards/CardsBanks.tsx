/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import Icon from '../../components/Icon'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import ErrorState from '../../components/ErrorState'
import { useCardsBankLatest, useBankDetail, useAllBanks } from '../../hooks/useCardsData'
import clsx from 'clsx'

const fmt = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(2)}L Cr` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}K Cr` : `₹${v.toFixed(0)} Cr`

const BANK_COLORS = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#0EA5E9','#EC4899','#F97316','#6366F1','#14B8A6']

const CATEGORIES = ['All', 'Public Sector Banks', 'Private Sector Banks', 'Foreign Banks', 'Small Finance Banks', 'Payments Banks']

export default function CardsBanks() {
  const { banks, latestDate, isLoading, error, refetch } = useCardsBankLatest()
  const { bankNames } = useAllBanks()
  const [drill, setDrill] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState('All')
  const { bankData } = useBankDetail(drill ?? '')

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const filtered = catFilter === 'All' ? banks : banks.filter(b => b.bankCategory === catFilter)
  const top10 = filtered.slice(0, 10)

  return (
    <div class="space-y-6 max-w-7xl">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-ink-gray-9">Bank Deep Dive</h1>
          <p class="text-xs text-ink-gray-6 mt-0.5">
            {latestDate ? `Latest: ${latestDate}` : 'Loading…'} · 85 banks · RBI ATM/POS statistics
          </p>
        </div>
        {drill && (
          <button onClick={() => setDrill(null)}
            class="flex items-center gap-1.5 text-xs text-ink-gray-7 hover:text-ink-gray-9 px-3 py-1.5 rounded-lg border border-outline-gray-2 hover:border-outline-gray-3 transition-all">
            <Icon name="arrow-left" size={14} />
            All Banks
          </button>
        )}
      </div>

      {!drill ? (
        <>
          {/* Category filter */}
          <div class="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                class={clsx('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  catFilter === c
                    ? 'bg-surface-blue-1 border-outline-blue-1 text-ink-blue-3'
                    : 'border-outline-gray-2 text-ink-gray-7 hover:text-ink-gray-9 hover:border-outline-gray-3')}>
                {c}
              </button>
            ))}
          </div>

          {/* Top 10 bar chart */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-4">
              Top Banks by CC Spend
              {catFilter !== 'All' && <span class="text-ink-gray-6 font-normal ml-1.5">· {catFilter}</span>}
            </h2>
            {isLoading ? (
              <div class="h-52 bg-surface-gray-1 rounded animate-pulse" />
            ) : (
              <BarChart
                labels={top10.map(b => b.bankName)}
                datasets={[{
                  label: 'CC Spend',
                  data: top10.map(b => b.totalCCSpendVal),
                  backgroundColor: top10.map((_, i) => `${BANK_COLORS[i % 10]}cc`),
                  borderColor: top10.map((_, i) => BANK_COLORS[i % 10]),
                  borderWidth: 1,
                  borderRadius: 4,
                }]}
                horizontal
                height={260}
                tickFormat={v => v >= 100000 ? `${(v/100000).toFixed(1)}L` : `${(v/1000).toFixed(0)}K`}
              />
            )}
          </div>

          {/* Bank table */}
          <div class="glass-card overflow-hidden">
            <div class="p-4 border-b border-outline-gray-2 flex items-center justify-between">
              <h2 class="text-sm font-medium text-ink-gray-9">Bank Leaderboard</h2>
              <span class="text-xs text-ink-gray-6">{filtered.length} banks</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-outline-gray-1">
                    {['Rank', 'Bank', 'Category', 'CC Spend', 'DC Spend', 'CC Cards', 'DC Cards', ''].map(h => (
                      <th key={h} class="text-left px-4 py-2.5 text-ink-gray-6 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [...Array(8)] : filtered.slice(0, 20)).map((b: typeof filtered[0] | undefined, i) => (
                    <tr key={b?.bankName ?? i} class="border-b border-outline-gray-1 hover:bg-surface-gray-1 transition-colors">
                      {b ? (
                        <>
                          <td class="px-4 py-2.5 text-ink-gray-6 tabular-nums">#{i + 1}</td>
                          <td class="px-4 py-2.5 text-ink-gray-9 font-medium max-w-[160px] truncate">{b.bankName}</td>
                          <td class="px-4 py-2.5">
                            <span class="pill bg-surface-gray-2 text-ink-gray-6 border border-outline-gray-2 whitespace-nowrap">{b.bankCategory}</span>
                          </td>
                          <td class="px-4 py-2.5 text-ink-gray-9 tabular-nums">{fmt(b.totalCCSpendVal)}</td>
                          <td class="px-4 py-2.5 text-ink-gray-9 tabular-nums">{fmt(b.totalDCSpendVal)}</td>
                          <td class="px-4 py-2.5 text-ink-gray-7 tabular-nums">{b.creditCards.toLocaleString('en-IN')}</td>
                          <td class="px-4 py-2.5 text-ink-gray-7 tabular-nums">{b.debitCards.toLocaleString('en-IN')}</td>
                          <td class="px-4 py-2.5">
                            <button onClick={() => setDrill(b.bankName)}
                              class="text-ink-blue-2 hover:text-ink-blue-3 flex items-center gap-1 transition-colors">
                              <Icon name="external-link" size={13} />
                              Drill
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
      ) : (
        /* Bank Detail Drill */
        <BankDetail bankName={drill} bankData={bankData} />
      )}
    </div>
  )
}

function BankDetail({ bankName, bankData }: { bankName: string; bankData: ReturnType<typeof useBankDetail>['bankData'] }) {
  const latest = bankData[bankData.length - 1]
  const prev = bankData[bankData.length - 2]

  const momCC = prev && prev.totalCCSpendVal > 0
    ? ((latest?.totalCCSpendVal - prev.totalCCSpendVal) / prev.totalCCSpendVal) * 100 : null

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="glass-card p-5">
        <h2 class="text-lg font-semibold text-ink-gray-9">{bankName}</h2>
        <p class="text-xs text-ink-gray-7 mt-0.5">Latest: {latest?.label} · {bankData.length} months of data</p>
        {latest && (
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { label: 'CC Spend',    val: fmt(latest.totalCCSpendVal)                    },
              { label: 'DC Spend',    val: fmt(latest.totalDCSpendVal)                    },
              { label: 'CC Cards',    val: latest.creditCards.toLocaleString('en-IN')     },
              { label: 'MoM CC',      val: momCC !== null ? `${momCC >= 0 ? '+' : ''}${momCC.toFixed(1)}%` : '—', trend: momCC },
            ].map(({ label, val, trend }) => (
              <div key={label} class="bg-surface-gray-1 rounded-lg p-3 border border-outline-gray-1">
                <p class="text-2xs text-ink-gray-6 uppercase tracking-wider mb-1">{label}</p>
                <p class={clsx('text-lg font-semibold', trend !== undefined && trend !== null ? (trend >= 0 ? 'stat-positive' : 'stat-negative') : 'text-ink-gray-9')}>
                  {val}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CC Trend */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-4">CC Spend Trend (₹K Cr)</h2>
          <LineChart
            labels={bankData.map(d => d.label)}
            datasets={[{
              label: 'PoS',
              data: bankData.map(d => +(d.ccPosVal / 1000).toFixed(1)),
              borderColor: '#3B82F6', tension: 0.3, pointRadius: 0, backgroundColor: 'transparent',
            }, {
              label: 'Online',
              data: bankData.map(d => +(d.ccOnlineVal / 1000).toFixed(1)),
              borderColor: '#8B5CF6', tension: 0.3, pointRadius: 0, backgroundColor: 'transparent',
            }]}
            height={180}
            tickFormat={v => `₹${v}K`}
          />
        </div>
        <div class="glass-card p-5">
          <h2 class="text-sm font-medium text-ink-gray-9 mb-4">DC Spend Trend (₹K Cr)</h2>
          <LineChart
            labels={bankData.map(d => d.label)}
            datasets={[{
              label: 'PoS',
              data: bankData.map(d => +(d.dcPosVal / 1000).toFixed(1)),
              borderColor: '#10B981', tension: 0.3, pointRadius: 0, backgroundColor: 'transparent',
            }, {
              label: 'Online',
              data: bankData.map(d => +(d.dcOnlineVal / 1000).toFixed(1)),
              borderColor: '#34D399', tension: 0.3, pointRadius: 0, backgroundColor: 'transparent',
            }]}
            height={180}
            tickFormat={v => `₹${v}K`}
          />
        </div>
      </div>
    </div>
  )
}
