/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks'
import { Chart, TOOLTIP_DEFAULTS, GRID_COLOR, TICK_COLOR, tickCb, destroyChart } from './chartSetup'
import type { ChartDataset } from 'chart.js'

interface BarChartProps {
  labels: string[]
  datasets: ChartDataset<'bar'>[]
  height?: number
  horizontal?: boolean
  tickFormat?: (v: number) => string
  stacked?: boolean
  ariaLabel?: string
}

export default function BarChart({ labels, datasets, height = 220, horizontal = false, tickFormat, stacked = false, ariaLabel }: BarChartProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    destroyChart(ref.current)
    chartRef.current?.destroy()

    const cb = tickFormat ? tickCb(tickFormat) : undefined

    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        animation: { duration: 500, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: datasets.length > 1, labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12 } },
          tooltip: TOOLTIP_DEFAULTS as never,
        },
        scales: {
          x: {
            stacked,
            ticks: { color: TICK_COLOR, font: { size: 10 }, maxRotation: 0, callback: !horizontal && cb ? cb : undefined },
            grid: { color: horizontal ? GRID_COLOR : 'transparent' },
            border: { color: 'transparent' },
          },
          y: {
            stacked,
            ticks: { color: TICK_COLOR, font: { size: 11 }, callback: horizontal && cb ? cb : undefined },
            grid: { color: horizontal ? 'transparent' : GRID_COLOR },
            border: { color: 'transparent' },
          },
        },
      },
    })
    return () => { chartRef.current?.destroy() }
  }, [JSON.stringify(labels), JSON.stringify(datasets.map(d => d.data)), stacked])

  return (
    <div class="relative w-full" /* one-ui-allow: chart height from the height prop */ style={{ height: `${height}px` }}>
      <canvas
        ref={ref}
        role="img"
        aria-label={ariaLabel ?? `Bar chart: ${datasets.map(d => d.label).filter(Boolean).join(', ') || labels.slice(0, 8).join(', ')}`}
      />
    </div>
  )
}
