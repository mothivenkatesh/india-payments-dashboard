/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks'
import { Chart, TOOLTIP_DEFAULTS, destroyChart } from './chartSetup'

interface DoughnutChartProps {
  labels: string[]
  data: number[]
  colors: string[]
  height?: number
  tooltipFormat?: (v: number) => string
  ariaLabel?: string
}

export default function DoughnutChart({ labels, data, colors, height = 180, tooltipFormat, ariaLabel }: DoughnutChartProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    destroyChart(ref.current)
    chartRef.current?.destroy()

    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderColor: 'rgba(15,23,42,0.8)', borderWidth: 2, hoverOffset: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: TOOLTIP_DEFAULTS.backgroundColor,
          borderColor: TOOLTIP_DEFAULTS.borderColor,
          borderWidth: TOOLTIP_DEFAULTS.borderWidth,
          titleColor: TOOLTIP_DEFAULTS.titleColor,
          bodyColor: TOOLTIP_DEFAULTS.bodyColor,
          padding: TOOLTIP_DEFAULTS.padding,
          cornerRadius: TOOLTIP_DEFAULTS.cornerRadius,
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw as number
                return ` ${tooltipFormat ? tooltipFormat(v) : v.toLocaleString('en-IN')}`
              },
            },
          },
        },
      },
    })
    return () => { chartRef.current?.destroy() }
  }, [JSON.stringify(data), JSON.stringify(labels)])

  return (
    <div class="relative w-full" /* one-ui-allow: chart height from the height prop */ style={{ height: `${height}px` }}>
      <canvas
        ref={ref}
        role="img"
        aria-label={ariaLabel ?? `Share breakdown: ${labels.join(', ')}`}
      />
    </div>
  )
}
