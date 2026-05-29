/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks'
import { getEntry } from '../data/glossary'

interface InfoChipProps {
  /** Glossary key (e.g. 'upi', 'mdr', 'yoy'). */
  term: string
  /** Optional explicit text — overrides the glossary lookup. */
  text?: string
  /** Optional explicit headline — overrides the glossary entry's `term`. */
  label?: string
  /** Show below or above the chip. Defaults to "auto" (picks based on viewport). */
  position?: 'top' | 'bottom' | 'auto'
}

/**
 * InfoChip — small "?" icon that surfaces a glossary definition on hover or click.
 * Click toggles a pinned tooltip; hover shows it transiently. Esc closes it.
 */
export default function InfoChip({ term, text, label, position = 'auto' }: InfoChipProps) {
  const entry = getEntry(term)
  const headline = label ?? entry?.term ?? term
  const short = text ?? entry?.short ?? ''
  const long = entry?.long

  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const [placeBelow, setPlaceBelow] = useState(true)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Pick top vs bottom based on viewport room when opening
  useEffect(() => {
    if (!open && !hover) return
    if (position === 'top') return setPlaceBelow(false)
    if (position === 'bottom') return setPlaceBelow(true)
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    setPlaceBelow(rect.top < 180 || rect.bottom + 180 < window.innerHeight)
  }, [open, hover, position])

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

  const visible = open || hover

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
      {visible && (
        <span
          role="tooltip"
          class={`absolute z-40 ${placeBelow ? 'top-full mt-1.5' : 'bottom-full mb-1.5'} left-1/2 -translate-x-1/2 w-64 max-w-[80vw] p-3 rounded-lg bg-surface-white border border-outline-gray-2 shadow-lg pointer-events-none`}
        >
          <span class="block text-2xs font-semibold uppercase tracking-widest text-ink-blue-2 mb-1">{headline}</span>
          <span class="block text-xs text-ink-gray-8 leading-relaxed">{short}</span>
          {long && open && (
            <span class="block text-2xs text-ink-gray-6 leading-relaxed mt-2 pt-2 border-t border-outline-gray-1">{long}</span>
          )}
          {long && !open && (
            <span class="block text-2xs text-ink-gray-5 mt-2 italic">Click for more.</span>
          )}
        </span>
      )}
    </span>
  )
}
