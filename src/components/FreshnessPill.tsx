/** @jsxImportSource preact */
import { useState } from 'preact/hooks'

interface FreshnessPillProps {
  dataDate?: string
  lagDays?: number
  className?: string
}

export default function FreshnessPill({ dataDate, lagDays, className = '' }: FreshnessPillProps) {
  if (!dataDate) return null
  const [show, setShow] = useState(false)
  const fresh = lagDays !== undefined && lagDays <= 45
  const lagMonths = lagDays ? Math.round(lagDays / 30) : 0
  return (
    <div class="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        class={`inline-flex items-center gap-1.5 text-2xs text-ink-gray-6 bg-surface-gray-1 border border-outline-gray-2 rounded-full px-2.5 py-1 cursor-pointer ${className}`}
      >
        <span class={`w-1.5 h-1.5 rounded-full ${fresh ? 'bg-ink-green-2' : 'bg-ink-amber-2'}`} />
        Data: {dataDate}
        {lagDays !== undefined && <span class="text-ink-gray-5">· {lagDays}d lag</span>}
      </button>
      {show && (
        <div class="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border border-outline-gray-2 bg-surface-white shadow-lg p-3 text-left">
          <p class="text-xs font-medium text-ink-gray-9 mb-1">Why is the data {lagMonths} months old?</p>
          <p class="text-2xs text-ink-gray-6 leading-relaxed">
            RBI publishes digital payments data with a significant delay — typically 12 to 18 months after the reporting period. This is the most recent data available publicly.
          </p>
          <p class="text-2xs text-ink-gray-5 mt-2">
            Source: India Data Portal · CKAN API · RBI Daily Digital Payments dataset
          </p>
        </div>
      )}
    </div>
  )
}
