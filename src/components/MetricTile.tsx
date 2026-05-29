/** @jsxImportSource preact */
import Icon from './Icon'
import InfoChip from './InfoChip'
import clsx from 'clsx'

interface MetricTileProps {
  label: string
  value: string
  unit?: string
  sub?: string
  context?: string
  mom?: number
  yoy?: number
  pctRank?: number
  anomalyZ?: number
  loading?: boolean
  /** Glossary term key — renders a "?" chip next to the label. */
  term?: string
}

function Delta({ v, label }: { v: number; label: string }) {
  const pos = v >= 0
  return (
    <div class="flex flex-col items-center gap-0.5">
      <span class={clsx(
        'flex items-center gap-0.5 text-xs font-semibold tabular-nums leading-none',
        pos ? 'stat-positive' : 'stat-negative'
      )}>
        <Icon name={pos ? 'arrow-up' : 'arrow-down'} size={9} />
        {Math.abs(v).toFixed(1)}%
      </span>
      <span class="text-2xs text-ink-gray-5 uppercase tracking-wide leading-none">{label}</span>
    </div>
  )
}

export default function MetricTile({
  label, value, unit, sub, context, mom, yoy, pctRank, anomalyZ, loading, term
}: MetricTileProps) {
  const isAnomaly = anomalyZ !== undefined && Math.abs(anomalyZ) >= 2

  return (
    <div class="relative glass-card p-4 flex flex-col gap-3 overflow-hidden">
      {isAnomaly && (
        <span class="absolute top-2.5 right-2.5 text-2xs text-ink-amber-2 bg-surface-amber-1 border border-outline-amber-1 px-1.5 py-0.5 rounded-full">
          {Math.abs(anomalyZ).toFixed(1)}σ
        </span>
      )}

      <span class="text-2xs font-semibold text-ink-gray-5 uppercase tracking-widest pr-8 inline-flex items-center gap-1">
        {label}
        {term && <InfoChip term={term} />}
      </span>

      {loading ? (
        <div class="space-y-2 flex-1">
          <div class="h-7 w-28 bg-surface-gray-2 rounded animate-pulse" />
          <div class="h-3 w-20 bg-surface-gray-1 rounded animate-pulse" />
          <div class="h-3 w-full bg-surface-gray-1 rounded animate-pulse mt-2" />
        </div>
      ) : (
        <>
          <div class="flex-1">
            <div class="text-xl font-semibold text-ink-gray-9 tracking-tight leading-tight">{value}</div>
            {unit && <div class="text-2xs text-ink-gray-5 mt-0.5">{unit}</div>}
            {sub && <div class="text-2xs text-ink-gray-5 mt-0.5">{sub}</div>}
          </div>

          {(mom !== undefined || yoy !== undefined || pctRank !== undefined) && (
            <div class="flex items-end gap-3 pt-2 border-t border-outline-gray-1">
              {mom !== undefined && <Delta v={mom} label="MoM" />}
              {yoy !== undefined && <Delta v={yoy} label="YoY" />}
              {pctRank !== undefined && (
                <div class="flex flex-col gap-1 ml-auto min-w-16">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-2xs text-ink-gray-5 uppercase tracking-wide leading-none">vs history</span>
                    <span class={clsx(
                      'text-2xs font-semibold leading-none',
                      pctRank >= 90 ? 'text-ink-green-2' : pctRank >= 50 ? 'text-ink-blue-2' : 'text-ink-red-3'
                    )}>
                      {pctRank >= 95 ? 'Peak' : pctRank >= 75 ? 'High' : pctRank >= 50 ? 'Avg' : pctRank >= 25 ? 'Low' : 'Near bottom'}
                    </span>
                  </div>
                  <div class="h-1 rounded-full bg-surface-gray-2 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      style={{
                        width: `${pctRank}%`,
                        background: pctRank >= 90 ? 'var(--ink-green-2)' : pctRank >= 50 ? 'var(--ink-blue-2)' : 'var(--ink-red-3)'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {context && (
            <p class="text-2xs text-ink-gray-6 leading-snug border-t border-outline-gray-1 pt-2">
              {context}
            </p>
          )}
        </>
      )}
    </div>
  )
}
