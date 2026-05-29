/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import Icon from '../../components/Icon'
import AppLogo from '../../components/AppLogo'
import MonthPicker from '../../components/MonthPicker'
import { useMyRail, type MyRailData } from '../../hooks/useMyRail'
import { useUPITimeSeries } from '../../hooks/useUpiData'
import { useCardsTimeSeries } from '../../hooks/useCardsData'
import clsx from 'clsx'

const fmtShare = (v: number) => v > 0 ? `${v.toFixed(2)}%` : '—'
const fmtVol = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}B` : `${v.toFixed(0)}M`
const fmtVal = (v: number) => v >= 100000 ? `₹${(v/100000).toFixed(2)}L Cr` : v >= 1000 ? `₹${(v/1000).toFixed(1)}K Cr` : `₹${v} Cr`

function Field({
  label, value, onChange, unit, placeholder
}: {
  label: string; value: string
  onChange: (v: string) => void; unit?: string; placeholder?: string
}) {
  return (
    <div class="space-y-1">
      <label class="block text-xs font-medium text-ink-gray-7">{label}{unit && <span class="text-ink-gray-5 font-normal ml-1">({unit})</span>}</label>
      <input
        type="text"
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder ?? '0'}
        class="w-full bg-surface-gray-1 border border-outline-gray-2 rounded-lg px-3 py-2 text-sm text-ink-gray-9 placeholder:text-ink-gray-5 focus:outline-none focus:border-outline-blue-1 transition-colors"
      />
    </div>
  )
}

function ShareBar({ mine, total, label, color }: { mine: number; total: number; label: string; color: string }) {
  const pct = total > 0 ? (mine / total) * 100 : 0
  const marketPct = 100 - pct
  return (
    <div class="space-y-1.5">
      <div class="flex justify-between text-xs">
        <span class="text-ink-gray-7">{label}</span>
        <span class="font-semibold" style={{ color }}>{fmtShare(pct)} of market</span>
      </div>
      <div class="h-2 bg-surface-gray-1 rounded-full overflow-hidden flex">
        <div class="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <div class="flex justify-between text-2xs text-ink-gray-5">
        <span>You: {fmtShare(pct)}</span>
        <span>Rest of market: {fmtShare(Math.max(0, marketPct))}</span>
      </div>
    </div>
  )
}

function GrowthVsMarket({ myMoM, mktMoM, label }: { myMoM: number | null; mktMoM: number | null; label: string }) {
  if (myMoM === null || mktMoM === null) return null
  const outpacing = myMoM > mktMoM
  const diff = myMoM - mktMoM
  return (
    <div class="glass-card p-4 space-y-2">
      <p class="text-2xs text-ink-gray-6 tracking-wide">{label} — You vs Market</p>
      <div class="flex items-end gap-4">
        <div>
          <p class={clsx('text-2xl font-bold', myMoM >= 0 ? 'text-ink-green-2' : 'text-ink-red-3')}>
            {myMoM >= 0 ? '+' : ''}{myMoM.toFixed(1)}%
          </p>
          <p class="text-2xs text-ink-gray-6 mt-0.5">your MoM</p>
        </div>
        <div class="text-ink-gray-5 text-lg pb-1">vs</div>
        <div>
          <p class={clsx('text-2xl font-bold', mktMoM >= 0 ? 'text-ink-gray-8' : 'text-ink-red-3/60')}>
            {mktMoM >= 0 ? '+' : ''}{mktMoM.toFixed(1)}%
          </p>
          <p class="text-2xs text-ink-gray-6 mt-0.5">market MoM</p>
        </div>
        <div class="ml-auto text-right">
          <p class={clsx('text-sm font-semibold', outpacing ? 'text-ink-green-2' : 'text-ink-red-3')}>
            {outpacing ? 'Outpacing' : 'Lagging'} by {Math.abs(diff).toFixed(1)}pp
          </p>
          <p class="text-2xs text-ink-gray-6 mt-0.5">
            {outpacing ? 'You grow faster than the ecosystem' : 'Ecosystem grows faster than you'}
          </p>
        </div>
      </div>
    </div>
  )
}

const MONTHS = [
  '2025-01','2025-02','2025-03','2025-04','2025-05','2025-06',
  '2025-07','2025-08','2025-09','2025-10','2025-11','2025-12',
  '2026-01','2026-02','2026-03',
]
const MONTH_LABELS: Record<string, string> = {
  '2025-01':'Jan 2025','2025-02':'Feb 2025','2025-03':'Mar 2025','2025-04':'Apr 2025','2025-05':'May 2025','2025-06':'Jun 2025',
  '2025-07':'Jul 2025','2025-08':'Aug 2025','2025-09':'Sep 2025','2025-10':'Oct 2025','2025-11':'Nov 2025','2025-12':'Dec 2025',
  '2026-01':'Jan 2026','2026-02':'Feb 2026','2026-03':'Mar 2026',
}

export default function MyRail() {
  const { data, save, clear, hasData } = useMyRail()
  const { data: upiRaw } = useUPITimeSeries()
  const upiPoints = upiRaw ?? []
  const { monthly: cardMonthly } = useCardsTimeSeries()

  const [form, setForm] = useState<MyRailData>(data)
  const [saved, setSaved] = useState(false)

  const f = (field: keyof MyRailData) => (v: string) => {
    const num = parseFloat(v.replace(/,/g, '')) || 0
    setForm(prev => ({ ...prev, [field]: field === 'company' || field === 'month' ? v : num }))
  }

  const handleSave = () => {
    save(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Find matching market month
  const mktUPI = upiPoints.find(p => p.date === data.month)
  const mktPrevUPI = upiPoints.find(p => {
    const [y, m] = data.month.split('-').map(Number)
    const prevDate = m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`
    return p.date === prevDate
  })
  const mktCards = cardMonthly.find(m => m.date === data.month)
  const mktPrevCards = (() => {
    if (!data.month) return undefined
    const [y, m] = data.month.split('-').map(Number)
    const prevDate = m === 1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`
    return cardMonthly.find(c => c.date === prevDate)
  })()

  const mktMoMVol = mktUPI && mktPrevUPI && mktPrevUPI.volume > 0
    ? ((mktUPI.volume - mktPrevUPI.volume) / mktPrevUPI.volume) * 100 : null
  const mktMoMVal = mktUPI && mktPrevUPI && mktPrevUPI.value > 0
    ? ((mktUPI.value - mktPrevUPI.value) / mktPrevUPI.value) * 100 : null
  const mktMoMCC = mktCards && mktPrevCards && mktPrevCards.ccTotalSpend > 0
    ? ((mktCards.ccTotalSpend - mktPrevCards.ccTotalSpend) / mktPrevCards.ccTotalSpend) * 100 : null

  // My MoM — need previous month's stored data (we don't store history, so skip for now)
  // Show shares only
  const upiVolShare = mktUPI && data.upiVolume > 0 ? (data.upiVolume / mktUPI.volume) * 100 : 0
  const upiValShare = mktUPI && data.upiValue > 0 ? (data.upiValue / mktUPI.value) * 100 : 0
  const ccShare = mktCards && data.ccSpend > 0 ? (data.ccSpend / mktCards.ccTotalSpend) * 100 : 0
  const dcShare = mktCards && data.dcSpend > 0 ? (data.dcSpend / mktCards.dcTotalSpend) * 100 : 0

  // Volume you "should have" if growing at market rate
  const expectedVolIfMarket = mktPrevUPI && data.upiVolume > 0 && mktMoMVol !== null
    ? data.upiVolume / (1 + mktMoMVol / 100) * (1 + mktMoMVol / 100) : null
  // (this would need previous month's own data — show market context instead)

  return (
    <div class="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 class="text-xl font-semibold text-ink-gray-9">My Rail</h1>
        <p class="text-xs text-ink-gray-6 mt-0.5">
          Your numbers. Market context. Know if you are gaining or losing share.
        </p>
      </div>

      {/* Input form */}
      <div class="glass-card p-5 space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-xs font-medium text-ink-gray-7">Company</label>
            <input
              type="text"
              value={form.company}
              onInput={(e) => setForm(prev => ({ ...prev, company: (e.target as HTMLInputElement).value }))}
              placeholder="e.g. Razorpay, Pine Labs, Cashfree"
              class="w-full bg-surface-gray-1 border border-outline-gray-2 rounded-lg px-3 py-2 text-sm text-ink-gray-9 placeholder:text-ink-gray-5 focus:outline-none focus:border-outline-blue-1 transition-colors"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-medium text-ink-gray-7">Month</label>
            <MonthPicker
              options={[{ value: '', label: 'Select month' }, ...MONTHS.map(m => ({ value: m, label: MONTH_LABELS[m] }))]}
              value={form.month}
              onChange={(v) => setForm(prev => ({ ...prev, month: v }))}
            />
          </div>
        </div>

        <div class="border-t border-outline-gray-1 pt-4 space-y-3">
          <p class="text-2xs font-semibold text-ink-gray-5 tracking-wide">UPI</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Volume" unit="Mn txns" value={form.upiVolume > 0 ? String(form.upiVolume) : ''} onChange={f('upiVolume')} placeholder="e.g. 850" />
            <Field label="Value" unit="₹ Cr" value={form.upiValue > 0 ? String(form.upiValue) : ''} onChange={f('upiValue')} placeholder="e.g. 12400" />
          </div>
        </div>

        <div class="border-t border-outline-gray-1 pt-4 space-y-3">
          <p class="text-2xs font-semibold text-ink-gray-5 tracking-wide">Cards</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="CC Spend" unit="₹ Cr" value={form.ccSpend > 0 ? String(form.ccSpend) : ''} onChange={f('ccSpend')} placeholder="e.g. 3200" />
            <Field label="DC Spend" unit="₹ Cr" value={form.dcSpend > 0 ? String(form.dcSpend) : ''} onChange={f('dcSpend')} placeholder="e.g. 800" />
          </div>
        </div>

        <div class="flex items-center gap-3 border-t border-outline-gray-1 pt-4">
          <button
            onClick={handleSave}
            class="px-4 py-2 bg-surface-blue-1 hover:bg-surface-blue-2 border border-outline-blue-1 text-ink-blue-3 rounded-lg text-sm font-medium transition-colors"
          >
            {saved ? 'Saved' : 'Save & compare'}
          </button>
          {hasData && (
            <button onClick={clear} class="text-xs text-ink-gray-5 hover:text-ink-gray-7 transition-colors">
              Clear
            </button>
          )}
          <span class="text-2xs text-ink-gray-4 ml-auto">Stays in your browser. Never leaves your device.</span>
        </div>
      </div>

      {/* Results */}
      {hasData && data.month && (
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <AppLogo name={data.company} size={24} rounded="md" />
            <h2 class="text-sm font-semibold text-ink-gray-9">{data.company}</h2>
            <span class="text-2xs text-ink-gray-6">vs {MONTH_LABELS[data.month] ?? data.month} market</span>
            {!mktUPI && !mktCards && (
              <span class="text-2xs text-ink-amber-2 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                No market data for this month yet
              </span>
            )}
          </div>

          {/* Share bars */}
          {(upiVolShare > 0 || upiValShare > 0 || ccShare > 0 || dcShare > 0) && (
            <div class="glass-card p-5 space-y-5">
              <p class="text-2xs text-ink-gray-6 tracking-wide font-semibold">Your ecosystem share</p>
              {upiVolShare > 0 && mktUPI && (
                <ShareBar mine={data.upiVolume} total={mktUPI.volume} label={`UPI Volume — you: ${fmtVol(data.upiVolume)} / market: ${fmtVol(mktUPI.volume)}`} color="#3B82F6" />
              )}
              {upiValShare > 0 && mktUPI && (
                <ShareBar mine={data.upiValue} total={mktUPI.value} label={`UPI Value — you: ${fmtVal(data.upiValue * 100)} / market: ${fmtVal(mktUPI.value * 100)}`} color="#10B981" />
              )}
              {ccShare > 0 && mktCards && (
                <ShareBar mine={data.ccSpend} total={mktCards.ccTotalSpend} label={`CC Spend — you: ${fmtVal(data.ccSpend * 100)} / market: ${fmtVal(mktCards.ccTotalSpend * 100)}`} color="#8B5CF6" />
              )}
              {dcShare > 0 && mktCards && (
                <ShareBar mine={data.dcSpend} total={mktCards.dcTotalSpend} label={`DC Spend — you: ${fmtVal(data.dcSpend * 100)} / market: ${fmtVal(mktCards.dcTotalSpend * 100)}`} color="#F59E0B" />
              )}
            </div>
          )}

          {/* Market context for this month */}
          {(mktUPI || mktCards) && (
            <div class="glass-card p-5 space-y-3">
              <p class="text-2xs text-ink-gray-6 tracking-wide font-semibold">Market moved this in {MONTH_LABELS[data.month]}</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mktUPI && (
                  <>
                    <div class="space-y-0.5">
                      <p class="text-2xs text-ink-gray-6">Total UPI Volume</p>
                      <p class="text-sm font-semibold text-ink-gray-9">{fmtVol(mktUPI.volume)}</p>
                      {mktMoMVol !== null && <p class={clsx('text-2xs', mktMoMVol >= 0 ? 'text-ink-green-2' : 'text-ink-red-3')}>{mktMoMVol >= 0 ? '+' : ''}{mktMoMVol.toFixed(1)}% MoM</p>}
                    </div>
                    <div class="space-y-0.5">
                      <p class="text-2xs text-ink-gray-6">Total UPI Value</p>
                      <p class="text-sm font-semibold text-ink-gray-9">{fmtVal(mktUPI.value * 100)}</p>
                      {mktMoMVal !== null && <p class={clsx('text-2xs', mktMoMVal >= 0 ? 'text-ink-green-2' : 'text-ink-red-3')}>{mktMoMVal >= 0 ? '+' : ''}{mktMoMVal.toFixed(1)}% MoM</p>}
                    </div>
                  </>
                )}
                {mktCards && (
                  <>
                    <div class="space-y-0.5">
                      <p class="text-2xs text-ink-gray-6">Total CC Spend</p>
                      <p class="text-sm font-semibold text-ink-gray-9">{fmtVal(mktCards.ccTotalSpend * 100)}</p>
                      {mktMoMCC !== null && <p class={clsx('text-2xs', mktMoMCC >= 0 ? 'text-ink-green-2' : 'text-ink-red-3')}>{mktMoMCC >= 0 ? '+' : ''}{mktMoMCC.toFixed(1)}% MoM</p>}
                    </div>
                    <div class="space-y-0.5">
                      <p class="text-2xs text-ink-gray-6">Total DC Spend</p>
                      <p class="text-sm font-semibold text-ink-gray-9">{fmtVal(mktCards.dcTotalSpend * 100)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* What this means */}
          {(upiVolShare > 0 || ccShare > 0) && (
            <div class="glass-card p-4 border-l-2 border-outline-blue-1 space-y-2">
              <p class="text-2xs text-ink-gray-6 tracking-wide font-semibold text-ink-gray-6">What this means</p>
              <div class="space-y-1">
                {upiVolShare > 0 && (
                  <p class="text-sm text-ink-gray-8">
                    {data.company} moves <span class="text-ink-gray-9 font-semibold">{fmtShare(upiVolShare)}</span> of all UPI transactions in India.
                    {upiVolShare < 1 && ' Sub-1% — you are in growth territory. Market share to take.'}
                    {upiVolShare >= 1 && upiVolShare < 5 && ' Meaningful share. Every 1pp gain = millions of transactions.'}
                    {upiVolShare >= 5 && ' Large player. Ecosystem-level decisions affect you.'}
                  </p>
                )}
                {ccShare > 0 && mktCards && (
                  <p class="text-sm text-ink-gray-8">
                    <span class="text-ink-gray-9 font-semibold">{fmtShare(ccShare)}</span> of all CC spend runs through {data.company}.
                    {ccShare >= 10 && ` Top 3 territory. HDFC leads at ~28%, SBI at ~18%.`}
                    {ccShare < 10 && ccShare >= 2 && ` Mid-tier. Room to move into top-5 with enterprise push.`}
                    {ccShare < 2 && ` Early stage. Market is wide open.`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!hasData && (
        <div class="glass-card p-8 text-center">
          <Icon name="bar-chart" size={32} className="mx-auto mb-3 text-ink-gray-4" />
          <p class="text-ink-gray-6 text-sm">Enter your numbers above.</p>
          <p class="text-ink-gray-5 text-xs mt-1">See your share. Know if you are ahead or behind the market.</p>
        </div>
      )}
    </div>
  )
}
