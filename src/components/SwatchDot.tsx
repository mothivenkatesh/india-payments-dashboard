/** @jsxImportSource preact */

interface SwatchDotProps {
  /** Data-driven series / brand color. */
  color: string
  /** Dot size in px (default 8 = Tailwind w-2). */
  size?: number
  /** Square (rounded-sm) instead of a circle. */
  square?: boolean
  className?: string
}

/**
 * SwatchDot — a small legend / series swatch whose color comes from data.
 * Centralizes the one inline style the suite needs for this pattern, so the
 * data-driven color lives in a single annotated place instead of on every
 * legend row across the app.
 */
export default function SwatchDot({ color, size = 8, square = false, className = '' }: SwatchDotProps) {
  return (
    <span
      class={`inline-block shrink-0 ${square ? 'rounded-sm' : 'rounded-full'} ${className}`}
      /* one-ui-allow: data-driven series/brand color and size */
      style={{ background: color, width: `${size}px`, height: `${size}px` }}
    />
  )
}
