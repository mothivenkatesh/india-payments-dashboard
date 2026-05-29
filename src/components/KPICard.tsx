/** @jsxImportSource preact */
import Icon from './Icon'
import Sparkline from './charts/Sparkline'
import clsx from 'clsx'

interface KPICardProps {
  label: string
  value: string
  sub?: string
  trend?: number
  icon: string
  accentClass?: string
  loading?: boolean
  sparkData?: number[]
  sparkColor?: string
}

export default function KPICard({ label, value, sub, trend, icon, accentClass = 'text-ink-blue-2', loading, sparkData, sparkColor = 'var(--ink-blue-2)' }: KPICardProps) {
  const pos = trend !== undefined && trend >= 0
  return (
    <div class="glass-card p-5 flex flex-col gap-2 overflow-hidden relative">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-ink-gray-5 tracking-wide">{label}</span>
        <span class={clsx('p-1.5 rounded bg-surface-gray-1 shrink-0', accentClass)}>
          <Icon name={icon} size={15} />
        </span>
      </div>
      {loading ? (
        <div class="space-y-2">
          <div class="h-7 w-28 bg-surface-gray-2 rounded animate-pulse" />
          <div class="h-4 w-16 bg-surface-gray-1 rounded animate-pulse" />
          <div class="h-7 w-full bg-surface-gray-1 rounded animate-pulse mt-1" />
        </div>
      ) : (
        <>
          <div class="text-2xl font-semibold text-ink-gray-9 leading-tight">{value}</div>
          <div class="flex items-center gap-2">
            {trend !== undefined && (
              <span class={clsx('flex items-center gap-0.5 text-xs font-medium', pos ? 'stat-positive' : 'stat-negative')}>
                <Icon name={pos ? 'arrow-up' : 'arrow-down'} size={11} />
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {sub && <span class="text-xs text-ink-gray-6">{sub}</span>}
          </div>
          {sparkData && sparkData.length >= 2 && (
            <div class="mt-1 -mx-1">
              <Sparkline data={sparkData} color={sparkColor} width={200} height={32} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
