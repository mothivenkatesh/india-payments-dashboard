/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks'
import { Chart, TOOLTIP_DEFAULTS, GRID_COLOR, TICK_COLOR, tickCb, destroyChart } from './chartSetup'
import type { ChartDataset } from 'chart.js'

interface LineChartProps {
  labels: string[]
  datasets: ChartDataset<'line'>[]
  height?: number
  tickFormat?: (v: number) => string
  y2TickFormat?: (v: number) => string
}

export default function LineChart({ labels, datasets, height = 200, tickFormat, y2TickFormat }: LineChartProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    destroyChart(ref.current)
    chartRef.current?.destroy()

    // Pre-build gradient fills from borderColor for datasets with fill:true
    const ctx2d = ref.current.getContext('2d')
    const enhancedDatasets = datasets.map(ds => {
      if (!ds.fill || !ds.borderColor || !ctx2d) return ds
      const color = ds.borderColor as string
      const grad = ctx2d.createLinearGradient(0, 0, 0, height)
      // Parse hex (#RRGGBB) or rgb/rgba
      const hex = color.startsWith('#') ? color : null
      const r = hex ? parseInt(hex.slice(1,3),16) : 59
      const g = hex ? parseInt(hex.slice(3,5),16) : 130
      const b = hex ? parseInt(hex.slice(5,7),16) : 246
      grad.addColorStop(0, `rgba(${r},${g},${b},0.22)`)
      grad.addColorStop(0.6, `rgba(${r},${g},${b},0.08)`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
      return { ...ds, backgroundColor: grad }
    })

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets: enhancedDatasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeInOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 16 } },
          tooltip: TOOLTIP_DEFAULTS as never,
        },
        scales: {
          x: {
            ticks: { color: TICK_COLOR, font: { size: 10 }, maxRotation: 0, maxTicksLimit: 8 },
            grid: { color: GRID_COLOR },
            border: { color: 'transparent' },
          },
          y: {
            position: 'left',
            ticks: { color: TICK_COLOR, font: { size: 10 }, callback: tickFormat ? tickCb(tickFormat) : undefined },
            grid: { color: GRID_COLOR },
            border: { color: 'transparent', dash: [4, 4] },
          },
          ...(y2TickFormat ? {
            y2: {
              position: 'right' as const,
              ticks: { color: TICK_COLOR, font: { size: 10 }, callback: tickCb(y2TickFormat) },
              grid: { display: false },
              border: { color: 'transparent' },
            },
          } : {}),
        },
      },
    })
    return () => { chartRef.current?.destroy() }
  }, [JSON.stringify(labels), JSON.stringify(datasets.map(d => d.data))])

  return (
    <div style={{ position: 'relative', height: `${height}px`, width: '100%' }}>
      <canvas ref={ref} />
    </div>
  )
}
