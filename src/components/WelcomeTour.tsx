/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks'
import Icon from './Icon'

interface WelcomeTourProps {
  open: boolean
  onClose: () => void
}

interface Step {
  eyebrow: string
  title: string
  body: string
  bullets?: string[]
}

const STEPS: Step[] = [
  {
    eyebrow: 'Welcome',
    title: 'India Payments Terminal',
    body: 'A dashboard that tracks India\'s payment rails — UPI, cards, NACH, BBPS — with a Cashfree lens on top of the numbers.',
    bullets: [
      'Source: RBI historical via CKAN, NPCI live for recent months.',
      'Built for operators, PMs, and analysts who care about the rail mix.',
    ],
  },
  {
    eyebrow: 'Step 1',
    title: 'Overview is your daily snapshot',
    body: 'The Overview page opens with one English paragraph that synthesises the month. Tiles + chart below it. Closing playbook tells you where to push.',
    bullets: [
      'Toggle Cashfree-lens vs Market-lens in the top right.',
      'Pick any month from the picker to see that month\'s story.',
    ],
  },
  {
    eyebrow: 'Step 2',
    title: 'The sidebar is your map',
    body: 'Each section answers a different question.',
    bullets: [
      'Rails — who is winning across all 6 rails (UPI vs CC vs NACH vs BBPS vs DC POS).',
      'Apps & Banks — leaderboards for UPI apps and card-issuing banks.',
      'Growth — what is accelerating, what is slowing.',
      'Year review — annual retrospective with the year\'s story.',
      'Data — raw monthly table, CSV download.',
      'Your numbers — type your own GMV, see your market share.',
    ],
  },
  {
    eyebrow: 'Step 3',
    title: 'One toggle flips every chart',
    body: 'The Volume / Value switch in the sidebar persists across every page. Volume = transaction count. Value = rupee amount. Pick whichever frame you think in.',
    bullets: [
      'Hover any "?" chip to see what a term means (UPI, NACH, MDR, indexed, YoY, etc.).',
      'Hit "Share feedback" in the sidebar footer if something looks wrong.',
    ],
  },
]

export default function WelcomeTour({ open, onClose }: WelcomeTourProps) {
  const [idx, setIdx] = useState(0)

  // Reset to step 0 every time the tour opens
  useEffect(() => { if (open) setIdx(0) }, [open])

  // ESC closes, body scroll lock while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  const step = STEPS[idx]
  const isLast = idx === STEPS.length - 1
  const isFirst = idx === 0

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div class="relative w-full max-w-md bg-surface-white border border-outline-gray-2 rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div class="flex items-center justify-between px-5 py-3 border-b border-outline-gray-1">
          <div class="flex items-center gap-2 text-2xs">
            <span class="text-ink-gray-5 tabular-nums">{idx + 1} / {STEPS.length}</span>
            <div class="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  class={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-ink-blue-2' : i < idx ? 'bg-ink-gray-7' : 'bg-surface-gray-2'}`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            class="w-6 h-6 flex items-center justify-center rounded text-ink-gray-6 hover:text-ink-gray-9 hover:bg-surface-gray-2 transition-colors cursor-pointer"
            aria-label="Close tour"
          >
            <span class="text-base leading-none">×</span>
          </button>
        </div>

        {/* Body */}
        <div class="p-6">
          <div class="text-2xs font-semibold uppercase tracking-widest text-ink-blue-2 mb-2">{step.eyebrow}</div>
          <h2 id="tour-title" class="text-base font-semibold text-ink-gray-9 mb-2 leading-snug">{step.title}</h2>
          <p class="text-sm text-ink-gray-7 leading-relaxed">{step.body}</p>
          {step.bullets && (
            <ul class="mt-3 space-y-1.5">
              {step.bullets.map((b, i) => (
                <li key={i} class="flex gap-2 text-xs text-ink-gray-7 leading-relaxed">
                  <span class="mt-1.5 w-1 h-1 rounded-full bg-ink-blue-2 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div class="flex items-center justify-between px-5 py-3 border-t border-outline-gray-1 bg-surface-gray-1">
          <button
            type="button"
            onClick={onClose}
            class="text-2xs text-ink-gray-6 hover:text-ink-gray-9 transition-colors cursor-pointer"
          >
            Skip
          </button>
          <div class="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setIdx(i => Math.max(0, i - 1))}
                class="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded text-ink-gray-7 hover:text-ink-gray-9 hover:bg-surface-gray-2 transition-colors cursor-pointer"
              >
                <Icon name="arrow-left" size={12} />
                Back
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={() => setIdx(i => Math.min(STEPS.length - 1, i + 1))}
                class="text-xs font-medium px-3 py-1.5 rounded bg-ink-blue-2 text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                Next
              </button>
            )}
            {isLast && (
              <button
                type="button"
                onClick={onClose}
                class="text-xs font-medium px-3 py-1.5 rounded bg-ink-blue-2 text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
