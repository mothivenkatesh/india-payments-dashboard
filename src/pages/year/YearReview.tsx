/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
import { useRBIMonthly } from '../../hooks/useRBIData'
import LineChart from '../../components/charts/LineChart'
import InfoChip from '../../components/InfoChip'
import type { RBIMonthly } from '../../api/rbiDaily'

// ── Formatters ──────────────────────────────────────────────────────────────
const fmtCr = (v: number) =>
  v >= 100000 ? `₹${(v/100000).toFixed(2)}L Cr` :
  v >= 1000   ? `₹${(v/1000).toFixed(1)}K Cr`  :
                `₹${v.toFixed(0)} Cr`
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`

interface RailSummary {
  id: string
  label: string
  color: string
  yearTotal: number
  yearMonthCount: number
  prevYearTotal: number
  prevYearMonthCount: number
  yoy: number | null
  start: number
  end: number
  growth: number | null
  monthly: number[]
  monthLabels: string[]
}

const RAILS = [
  { id: 'upi',    label: 'UPI',          color: '#3B82F6', get: (m: RBIMonthly) => m.upiVal       },
  { id: 'ccecom', label: 'CC eCommerce', color: '#8B5CF6', get: (m: RBIMonthly) => m.ccEcomVal    },
  { id: 'nach',   label: 'NACH',         color: '#10B981', get: (m: RBIMonthly) => m.nachDebitVal },
  { id: 'bbps',   label: 'BBPS',         color: '#F59E0B', get: (m: RBIMonthly) => m.bbpsVal      },
  { id: 'ccpos',  label: 'CC POS',       color: '#6366F1', get: (m: RBIMonthly) => m.ccPosVal     },
  { id: 'dcpos',  label: 'DC POS',       color: '#EF4444', get: (m: RBIMonthly) => m.dcPosVal     },
] as const

function summarise(year: number, months: RBIMonthly[]): RailSummary[] {
  return RAILS.map(rail => {
    const yearMonths = months.filter(m => m.date.startsWith(String(year)) && rail.get(m) > 0)
    const prevYearMonths = months.filter(m => m.date.startsWith(String(year - 1)) && rail.get(m) > 0)
    const yearTotal = yearMonths.reduce((s, m) => s + rail.get(m), 0)
    const prevYearTotal = prevYearMonths.reduce((s, m) => s + rail.get(m), 0)
    // YoY uses monthly averages so partial coverage doesn't distort the comparison.
    // Suppress YoY when current-year coverage is < 3 months — too thin to be meaningful.
    const yearAvg = yearMonths.length > 0 ? yearTotal / yearMonths.length : 0
    const prevAvg = prevYearMonths.length > 0 ? prevYearTotal / prevYearMonths.length : 0
    const yoy = prevAvg > 0 && yearMonths.length >= 3 ? ((yearAvg - prevAvg) / prevAvg) * 100 : null
    const start = yearMonths[0] ? rail.get(yearMonths[0]) : 0
    const end = yearMonths[yearMonths.length - 1] ? rail.get(yearMonths[yearMonths.length - 1]) : 0
    const growth = start > 0 ? ((end - start) / start) * 100 : null
    return {
      id: rail.id, label: rail.label, color: rail.color,
      yearTotal, yearMonthCount: yearMonths.length,
      prevYearTotal, prevYearMonthCount: prevYearMonths.length,
      yoy,
      start, end, growth,
      monthly: yearMonths.map(m => rail.get(m)),
      monthLabels: yearMonths.map(m => m.label),
    }
  })
}

function narrative(year: number, summary: RailSummary[]): string {
  const upi = summary.find(r => r.id === 'upi')
  const ccecom = summary.find(r => r.id === 'ccecom')
  const nach = summary.find(r => r.id === 'nach')
  const bbps = summary.find(r => r.id === 'bbps')
  const dcpos = summary.find(r => r.id === 'dcpos')

  const grew = summary.filter(r => r.yearTotal > 0).slice().sort((a, b) => (b.yoy ?? -Infinity) - (a.yoy ?? -Infinity))
  const fastest = grew[0]
  const slowest = grew[grew.length - 1]

  const hasFull = (r: RailSummary | undefined) => !!r && r.yearMonthCount >= 3 && r.yoy !== null
  const parts: string[] = []
  if (upi && upi.yearTotal > 0) {
    parts.push(
      `In ${year}, India's UPI ecosystem cleared ${fmtCr(upi.yearTotal)}` +
      (hasFull(upi) ? `, ${upi.yoy! >= 0 ? 'up' : 'down'} ${Math.abs(upi.yoy!).toFixed(0)}% vs ${year - 1} on a monthly-average basis.` : '.')
    )
  }
  if (hasFull(ccecom) && hasFull(nach)) {
    parts.push(
      `The MDR-bearing rails kept growing — CC eCommerce ran at ${fmtCr(ccecom!.yearTotal / ccecom!.yearMonthCount)}/mo (${fmtPct(ccecom!.yoy!)} YoY) and NACH at ${fmtCr(nach!.yearTotal / nach!.yearMonthCount)}/mo (${fmtPct(nach!.yoy!)} YoY).`
    )
  }
  if (hasFull(bbps) && bbps!.yoy! > 20) {
    parts.push(`BBPS broke out — ${fmtPct(bbps!.yoy!)} YoY, the bill-payments shift accelerating.`)
  }
  if (hasFull(dcpos) && dcpos!.yoy! < -5) {
    parts.push(`DC POS contracted ${fmtPct(dcpos!.yoy!)} — merchants migrating off card terminals.`)
  }
  const ranked = summary.filter(r => r.yearMonthCount >= 3 && r.yoy !== null).slice().sort((a, b) => (b.yoy!) - (a.yoy!))
  if (ranked.length >= 2) {
    parts.push(`Fastest mover: ${ranked[0].label} at ${fmtPct(ranked[0].yoy!)}. Slowest: ${ranked[ranked.length - 1].label} at ${fmtPct(ranked[ranked.length - 1].yoy!)}.`)
  }
  return parts.join(' ')
}

export default function YearReview() {
  const { months, isLoading } = useRBIMonthly()
  const years = useMemo(() => {
    const set = new Set(months.map(m => parseInt(m.date.slice(0, 4))))
    return Array.from(set).sort((a, b) => b - a)
  }, [months])
  const defaultYear = useMemo(() => {
    // Most recent year with at least 6 months of data
    for (const y of years) {
      if (months.filter(m => m.date.startsWith(String(y))).length >= 6) return y
    }
    return years[0] ?? new Date().getFullYear() - 1
  }, [years, months])
  const [year, setYear] = useState<number | null>(null)
  const selectedYear = year ?? defaultYear

  const summary = useMemo(() => summarise(selectedYear, months), [selectedYear, months])
  const story = useMemo(() => narrative(selectedYear, summary), [selectedYear, summary])

  // KPI top row: 4 headline metrics
  const upi = summary.find(r => r.id === 'upi')!
  const ccecom = summary.find(r => r.id === 'ccecom')!
  const nach = summary.find(r => r.id === 'nach')!
  const bbps = summary.find(r => r.id === 'bbps')!

  return (
    <div class="space-y-6 max-w-7xl">

      {/* Header + year selector */}
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-2xs font-semibold uppercase tracking-widest text-ink-gray-5 mb-1">Year review</div>
          <h1 class="text-xl font-semibold text-ink-gray-9 leading-snug">{selectedYear} in India payments</h1>
          <p class="text-xs text-ink-gray-6 mt-1">The year-on-year picture across UPI, cards, NACH, and BBPS.</p>
        </div>
        <div class="flex items-center gap-1 bg-surface-gray-1 border border-outline-gray-2 rounded-lg p-0.5 shrink-0">
          {years.slice(0, 5).map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              class={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer tabular-nums ${
                selectedYear === y
                  ? 'bg-surface-white text-ink-gray-9 shadow-sm border border-outline-gray-2'
                  : 'text-ink-gray-6 hover:text-ink-gray-8'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Narrative paragraph */}
      {!isLoading && story && (
        <div class="glass-card p-5">
          <p class="text-sm text-ink-gray-8 leading-relaxed">{story}</p>
        </div>
      )}

      {/* 4 headline KPIs */}
      {!isLoading && (
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { rail: upi,    sub: 'UPI yearly value' },
            { rail: ccecom, sub: 'CC eCommerce yearly value' },
            { rail: nach,   sub: 'NACH yearly value' },
            { rail: bbps,   sub: 'BBPS yearly value' },
          ].map(({ rail, sub }) => (
            <div key={rail.id} class="glass-card p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full shrink-0" style={{ background: rail.color }} />
                <span class="text-2xs font-semibold uppercase tracking-widest text-ink-gray-5">{rail.label}</span>
              </div>
              <div class="text-xl font-bold text-ink-gray-9 tracking-tight">{rail.yearTotal > 0 ? fmtCr(rail.yearTotal) : '—'}</div>
              <p class="text-2xs text-ink-gray-5 mt-0.5">
                {sub}
                {rail.yearMonthCount > 0 && rail.yearMonthCount < 12 && (
                  <span class="ml-1 text-ink-amber-2">· {rail.yearMonthCount} of 12 mo</span>
                )}
              </p>
              {rail.yoy !== null && (
                <p class={`text-xs font-medium mt-2 inline-flex items-center gap-1 ${rail.yoy >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                  {fmtPct(rail.yoy)}
                  <span class="text-ink-gray-5 font-normal">avg/mo vs {selectedYear - 1}</span>
                  <InfoChip term="yoy" />
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Per-rail small multiples */}
      {!isLoading && (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.filter(r => r.monthly.length > 0).map(rail => (
            <div key={rail.id} class="glass-card p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: rail.color }} />
                  <h2 class="text-sm font-medium text-ink-gray-9">{rail.label}</h2>
                </div>
                {rail.growth !== null && (
                  <span class={`text-xs font-medium ${rail.growth >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                    {fmtPct(rail.growth)} <span class="text-ink-gray-5 font-normal">start → end of {selectedYear}</span>
                  </span>
                )}
              </div>
              <LineChart
                labels={rail.monthLabels}
                datasets={[{
                  label: rail.label,
                  data: rail.monthly,
                  borderColor: rail.color,
                  backgroundColor: 'transparent',
                  fill: false,
                  tension: 0.3,
                  pointRadius: 0,
                  borderWidth: 2,
                }]}
                height={140}
                tickFormat={v => v >= 100000 ? `${(v/100000).toFixed(1)}L` : `${(v/1000).toFixed(0)}K`}
              />
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div class="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} class="glass-card h-32 animate-pulse" />
          ))}
        </div>
      )}

    </div>
  )
}
