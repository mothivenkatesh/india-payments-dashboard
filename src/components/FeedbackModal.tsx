/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks'
import Icon from './Icon'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

// TODO: swap this for a Formspree / Web3Forms endpoint when ready.
// e.g. const ENDPOINT = 'https://formspree.io/f/xxxxxxx'
const ENDPOINT: string | null = null
const FALLBACK_EMAIL = 'mothi.venkatesh@cashfree.com'
const MAX_LEN = 2000

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [body, setBody] = useState('')
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus + ESC + body-scroll-lock
  useEffect(() => {
    if (!open) return
    document.body.classList.add('modal-open')
    const id = setTimeout(() => textareaRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('modal-open')
      window.removeEventListener('keydown', onKey)
      clearTimeout(id)
    }
  }, [open, onClose])

  // Reset state when reopened
  useEffect(() => {
    if (open) {
      setStatus('idle')
      setErrMsg('')
    }
  }, [open])

  if (!open) return null

  const pageContext = {
    path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '',
    when: new Date().toISOString(),
  }

  async function submit(e: Event) {
    e.preventDefault()
    if (honeypot) return // bot
    const trimmed = body.trim()
    if (!trimmed) { setErrMsg('Feedback is empty.'); return }
    if (trimmed.length > MAX_LEN) { setErrMsg(`Keep it under ${MAX_LEN} characters.`); return }

    setStatus('sending')
    setErrMsg('')
    const payload = {
      message: trimmed,
      email: email.trim() || null,
      path: pageContext.path,
      viewport: pageContext.viewport,
      when: pageContext.when,
      app: 'india-payments-dashboard',
    }

    if (ENDPOINT) {
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setStatus('sent')
        setBody(''); setEmail('')
      } catch (err) {
        setStatus('error')
        setErrMsg(err instanceof Error ? err.message : 'Network error.')
      }
      return
    }

    // mailto: fallback — no backend configured
    const subject = `Feedback · ${pageContext.path}`
    const lines = [
      trimmed,
      '',
      '---',
      `Page: ${pageContext.path}`,
      `Viewport: ${pageContext.viewport}`,
      `When: ${pageContext.when}`,
      email ? `From: ${email}` : '',
    ].filter(Boolean).join('\n')
    const href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`
    window.location.href = href
    setStatus('sent')
  }

  const remaining = MAX_LEN - body.length

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      {/* Backdrop */}
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div class="relative w-full max-w-lg bg-surface-white border border-outline-gray-2 rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-outline-gray-1">
          <h2 id="feedback-title" class="text-sm font-semibold text-ink-gray-9">Share feedback</h2>
          <button
            type="button"
            onClick={onClose}
            class="w-6 h-6 flex items-center justify-center rounded text-ink-gray-6 hover:text-ink-gray-9 hover:bg-surface-gray-2 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span class="text-base leading-none">×</span>
          </button>
        </div>

        {status === 'sent' ? (
          <div class="px-5 py-8 text-center">
            <div class="text-sm font-medium text-ink-gray-9 mb-1">Thanks.</div>
            <p class="text-xs text-ink-gray-6 mb-5">
              {ENDPOINT ? 'Got it. I read every one.' : 'Your mail client should have opened. If not, write to ' + FALLBACK_EMAIL + '.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              class="text-xs font-medium px-3 py-1.5 rounded border border-outline-gray-2 text-ink-gray-8 hover:bg-surface-gray-2 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} class="p-5 space-y-4">
            {/* Honeypot — hidden from humans */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onInput={e => setHoneypot((e.target as HTMLInputElement).value)}
              class="visually-hidden"
              aria-hidden="true"
            />

            <div>
              <label class="block text-xs font-medium text-ink-gray-8 mb-1.5">
                What's working? What's broken? What's missing?
              </label>
              <textarea
                ref={textareaRef}
                value={body}
                onInput={e => setBody((e.target as HTMLTextAreaElement).value)}
                rows={6}
                maxLength={MAX_LEN + 50}
                placeholder="Be specific. Page name, what you tried, what you expected, what happened."
                class="w-full px-3 py-2 text-sm text-ink-gray-9 placeholder-ink-gray-4 bg-surface-gray-1 border border-outline-gray-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-blue-1 focus:border-outline-blue-1 focus:bg-surface-white transition-colors resize-none"
              />
              <div class="flex items-center justify-between mt-1">
                <span class={`text-2xs ${remaining < 0 ? 'text-ink-red-3' : 'text-ink-gray-5'}`}>
                  {remaining} chars left
                </span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-ink-gray-8 mb-1.5">
                Email <span class="text-ink-gray-5 font-normal">— optional, so Mothi can reply</span>
              </label>
              <input
                type="email"
                value={email}
                onInput={e => setEmail((e.target as HTMLInputElement).value)}
                placeholder="you@company.com"
                class="w-full px-3 py-2 text-sm text-ink-gray-9 placeholder-ink-gray-4 bg-surface-gray-1 border border-outline-gray-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-blue-1 focus:border-outline-blue-1 focus:bg-surface-white transition-colors"
              />
            </div>

            <div class="text-2xs text-ink-gray-5 italic">
              Auto-captured: {pageContext.path} · {pageContext.viewport}
            </div>

            {errMsg && (
              <div class="text-2xs text-ink-red-3 px-3 py-2 bg-surface-red-1 border border-outline-red-1 rounded">
                {errMsg}
              </div>
            )}

            <div class="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                class="text-xs font-medium px-3 py-1.5 rounded text-ink-gray-7 hover:text-ink-gray-9 hover:bg-surface-gray-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'sending' || !body.trim()}
                class="text-xs font-medium px-3 py-1.5 rounded bg-blue-700 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              >
                {status === 'sending' ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
