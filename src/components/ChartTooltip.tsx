interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  formatter?: (val: number, name: string) => string
}

export default function ChartTooltip({ active, payload, label, formatter }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2.5 shadow-xl text-xs min-w-[160px]">
      <p className="text-ink-gray-7 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-ink-gray-8">{p.name}</span>
          </span>
          <span className="font-medium text-ink-gray-9 tabular-nums">
            {formatter ? formatter(p.value, p.name) : p.value.toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  )
}
