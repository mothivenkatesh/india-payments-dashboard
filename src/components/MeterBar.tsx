/** @jsxImportSource preact */

interface MeterBarProps {
  /** Fill percentage (0-100); clamped to 100. */
  pct: number
  /** Fill color (default the suite blue token). */
  color?: string
  className?: string
}

/**
 * MeterBar — the fill element of a horizontal progress / share bar. Its width
 * and optional color come from data, so the single inline style is annotated
 * here once rather than repeated at every call site. Render it inside a track
 * element that provides the height (e.g. a rounded `h-2` container).
 */
export default function MeterBar({ pct, color = 'var(--ink-blue-2)', className = '' }: MeterBarProps) {
  return (
    <div
      class={`h-full rounded-full transition-all ${className}`}
      /* one-ui-allow: data-driven meter width and color */
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  )
}
