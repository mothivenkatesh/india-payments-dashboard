/** @jsxImportSource preact */
import { useState, useEffect, useRef } from 'preact/hooks'

interface Option {
  value: string
  label: string
}

interface MonthPickerProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export default function MonthPicker({ options, value, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [placeUp, setPlaceUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Flip the dropdown upward when there isn't room for it below the trigger.
  useEffect(() => {
    if (!open) return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const DROPDOWN_MAX = 280
    setPlaceUp(r.bottom + DROPDOWN_MAX > window.innerHeight && r.top > DROPDOWN_MAX)
  }, [open])

  return (
    <div ref={ref} class="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        class="flex items-center gap-1.5 h-7 px-2.5 rounded border border-outline-gray-2 bg-surface-white hover:bg-surface-gray-1 text-ink-gray-8 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-blue-1 focus:border-outline-blue-1"
      >
        <span>{selected?.label ?? value}</span>
        <svg
          class={`w-3.5 h-3.5 text-ink-gray-5 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
        >
          <path d="M4 6l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      {open && (
        <div class={`absolute right-0 ${placeUp ? 'bottom-full mb-1' : 'top-full mt-1'} z-50 w-40 max-h-64 overflow-y-auto rounded-lg border border-outline-gray-2 bg-surface-white shadow-lg py-1`}>
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              class={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                o.value === value
                  ? 'bg-surface-blue-1 text-ink-blue-2 font-medium'
                  : 'text-ink-gray-8 hover:bg-surface-gray-1'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
