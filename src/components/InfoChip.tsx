/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { getEntry } from '../data/glossary'

interface InfoChipProps {
  /** Glossary key (e.g. 'upi', 'mdr', 'yoy'). */
  term: string
  /** Optional explicit text — overrides the glossary lookup. */
  text?: string
  /** Optional explicit headline — overrides the glossary entry's `term`. */
  label?: string
}

const TIP_W = 256

/**
 * InfoChip — small "?" icon that surfaces a glossary definition on hover or click.
 * The tooltip is fixed-positioned from the button rect so it escapes any
 * overflow-hidden ancestor (e.g. MetricTile) and clamps to the viewport.
 * Click pins the tooltip and reveals the long explainer. Esc closes it.
 */
export default function InfoChip({ term, text, label }: InfoChipProps) {
  const entry = getEntry(term)
  const headline = label ?? entry?.term ?? term
  const short = text ?? entry?.short ?? ''
  const long = entry?.long

  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const visible = open || hover

  // Compute a fixed position from the button rect, clamped horizontally to the viewport.
  useLayoutEffect(() => {
    if (!visible) return
    const compute = () => {
      const r = btnRef.current?.getBoundingClientRect()
      if (!r) return
      const below = r.bottom + 170 < window.innerHeight || r.top < 170
      const left = Math.max(12, Math.min(window.innerWidth - TIP_W - 12, r.left + r.width / 2 - TIP_W / 2))
      const top = below ? r.bottom + 6 : r.top - 6
      setPos({ top, left, below })
    }
    compute()
    window.addEventListener('scroll', compute, { capture: true })
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute, { capture: true })
      window.removeEventListener('resize', compute)
    }
  }, [visible])

  // Esc + click-outside to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  if (!short) return null

  return (
    <span class="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-label={`What is ${headline}?`}
        class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-surface-gray-2 border border-outline-gray-2 text-ink-gray-6 hover:text-ink-gray-9 hover:bg-surface-gray-3 transition-colors cursor-help align-middle"
        style={{ fontSize: '9px', lineHeight: '1', fontWeight: 700 }}
      >
        ?
      </button>
      {visible && pos && (
        <span
          role="tooltip"
          class="fixed z-50 p-3 rounded-lg bg-surface-white border border-outline-gray-2 shadow-lg pointer-events-none normal-case tracking-normal whitespace-normal"
          style={{
            top: pos.below ? `${pos.top}px` : 'auto',
            bottom: pos.below ? 'auto' : `${window.innerHeight - pos.top}px`,
            left: `${pos.left}px`,
            width: `${TIP_W}px`,
            maxWidth: 'calc(100vw - 24px)',
            textTransform: 'none',
            letterSpacing: 'normal',
            whiteSpace: 'normal',
          }}
        >
          <span class="block text-2xs font-semibold text-ink-blue-2 mb-1" style={{ overflowWrap: 'anywhere' }}>{headline}</span>
          <span class="block text-xs text-ink-gray-8 leading-relaxed" style={{ overflowWrap: 'anywhere' }}>{short}</span>
          {long && (
            <span class="block text-2xs text-ink-gray-6 leading-relaxed mt-2" style={{ overflowWrap: 'anywhere' }}>{long}</span>
          )}
        </span>
      )}
    </span>
  )
}
