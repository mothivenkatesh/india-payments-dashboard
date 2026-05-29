/** @jsxImportSource preact */
import { useState, useMemo } from 'preact/hooks'
import { useRBIMonthly } from '../../hooks/useRBIData'
import LineChart from '../../components/charts/LineChart'
import InfoChip from '../../components/InfoChip'
import type { RBIMonthly } from '../../api/rbiDaily'

// ── Rail definitions ────────────────────────────────────────────────────────
const RAILS = [
  { id: 'upi',    label: 'UPI',          color: '#3B82F6', get: (m: RBIMonthly) => m.upiVal,       mdr: false, cards: false },
  { id: 'ccecom', label: 'CC eCommerce', color: '#8B5CF6', get: (m: RBIMonthly) => m.ccEcomVal,    mdr: true,  cards: true  },
  { id: 'nach',   label: 'NACH',         color: '#10B981', get: (m: RBIMonthly) => m.nachDebitVal, mdr: true,  cards: false },
  { id: 'bbps',   label: 'BBPS',         color: '#F59E0B', get: (m: RBIMonthly) => m.bbpsVal,      mdr: false, cards: false },
  { id: 'ccpos',  label: 'CC POS',       color: '#6366F1', get: (m: RBIMonthly) => m.ccPosVal,     mdr: false, cards: true  },
  { id: 'dcpos',  label: 'DC POS',       color: '#EF4444', get: (m: RBIMonthly) => m.dcPosVal,     mdr: false, cards: true  },
] as const

const PERIODS = [
  { label: '6M',  months: 6  },
  { label: '1Y',  months: 12 },
  { label: '2Y',  months: 24 },
  { label: 'ALL', months: 999 },
]

const DIM_COLOR = '#CBD5E1'

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
  const [period, setPeriod] = useState('2Y')

  const periodMonths = PERIODS.find(p => p.label === period)?.months ?? 999
  const slice = months.slice(-Math.min(periodMonths, months.length))

  // Find the first month in the slice where NPCI data has taken over (cards rails go silent).
  // Returns -1 if no cutoff inside this period.
  const cardsCutoffIdx = useMemo(() => {
    for (let i = 0; i < slice.length; i++) {
      if (slice[i].source === 'npci') return i
    }
    return -1
  }, [slice])
  const lastCardsLabel = cardsCutoffIdx > 0 ? slice[cardsCutoffIdx - 1].label : null

  // Index each rail to 100 at the first month where the rail actually has data.
  // Treat 0 as missing (none of these rails legitimately hit zero monthly volume),
  // and null-ify cards rails after the NPCI cutoff so their line breaks cleanly.
  const indexed = RAILS.map(rail => {
    const values = slice.map(m => rail.get(m))
    const baseIdx = values.findIndex(v => v > 0)
    const base = baseIdx >= 0 ? values[baseIdx] : 0
    const cardsAllNpci = rail.cards && cardsCutoffIdx === 0
    const hasData = base > 0 && !cardsAllNpci
    const indexedVals: (number | null)[] = values.map((v, i) => {
      if (cardsAllNpci) return null
      if (rail.cards && cardsCutoffIdx > 0 && i >= cardsCutoffIdx) return null
      if (i < baseIdx || v <= 0) return null
      return +((v / base) * 100).toFixed(2)
    })
    let lastNonNull = -1
    for (let i = indexedVals.length - 1; i >= 0; i--) {
      if (indexedVals[i] !== null) { lastNonNull = i; break }
    }
    const latestIdx = lastNonNull >= 0 ? (indexedVals[lastNonNull] as number) : 100
    return {
      ...rail,
      values,
      indexed: indexedVals,
      totalReturn: hasData ? latestIdx - 100 : 0,
      streak: consecutiveStreak(values.filter(v => v > 0)),
      latestIndexed: latestIdx,
      hasData,
    }
  })

  // Only rails with real data participate in ranking and the headline.
  const ranked = indexed.filter(r => r.hasData).sort((a, b) => b.totalReturn - a.totalReturn)
  const labels = slice.map(m => m.label)

  // Story rails: top performer + worst performer + #2 if it is also clearly growing.
  const storyIds = new Set<string>()
  if (ranked[0]) storyIds.add(ranked[0].id)
  if (ranked.length > 1) storyIds.add(ranked[ranked.length - 1].id)
  if (ranked[1] && ranked[1].totalReturn > 0) storyIds.add(ranked[1].id)

  // Neutral macro headline: leader → laggard.
  const head = (() => {
    if (isLoading) return { lead: 'Loading…', tail: '' }
    if (ranked.length === 0) return { lead: 'No rail data for this period.', tail: '' }
    const top = ranked[0]
    const bot = ranked[ranked.length - 1]
    const lead = `${top.label} leads with ${fmtPct(top.totalReturn, 0)}.`
    let tail = ''
    if (bot && bot.id !== top.id) {
      if (bot.totalReturn < -1)      tail = `${bot.label} contracts ${fmtPct(bot.totalReturn, 0)}.`
      else if (bot.totalReturn > 1)  tail = `${bot.label} trails at ${fmtPct(bot.totalReturn, 0)}.`
      else                            tail = `${bot.label} is flat.`
    }
    return { lead, tail }
  })()

  // Dataset indexes to label at end-of-line (only story rails to avoid clutter)
  const endLabelIndexes = indexed
    .map((r, i) => (storyIds.has(r.id) ? i : -1))
    .filter(i => i >= 0)

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">

      {/* Header — neutral macro finding leads */}
      <div class="flex items-start justify-between gap-6">
        <div class="min-w-0">
          <div class="text-2xs font-semibold tracking-wide text-ink-gray-5 mb-1">
            Rail War · {slice.length} months
          </div>
          <h1 class="text-xl font-semibold text-ink-gray-9 leading-snug">
            {head.lead}
          </h1>
          {head.tail && (
            <p class="text-sm text-ink-gray-7 mt-1">{head.tail}</p>
          )}
          <p class="text-2xs text-ink-gray-5 mt-2 inline-flex items-center gap-1">
            <span>Indexed</span>
            <InfoChip term="indexed" />
            <span>to 100 at {slice[0]?.label ?? '—'}. Higher = more growth since.</span>
          </p>
        </div>

        {/* Period filter */}
        <div class="flex items-center gap-1 bg-surface-gray-1 border border-outline-gray-2 rounded-lg p-0.5 shrink-0">
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

      {/* Chart */}
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-medium text-ink-gray-9">Performance Index</h2>
          <span class="text-2xs text-ink-gray-5">{slice.length} months</span>
        </div>

        {/* Rail legend pills — final index value next to each name */}
        <div class="flex flex-wrap gap-2 mb-4">
          {indexed.map(rail => {
            const isStory = storyIds.has(rail.id)
            const noData  = !rail.hasData
            return (
              <div
                key={rail.id}
                class={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                  isStory ? 'border-outline-gray-2 bg-surface-white' : 'border-outline-gray-1 bg-surface-gray-1'
                } ${noData ? 'opacity-50' : ''}`}
                title={noData ? 'No data in this period' : undefined}
              >
                <span class="w-2 h-2 rounded-full shrink-0" style={{ background: isStory ? rail.color : DIM_COLOR }} />
                <span class={`text-2xs font-medium ${isStory ? 'text-ink-gray-8' : 'text-ink-gray-6'}`}>
                  {rail.label}
                </span>
                <span class={`text-2xs tabular-nums ${isStory ? 'text-ink-gray-9 font-semibold' : 'text-ink-gray-5'}`}>
                  {noData ? '—' : rail.latestIndexed.toFixed(0)}
                </span>
                {rail.mdr && (
                  <span class="text-2xs text-ink-blue-2 font-semibold">MDR</span>
                )}
              </div>
            )
          })}
        </div>

        {isLoading ? (
          <div class="h-[320px] bg-surface-gray-1 rounded animate-pulse" />
        ) : (
          <LineChart
            labels={labels}
            datasets={indexed.map(rail => {
              const isStory = storyIds.has(rail.id)
              return {
                label: rail.label,
                data: rail.indexed as (number | null)[] as number[],
                borderColor: isStory ? rail.color : DIM_COLOR,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                borderWidth: isStory ? 2.5 : 1.25,
                spanGaps: false,
              }
            })}
            height={320}
            tickFormat={v => `${v}`}
            baselineAt={100}
            baselineLabel="100 = start"
            endLabels={endLabelIndexes}
            verticalAnnotation={cardsCutoffIdx > 0 ? {
              atIndex: cardsCutoffIdx,
              label: 'Cards data ends',
            } : undefined}
          />
        )}

        {lastCardsLabel && (
          <p class="text-2xs text-ink-gray-5 mt-3 italic">
            Card rails (CC eCom, CC POS, DC POS) shown through {lastCardsLabel}. NPCI does not publish monthly card volumes.
          </p>
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
              const isLast   = i === ranked.length - 1 && ranked.length > 1
              const isShrinking = rail.totalReturn < 0
              const isLoser  = isLast && isShrinking
              const streakAbs = Math.abs(rail.streak)
              const streakUp  = rail.streak > 0
              return (
                <div
                  key={rail.id}
                  class={`flex items-center gap-4 px-5 py-3.5 border-b border-outline-gray-1 last:border-0 ${
                    isWinner ? 'bg-surface-blue-1' : isLoser ? 'bg-surface-red-1' : ''
                  }`}
                >
                  {/* Rank */}
                  <div class="w-6 text-center">
                    <span class={`text-sm font-bold tabular-nums ${
                      isWinner ? 'text-ink-blue-2' : isLoser ? 'text-ink-red-3' : 'text-ink-gray-6'
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
                      <span class="text-2xs px-1.5 py-0.5 rounded border border-outline-red-1 bg-surface-red-1 text-ink-red-3 font-semibold">
                        SHRINKING {fmtPct(rail.totalReturn, 0)}
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
                      {rail.latestIndexed.toFixed(0)}
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
            <span class="text-2xs font-semibold text-ink-blue-2 tracking-wide">Cashfree read</span>
          </div>
          <div class="space-y-1">
            {(() => {
              const upi    = indexed.find(r => r.id === 'upi')
              const nach   = indexed.find(r => r.id === 'nach')
              const ccecom = indexed.find(r => r.id === 'ccecom')
              const dcpos  = indexed.find(r => r.id === 'dcpos')
              const lines: string[] = []
              const rankOf = (id: string) => {
                const i = ranked.findIndex(r => r.id === id)
                return i >= 0 ? i + 1 : 0
              }
              const nachRank   = rankOf('nach')
              const ccecomRank = rankOf('ccecom')
              if (nach?.hasData && nachRank > 0 && nachRank <= 3) {
                lines.push(`NACH is rank ${nachRank}. Your Subscriptions product is sitting on the fastest fee-bearing rail.`)
              }
              if (ccecom?.hasData && ccecomRank > 0 && ccecomRank <= 3) {
                lines.push(`CC eCommerce is rank ${ccecomRank}. MDR market growing ${fmtPct(ccecom.totalReturn, 0)} — gateway revenue ceiling expanding.`)
              }
              if (dcpos?.hasData && dcpos.totalReturn < -10) {
                lines.push(`DC POS down ${fmtPct(dcpos.totalReturn, 0)} this period. Merchants dropping card terminals. Onboard them to UPI QR.`)
              }
              if (upi?.hasData && nach?.hasData && upi.totalReturn > nach.totalReturn * 2) {
                lines.push(`UPI growing ${fmtPct(upi.totalReturn, 0)} — far outpacing cards. Payouts volume is accelerating.`)
              }
              if (lines.length === 0) lines.push('Watch which MDR-bearing rail ranks highest. That is where Cashfree should double down.')
              return lines.map((l, i) => (
                <div key={i} class="flex gap-2 text-sm text-ink-gray-8">
                  <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
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
