// chart.js/auto registers ALL controllers, elements, and plugins automatically.
// This avoids manual tree-shaking registration bugs (e.g. "doughnut is not a registered controller").
import { Chart } from 'chart.js/auto'

export const TOOLTIP_DEFAULTS = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  borderColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  titleColor: '#94A3B8',
  bodyColor: '#E2E8F0',
  padding: 10,
  cornerRadius: 8,
  titleFont: { size: 11 },
  bodyFont: { size: 12, weight: 500 },
} as const

export const GRID_COLOR = 'rgba(255,255,255,0.05)'
export const TICK_COLOR = '#475569'

// Tick callback wrapper: Chart.js passes (string | number), we want (number)
export const tickCb = (fn: (v: number) => string) =>
  (val: string | number) => fn(typeof val === 'number' ? val : parseFloat(val) || 0)

// Robustly destroy any chart instance attached to a canvas element.
// Handles Preact/prefresh HMR edge cases where Chart.getChart() returns null
// but an orphaned instance still holds the canvas.
export function destroyChart(canvas: HTMLCanvasElement) {
  Chart.getChart(canvas)?.destroy()
  for (const id in (Chart as any).instances) {
    const inst = (Chart as any).instances[id]
    if (inst?.canvas === canvas) {
      inst.destroy()
      break
    }
  }
}

export { Chart }
