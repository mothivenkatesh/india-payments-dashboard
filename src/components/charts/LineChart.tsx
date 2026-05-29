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
  /** Dashed horizontal reference line at this y-value. */
  baselineAt?: number
  /** Label drawn at the right end of the baseline (e.g. "100 = start"). */
  baselineLabel?: string
  /** Dashed vertical reference line + label, anchored to a category x-index. */
  verticalAnnotation?: { atIndex: number; label: string }
  /** Dataset indexes whose end-of-line should be labelled with the dataset.label. */
  endLabels?: number[]
  /** Accessible description of the chart for screen readers. */
  ariaLabel?: string
}

export default function LineChart({ labels, datasets, height = 200, tickFormat, y2TickFormat, baselineAt, baselineLabel, verticalAnnotation, endLabels, ariaLabel }: LineChartProps) {
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

    const annotationPlugin = {
      id: 'lineAnnotations',
      afterDatasetsDraw(chart: Chart) {
        const ctx = chart.ctx
        const yScale: any = chart.scales.y
        const xScale: any = chart.scales.x
        if (!ctx || !yScale || !xScale) return

        if (typeof baselineAt === 'number') {
          const yPx = yScale.getPixelForValue(baselineAt)
          ctx.save()
          ctx.strokeStyle = 'rgba(148,163,184,0.45)'
          ctx.setLineDash([2, 4])
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(xScale.left, yPx)
          ctx.lineTo(xScale.right, yPx)
          ctx.stroke()
          ctx.setLineDash([])
          if (baselineLabel) {
            ctx.fillStyle = 'rgba(100,116,139,0.95)'
            ctx.font = '10px ui-sans-serif, system-ui, -apple-system, sans-serif'
            ctx.textAlign = 'right'
            ctx.textBaseline = 'bottom'
            ctx.fillText(baselineLabel, xScale.right - 4, yPx - 2)
          }
          ctx.restore()
        }

        if (verticalAnnotation) {
          const xPx = xScale.getPixelForValue(verticalAnnotation.atIndex)
          ctx.save()
          ctx.strokeStyle = 'rgba(148,163,184,0.5)'
          ctx.setLineDash([2, 4])
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(xPx, yScale.top)
          ctx.lineTo(xPx, yScale.bottom)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(100,116,139,0.95)'
          ctx.font = '10px ui-sans-serif, system-ui, -apple-system, sans-serif'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'top'
          ctx.fillText(verticalAnnotation.label, xPx + 4, yScale.top + 2)
          ctx.restore()
        }

        if (endLabels && endLabels.length) {
          ctx.save()
          ctx.font = '600 10px ui-sans-serif, system-ui, -apple-system, sans-serif'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          const placed: { x: number; y: number }[] = []
          for (const idx of endLabels) {
            const meta = chart.getDatasetMeta(idx)
            const ds = chart.data.datasets[idx]
            if (!meta?.data || !ds) continue
            const pts: any[] = meta.data as any[]
            const data: any[] = ds.data as any[]
            let lastIdx = -1
            for (let j = pts.length - 1; j >= 0; j--) {
              if (data[j] !== null && data[j] !== undefined) { lastIdx = j; break }
            }
            if (lastIdx < 0) continue
            const pt = pts[lastIdx]
            if (!pt) continue
            let y = pt.y
            for (const p of placed) {
              if (Math.abs(p.x - pt.x) < 30 && Math.abs(p.y - y) < 12) y = p.y + 14
            }
            placed.push({ x: pt.x, y })
            ctx.fillStyle = (ds.borderColor as string) || '#475569'
            ctx.fillText(String(ds.label ?? ''), pt.x + 6, y)
          }
          ctx.restore()
        }
      },
    }

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets: enhancedDatasets },
      plugins: [annotationPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeInOutQuart' },
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { right: endLabels && endLabels.length ? 64 : 0 } },
        plugins: {
          legend: endLabels && endLabels.length
            ? { display: false }
            : { labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 16 } },
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
      <canvas
        ref={ref}
        role="img"
        aria-label={ariaLabel ?? `Line chart: ${datasets.map(d => d.label).filter(Boolean).join(', ')}`}
      />
    </div>
  )
}
