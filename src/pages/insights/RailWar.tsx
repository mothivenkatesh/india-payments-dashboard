/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import { useRBIMonthly } from '../../hooks/useRBIData'
import LineChart from '../../components/charts/LineChart'
import type { RBIMonthly } from '../../api/rbiDaily'

// ── Rail definitions ────────────────────────────────────────────────────────
const RAILS = [
  { id: 'upi',    label: 'UPI',          color: '#3B82F6', get: (m: RBIMonthly) => m.upiVal,       mdr: false },
  { id: 'ccecom', label: 'CC eCommerce', color: '#8B5CF6', get: (m: RBIMonthly) => m.ccEcomVal,    mdr: true  },
  { id: 'nach',   label: 'NACH',         color: '#10B981', get: (m: RBIMonthly) => m.nachDebitVal, mdr: true  },
  { id: 'bbps',   label: 'BBPS',         color: '#F59E0B', get: (m: RBIMonthly) => m.bbpsVal,      mdr: false },
  { id: 'ccpos',  label: 'CC POS',       color: '#6366F1', get: (m: RBIMonthly) => m.ccPosVal,     mdr: false },
  { id: 'dcpos',  label: 'DC POS',       color: '#EF4444', get: (m: RBIMonthly) => m.dcPosVal,     mdr: false },
] as const

const PERIODS = [
  { label: '6M',  months: 6  },
  { label: '1Y',  months: 12 },
  { label: '2Y',  months: 24 },
  { label: 'ALL', months: 999 },
]

function consecutiveStreak(series: number[]): number {
  if (series.length < 2) return 0
  const last = series[series.length - 1]
  const dir = last >= series[series.length - 2] ? 1 : -1
  let streak = 1
  for (let i = series.length - 2; i > 0; i--) {
    if (dir === 1 && series[i] >= series[i - 1]) streak++
    else if (dir === -1 && series[i] <= series[i - 1]) streak++
    else break
  }
  return dir * streak
}

function fmtPct(v: number, decimals = 1) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`
}

export default function RailWar() {
  const { months, isLoading } = useRBIMonthly()
  const [period, setPeriod] = useState('ALL')

  const periodMonths = PERIODS.find(p => p.label === period)?.months ?? 999
  const slice = months.slice(-Math.min(periodMonths, months.length))

  // Index each rail to 100 at the start of the slice
  const indexed = RAILS.map(rail => {
    const values = slice.map(m => rail.get(m))
    const base = values[0] ?? 1
    return {
      ...rail,
      values,
      indexed: values.map(v => base > 0 ? +((v / base) * 100).toFixed(2) : 100),
      totalReturn: base > 0 ? ((values[values.length - 1] - base) / base) * 100 : 0,
      streak: consecutiveStreak(values),
      latest: values[values.length - 1],
    }
  })

  // Sort leaderboard by total return (descending)
  const ranked = [...indexed].sort((a, b) => b.totalReturn - a.totalReturn)

  const labels = slice.map(m => m.label)

  return (
    <div class="space-y-6 max-w-7xl">

      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-ink-gray-9">Rail War</h1>
          <p class="text-xs text-ink-gray-6 mt-0.5">
            All rails indexed to 100. Who is winning India payments.
          </p>
        </div>

        {/* Period filter */}
        <div class="flex items-center gap-1 bg-surface-gray-1 border border-outline-gray-2 rounded-lg p-0.5">
          {PERIODS.map(p => (
            <button
              key={p.label}
              onClick={() => setPeriod(p.label)}
              class={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                period === p.label
                  ? 'bg-surface-white text-ink-gray-9 shadow-sm border border-outline-gray-2'
                  : 'text-ink-gray-6 hover:text-ink-gray-8'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — all rails indexed */}
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-1">
          <div>
            <h2 class="text-sm font-medium text-ink-gray-9">Performance Index</h2>
            <p class="text-xs text-ink-gray-6 mt-0.5">All rails start at 100. Higher = more growth since start of period.</p>
          </div>
          <span class="text-2xs text-ink-gray-5">Indexed · {slice.length} months</span>
        </div>

        {/* Rail legend pills */}
        <div class="flex flex-wrap gap-2 mt-3 mb-4">
          {indexed.map(rail => (
            <div key={rail.id} class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-outline-gray-2 bg-surface-gray-1">
              <span class="w-2 h-2 rounded-full shrink-0" style={{ background: rail.color }} />
              <span class="text-2xs text-ink-gray-7 font-medium">{rail.label}</span>
              {rail.mdr && (
                <span class="text-2xs text-ink-blue-2 font-semibold">MDR</span>
              )}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div class="h-72 bg-surface-gray-1 rounded animate-pulse" />
        ) : (
          <LineChart
            labels={labels}
            datasets={indexed.map(rail => ({
              label: rail.label,
              data: rail.indexed,
              borderColor: rail.color,
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 2,
            }))}
            height={280}
            tickFormat={v => `${v}`}
          />
        )}
      </div>

      {/* Leaderboard */}
      <div class="glass-card overflow-hidden">
        <div class="px-5 py-4 border-b border-outline-gray-1">
          <h2 class="text-sm font-medium text-ink-gray-9">Leaderboard</h2>
          <p class="text-2xs text-ink-gray-5 mt-0.5">Ranked by total return since start of period</p>
        </div>

        {isLoading ? (
          <div class="p-5 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} class="h-10 bg-surface-gray-1 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div>
            {ranked.map((rail, i) => {
              const isWinner = i === 0
              const isLoser  = i === ranked.length - 1
              const streakAbs = Math.abs(rail.streak)
              const streakUp  = rail.streak > 0
              return (
                <div
                  key={rail.id}
                  class={`flex items-center gap-4 px-5 py-3.5 border-b border-outline-gray-1 last:border-0 ${
                    isWinner ? 'bg-surface-blue-1' : ''
                  }`}
                >
                  {/* Rank */}
                  <div class="w-6 text-center">
                    <span class={`text-sm font-bold tabular-nums ${
                      isWinner ? 'text-ink-blue-2' : isLoser ? 'text-ink-gray-4' : 'text-ink-gray-6'
                    }`}>
                      {i + 1}
                    </span>
                  </div>

                  {/* Color dot + Rail name */}
                  <div class="flex items-center gap-2.5 flex-1 min-w-0">
                    <span class="w-3 h-3 rounded-full shrink-0" style={{ background: rail.color }} />
                    <span class={`text-sm font-medium ${isWinner ? 'text-ink-gray-9' : 'text-ink-gray-8'}`}>
                      {rail.label}
                    </span>
                    {rail.mdr && (
                      <span class="text-2xs px-1.5 py-0.5 rounded border border-outline-blue-1 bg-surface-blue-1 text-ink-blue-2 font-semibold">
                        MDR
                      </span>
                    )}
                    {isWinner && (
                      <span class="text-2xs px-1.5 py-0.5 rounded border border-outline-green-1 bg-surface-green-1 text-ink-green-2 font-semibold">
                        LEADING
                      </span>
                    )}
                    {isLoser && (
                      <span class="text-2xs px-1.5 py-0.5 rounded border border-outline-gray-2 bg-surface-gray-1 text-ink-gray-5 font-semibold">
                        LOSING
                      </span>
                    )}
                  </div>

                  {/* Streak */}
                  <div class="text-right w-28 shrink-0">
                    {streakAbs >= 2 && (
                      <span class={`text-2xs font-medium ${streakUp ? 'text-ink-green-2' : 'text-ink-red-3'}`}>
                        {streakUp ? '↑' : '↓'} {streakAbs}mo streak
                      </span>
                    )}
                  </div>

                  {/* Current index value */}
                  <div class="text-right w-20 shrink-0">
                    <span class="text-sm font-semibold tabular-nums text-ink-gray-9">
                      {rail.indexed[rail.indexed.length - 1]?.toFixed(0)}
                    </span>
                    <div class="text-2xs text-ink-gray-5">index</div>
                  </div>

                  {/* Total return */}
                  <div class="text-right w-20 shrink-0">
                    <span class={`text-sm font-semibold tabular-nums ${
                      rail.totalReturn >= 0 ? 'stat-positive' : 'stat-negative'
                    }`}>
                      {fmtPct(rail.totalReturn, 0)}
                    </span>
                    <div class="text-2xs text-ink-gray-5">return</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cashfree angle */}
      {!isLoading && (
        <div class="glass-card p-4 border border-outline-blue-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xs font-semibold text-ink-blue-2 uppercase tracking-widest">Cashfree read</span>
          </div>
          <div class="space-y-1">
            {(() => {
              const upi   = indexed.find(r => r.id === 'upi')!
              const nach  = indexed.find(r => r.id === 'nach')!
              const ccecom = indexed.find(r => r.id === 'ccecom')!
              const dcpos = indexed.find(r => r.id === 'dcpos')!
              const lines = []
              const nachRank = ranked.findIndex(r => r.id === 'nach') + 1
              const ccecomRank = ranked.findIndex(r => r.id === 'ccecom') + 1
              if (nachRank <= 3) lines.push(`NACH is rank ${nachRank}. Your Subscriptions product is sitting on the fastest fee-bearing rail.`)
              if (ccecomRank <= 3) lines.push(`CC eCommerce is rank ${ccecomRank}. MDR market growing ${fmtPct(ccecom.totalReturn, 0)} — gateway revenue ceiling expanding.`)
              if (dcpos.totalReturn < -10) lines.push(`DC POS down ${fmtPct(dcpos.totalReturn, 0)} this period. Merchants dropping card terminals. Onboard them to UPI QR.`)
              if (upi.totalReturn > nach.totalReturn * 2) lines.push(`UPI growing ${fmtPct(upi.totalReturn, 0)} — far outpacing cards. Payouts volume is accelerating.`)
              if (lines.length === 0) lines.push('Watch which MDR-bearing rail ranks highest. That is where Cashfree should double down.')
              return lines.map((l, i) => (
                <div key={i} class="flex gap-2 text-sm text-ink-gray-8">
                  <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-ink-amber-2 shrink-0" />
                  <span>{l}</span>
                </div>
              ))
            })()}
          </div>
        </div>
      )}

    </div>
  )
}
