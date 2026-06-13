/** @jsxImportSource preact */
import { useEffect, useLayoutEffect, useState } from 'preact/hooks'
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
  /** CSS selector for the element to highlight. Omit for a centred modal step. */
  target?: string
  /** Where to anchor the tooltip relative to the target. Auto picks based on space. */
  placement?: 'top' | 'bottom' | 'right' | 'left' | 'auto'
}

const STEPS: Step[] = [
  {
    eyebrow: 'Welcome',
    title: 'India Payments Terminal',
    body: 'A dashboard that tracks India\'s payment rails — UPI, cards, NACH, BBPS — with a Cashfree lens. Take 60 seconds; this will save you a lot of clicking.',
    bullets: [
      'Source: RBI historical via CKAN, NPCI live for recent months.',
      'Use the back / next buttons below. Press Esc to skip any time.',
    ],
  },
  {
    eyebrow: 'Step 1',
    title: 'Read this paragraph first',
    body: 'Every page that has data leads with one plain-English sentence that synthesises the month. If you only read one thing, this is it.',
    target: '[data-tour="narrative-hero"]',
    placement: 'bottom',
  },
  {
    eyebrow: 'Step 2',
    title: 'Each tile is a rail',
    body: 'Rail = a payment category. CC Gateway Market, UPI, Subscriptions (NACH), Bills (BBPS), DC POS. Each tile shows latest value, MoM, YoY, and a context line.',
    bullets: [
      'Hover the small "?" next to any label to see what the term means.',
      'YoY vs MoM are time comparisons — also defined in the glossary chips.',
    ],
    target: '[data-tour="metric-tiles"]',
    placement: 'top',
  },
  {
    eyebrow: 'Step 3',
    title: 'The MDR pool is the gateway market',
    body: 'These cards show how much Merchant Discount Rate (the fee merchants pay) the whole market generates per month. This is what payment gateways like Cashfree compete for.',
    target: '[data-tour="mdr-engine"]',
    placement: 'top',
  },
  {
    eyebrow: 'Step 4',
    title: 'The sidebar is your map',
    body: 'Each section answers a different question. Rails (cross-rail competition), Apps & Banks (leaderboards), Growth (what is accelerating), Year review (annual story), Data (raw table + CSV), Your numbers (BYO).',
    target: '[data-tour="sidebar-nav"]',
    placement: 'right',
  },
  {
    eyebrow: 'Done',
    title: 'You\'re set',
    body: 'Re-open this tour from the sidebar footer any time. Send feedback from the same place if anything looks off.',
    bullets: [
      'Click the "?" on any term to see what it means.',
      'Click any rail / app / bank in a leaderboard to drill down.',
    ],
    target: '[data-tour="sidebar-footer"]',
    placement: 'right',
  },
]

interface Rect { top: number; left: number; width: number; height: number }

function getRect(selector: string | undefined): Rect | null {
  if (!selector) return null
  const el = document.querySelector(selector) as HTMLElement | null
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

export default function WelcomeTour({ open, onClose }: WelcomeTourProps) {
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  // Reset to step 0 every time the tour opens
  useEffect(() => { if (open) setIdx(0) }, [open])

  // Scroll the target into view + measure on every step change
  useEffect(() => {
    if (!open) return
    const step = STEPS[idx]
    if (!step.target) { setRect(null); return }
    const el = document.querySelector(step.target) as HTMLElement | null
    if (!el) { setRect(null); return }
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    // Measure after the smooth-scroll settles
    const id = window.setTimeout(() => setRect(getRect(step.target)), 450)
    return () => window.clearTimeout(id)
  }, [open, idx])

  // Keep the rect synced on resize and on container scroll
  useLayoutEffect(() => {
    if (!open) return
    const step = STEPS[idx]
    if (!step.target) return
    const tick = () => setRect(getRect(step.target))
    window.addEventListener('resize', tick)
    window.addEventListener('scroll', tick, { capture: true })
    return () => {
      window.removeEventListener('resize', tick)
      window.removeEventListener('scroll', tick, { capture: true })
    }
  }, [open, idx])

  // ESC closes, body scroll lock while open
  useEffect(() => {
    if (!open) return
    document.body.classList.add('modal-open')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(STEPS.length - 1, i + 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  const step = STEPS[idx]
  const isLast = idx === STEPS.length - 1
  const isFirst = idx === 0
  const hasTarget = !!step.target && !!rect

  // Compute tooltip position. Default placement is bottom; flip if no room.
  const TIP_W = 360
  const TIP_GAP = 16
  let tipStyle: Record<string, string | number> = {}
  let arrowSide: 'top' | 'bottom' | 'right' | 'left' = 'top'

  if (hasTarget && rect) {
    const desired = step.placement ?? 'auto'
    const winW = window.innerWidth, winH = window.innerHeight
    const roomBelow = winH - (rect.top + rect.height)
    const roomAbove = rect.top
    const roomRight = winW - (rect.left + rect.width)
    const roomLeft  = rect.left

    let place: 'top' | 'bottom' | 'right' | 'left' = 'bottom'
    if (desired === 'auto') {
      if (roomBelow > 240) place = 'bottom'
      else if (roomAbove > 240) place = 'top'
      else if (roomRight > TIP_W + 40) place = 'right'
      else place = 'left'
    } else {
      place = desired
    }
    arrowSide = place === 'bottom' ? 'top' : place === 'top' ? 'bottom' : place === 'right' ? 'left' : 'right'

    if (place === 'bottom') {
      tipStyle = { top: rect.top + rect.height + TIP_GAP, left: Math.max(16, Math.min(winW - TIP_W - 16, rect.left + rect.width / 2 - TIP_W / 2)) }
    } else if (place === 'top') {
      tipStyle = { bottom: winH - rect.top + TIP_GAP, left: Math.max(16, Math.min(winW - TIP_W - 16, rect.left + rect.width / 2 - TIP_W / 2)) }
    } else if (place === 'right') {
      tipStyle = { left: rect.left + rect.width + TIP_GAP, top: Math.max(16, Math.min(winH - 280, rect.top + rect.height / 2 - 140)) }
    } else {
      tipStyle = { right: winW - rect.left + TIP_GAP, top: Math.max(16, Math.min(winH - 280, rect.top + rect.height / 2 - 140)) }
    }
  }

  return (
    <div class="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-title">

      {/* Spotlight cutout OR full backdrop */}
      {hasTarget && rect ? (
        <div
          aria-hidden="true"
          onClick={onClose}
          /* one-ui-allow: spotlight box measured from the target rect (live DOM) */
          style={{
            position: 'fixed',
            top: `${rect.top - 6}px`,
            left: `${rect.left - 6}px`,
            width: `${rect.width + 12}px`,
            height: `${rect.height + 12}px`,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
            borderRadius: '10px',
            border: '2px solid rgb(59, 130, 246)',
            pointerEvents: 'auto',
            transition: 'all 250ms ease',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          onClick={onClose}
          class="absolute inset-0 bg-black/45 backdrop-blur-sm"
        />
      )}

      {/* Tooltip card */}
      <div
        class="relative"
        /* one-ui-allow: tooltip position computed from the target rect / viewport */
        style={
          hasTarget
            ? { position: 'fixed' as const, width: `${TIP_W}px`, ...tipStyle }
            : { position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '420px', maxWidth: '90vw' }
        }
      >
        {/* Arrow */}
        {hasTarget && (
          <span
            aria-hidden="true"
            /* one-ui-allow: arrow offset depends on the computed placement side */
            style={{
              position: 'absolute',
              ...(arrowSide === 'top'    ? { top: '-6px',    left: '50%',   transform: 'translateX(-50%) rotate(45deg)' } : {}),
              ...(arrowSide === 'bottom' ? { bottom: '-6px', left: '50%',   transform: 'translateX(-50%) rotate(45deg)' } : {}),
              ...(arrowSide === 'left'   ? { left: '-6px',   top: '50%',    transform: 'translateY(-50%) rotate(45deg)' } : {}),
              ...(arrowSide === 'right'  ? { right: '-6px',  top: '50%',    transform: 'translateY(-50%) rotate(45deg)' } : {}),
              width: '12px',
              height: '12px',
              background: 'white',
              borderTop: '1px solid var(--outline-gray-2)',
              borderLeft: '1px solid var(--outline-gray-2)',
              zIndex: -1,
            }}
          />
        )}

        <div class="bg-surface-white border border-outline-gray-2 rounded-xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div class="flex items-center justify-between px-5 py-3 border-b border-outline-gray-1">
            <div class="flex items-center gap-2 text-2xs">
              <span class="text-ink-gray-5 tabular-nums">{idx + 1} / {STEPS.length}</span>
              <div class="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    class={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-blue-600' : i < idx ? 'bg-gray-600' : 'bg-surface-gray-2'}`}
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
          <div class="p-5">
            <div class="text-2xs font-semibold tracking-wide text-ink-blue-2 mb-2">{step.eyebrow}</div>
            <h2 id="tour-title" class="text-base font-semibold text-ink-gray-9 mb-2 leading-snug">{step.title}</h2>
            <p class="text-sm text-ink-gray-7 leading-relaxed">{step.body}</p>
            {step.bullets && (
              <ul class="mt-3 space-y-1.5">
                {step.bullets.map((b, i) => (
                  <li key={i} class="flex gap-2 text-xs text-ink-gray-7 leading-relaxed">
                    <span class="mt-1.5 w-1 h-1 rounded-full bg-blue-600 shrink-0" />
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
              class="text-2xs text-ink-gray-6 hover:text-ink-gray-9 transition-colors cursor-pointer px-2 py-1.5"
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
                  class="text-xs font-medium px-3 py-1.5 rounded bg-blue-700 text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Next
                </button>
              )}
              {isLast && (
                <button
                  type="button"
                  onClick={onClose}
                  class="text-xs font-medium px-3 py-1.5 rounded bg-blue-700 text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
