/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import { useRBIMonthly } from '../../hooks/useRBIData'
import { useMyRail } from '../../hooks/useMyRail'
import MetricTile from '../../components/MetricTile'
import FreshnessPill from '../../components/FreshnessPill'
import LineChart from '../../components/charts/LineChart'
import Icon from '../../components/Icon'
import AppLogo from '../../components/AppLogo'
import InfoChip from '../../components/InfoChip'
import { percentileRank } from '../../utils/anomaly'
import MonthPicker from '../../components/MonthPicker'
import type { RBIMonthly } from '../../api/rbiDaily'

// ── Formatters ──────────────────────────────────────────────────────────────
const fmtCr  = (v: number) => v >= 100000 ? `₹${(v/100000).toFixed(2)}L Cr` : v >= 1000 ? `₹${(v/1000).toFixed(1)}K Cr` : `₹${v.toFixed(0)} Cr`
const fmtB   = (v: number) => v >= 1000 ? `${(v/1000).toFixed(2)}B` : `${v.toFixed(0)}M`
const fmtPct = (v: number | undefined, decimals = 1) => v !== undefined ? `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%` : '—'

function lagDays(dateStr: string): number {
  const [year, month] = dateStr.split('-').map(Number)
  return Math.round((Date.now() - new Date(year, month, 0).getTime()) / 86400000)
}

// ── MDR constants (PA-PG revenue model) ─────────────────────────────────────
const CC_MDR_RATE  = 0.0195  // 1.95% Cashfree standard MDR (promo 1.6% for new merchants)
const NACH_MDR_RATE = 0.004  // ~0.4% effective NACH mandate fee

// ── Narrative hero — synthesise the month into one English paragraph ───────
function buildNarrative(latest: RBIMonthly | undefined, prev: RBIMonthly | undefined, yago: RBIMonthly | undefined): string {
  if (!latest) return ''
  const fmtCrInline = (v: number) =>
    v >= 100000 ? `₹${(v/100000).toFixed(2)} L Cr` :
    v >= 1000   ? `₹${(v/1000).toFixed(1)}K Cr`   :
                  `₹${v.toFixed(0)} Cr`
  const fmtBInline = (v: number) => v >= 1000 ? `${(v/1000).toFixed(2)}B` : `${v.toFixed(0)}M`
  const pct = (a: number, b: number) => b > 0 ? ((a - b) / b) * 100 : null

  const upiMoM = prev ? pct(latest.upiVal,    prev.upiVal)    : null
  const ccYoY  = yago ? pct(latest.ccEcomVal, yago.ccEcomVal) : null
  const nachYoY = yago ? pct(latest.nachDebitVal, yago.nachDebitVal) : null
  const bbpsYoY = yago ? pct(latest.bbpsVal,  yago.bbpsVal)  : null

  const parts: string[] = []
  parts.push(
    `In ${latest.label}, India processed ${fmtBInline(latest.upiVol)} UPI transactions worth ${fmtCrInline(latest.upiVal)}` +
    (upiMoM !== null ? `, ${upiMoM >= 0 ? 'up' : 'down'} ${Math.abs(upiMoM).toFixed(1)}% from last month.` : '.')
  )

  const mdrLines: string[] = []
  if (latest.ccEcomVal > 0) {
    mdrLines.push(`CC eCommerce hit ${fmtCrInline(latest.ccEcomVal)}` + (ccYoY !== null ? ` (${ccYoY >= 0 ? '+' : ''}${ccYoY.toFixed(0)}% YoY)` : ''))
  }
  if (latest.nachDebitVal > 0) {
    mdrLines.push(`NACH expanded to ${fmtCrInline(latest.nachDebitVal)}` + (nachYoY !== null ? ` (${nachYoY >= 0 ? '+' : ''}${nachYoY.toFixed(0)}% YoY)` : ''))
  }
  if (latest.bbpsVal > 0 && bbpsYoY !== null && bbpsYoY > 30) {
    mdrLines.push(`BBPS continued its breakout at ${fmtCrInline(latest.bbpsVal)} (+${bbpsYoY.toFixed(0)}% YoY)`)
  }
  if (mdrLines.length > 0) {
    parts.push(`On the fee-bearing rails — ${mdrLines.join(', ')}.`)
  }

  const ccMDRPool = latest.ccEcomVal * CC_MDR_RATE
  const nachMDRPool = latest.nachDebitVal * NACH_MDR_RATE
  const totalPool = ccMDRPool + nachMDRPool
  if (totalPool > 0) {
    parts.push(`The MDR pool payable across the gateway market this month is ${fmtCrInline(totalPool)}.`)
  }

  return parts.join(' ')
}

// ── Rail insight engine — two modes ─────────────────────────────────────────
function buildInsights(latest: RBIMonthly | undefined, months: RBIMonthly[], mode: 'cashfree' | 'market'): string[] {
  if (!latest) return []
  const lines: string[] = []

  const ccMDRPool  = latest.ccEcomVal * CC_MDR_RATE
  const nachMDRPool = latest.nachDebitVal * NACH_MDR_RATE
  const onePpMDR   = (latest.ccEcomVal * 0.01 * CC_MDR_RATE) + (latest.nachDebitVal * 0.01 * NACH_MDR_RATE)

  if (mode === 'cashfree') {
    // CC eCommerce — MDR revenue math
    if (latest.yoyCCEcom !== undefined) {
      lines.push(
        `CC MDR pool: ${fmtCr(ccMDRPool)}/month, growing ${Math.abs(latest.yoyCCEcom).toFixed(0)}% YoY. ` +
        `1% market share = ${fmtCr(latest.ccEcomVal * 0.01 * CC_MDR_RATE)}/month. ` +
        `Every enterprise merchant at ₹10Cr CC/month = ₹19.5L MDR. One Click Checkout's 100M+ saved profiles is your conversion moat.`
      )
    }
    // NACH — Subscriptions revenue signal
    if (latest.yoyNACH !== undefined && latest.yoyNACH > 20) {
      lines.push(
        `NACH mandate pool: ${fmtCr(nachMDRPool)}/month, up ${latest.yoyNACH.toFixed(0)}% YoY. ` +
        `Fastest fee-bearing rail in India. Every SaaS, insurer, lender you onboard earns 0.4% on recurring GMV.`
      )
    }
    // BBPS — product gap, biggest opportunity signal
    if (months.length >= 13) {
      const yago = months[months.length - 13]
      const bbpsYoY = yago.bbpsVal > 0 ? ((latest.bbpsVal - yago.bbpsVal) / yago.bbpsVal) * 100 : undefined
      if (bbpsYoY !== undefined && bbpsYoY > 40) {
        lines.push(
          `BBPS: ${fmtCr(latest.bbpsVal)}/month, up ${bbpsYoY.toFixed(0)}% YoY. ` +
          `Cashfree Biller is live — this market is growing into you. Scale distribution before competitors catch up.`
        )
      }
    }
    // DC POS — merchant migration play
    if (latest.momDCPos !== undefined && latest.momDCPos < -1) {
      lines.push(
        `DC POS down ${Math.abs(latest.momDCPos).toFixed(1)}% MoM. ` +
        `Offline merchants abandoning terminals. Own the QR migration before Razorpay does.`
      )
    }
    // 1pp summary if no other signals fill the slot
    if (lines.length < 3) {
      lines.push(
        `1pp of CC+NACH market = ${fmtCr(onePpMDR)}/month in MDR. ` +
        `That's the revenue value of moving the share needle. Every merchant deal compounds here.`
      )
    }
  } else {
    // Market view — pure signals, no product names
    if (latest.yoyCCEcom !== undefined) {
      lines.push(
        `CC eCommerce: ${fmtCr(latest.ccEcomVal)}, ${latest.yoyCCEcom > 0 ? 'up' : 'down'} ${Math.abs(latest.yoyCCEcom).toFixed(0)}% YoY. ` +
        `Primary MDR-bearing rail for payment processors in India.`
      )
    }
    if (latest.yoyNACH !== undefined && latest.yoyNACH > 20) {
      lines.push(
        `NACH up ${latest.yoyNACH.toFixed(0)}% YoY. Recurring mandates are the fastest-growing fee rail. ` +
        `SaaS, insurance, and lending are driving adoption.`
      )
    }
    if (months.length >= 13) {
      const yago = months[months.length - 13]
      const bbpsYoY = yago.bbpsVal > 0 ? ((latest.bbpsVal - yago.bbpsVal) / yago.bbpsVal) * 100 : undefined
      if (bbpsYoY !== undefined && bbpsYoY > 40) {
        lines.push(
          `BBPS: ${fmtCr(latest.bbpsVal)}, up ${bbpsYoY.toFixed(0)}% YoY. ` +
          `Bill payments digitising across utilities, telecoms, and insurance.`
        )
      }
    }
    if (latest.yoyUpiVal !== undefined) {
      lines.push(
        `UPI cleared ${fmtCr(latest.upiVal)} this month, up ${latest.yoyUpiVal.toFixed(0)}% YoY. ` +
        `Dominates consumer volume but MDR is near zero.`
      )
    }
  }

  return lines.slice(0, 4)
}

export default function Pulse() {
  const { months, isLoading } = useRBIMonthly()
  const { data: myRail, hasData: hasMyRail } = useMyRail()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cashfree' | 'market'>('cashfree')

  // selected = picked month, or latest by default
  const selected = selectedDate
    ? months.find(m => m.date === selectedDate) ?? months[months.length - 1]
    : months[months.length - 1]

  const selectedIdx = selected ? months.indexOf(selected) : -1

  const lag = selected ? lagDays(selected.date) : undefined

  // Percentile ranks against all other months
  const hist = months.filter((_, i) => i !== selectedIdx)
  const ccEcomPct  = selected ? percentileRank(hist.map(m => m.ccEcomVal),    selected.ccEcomVal)    : undefined
  const upiValPct  = selected ? percentileRank(hist.map(m => m.upiVal),       selected.upiVal)       : undefined
  const nachPct    = selected ? percentileRank(hist.map(m => m.nachDebitVal), selected.nachDebitVal) : undefined
  const bbpsPct    = selected ? percentileRank(hist.map(m => m.bbpsVal),      selected.bbpsVal)      : undefined
  const dcPosPct   = selected ? percentileRank(hist.map(m => m.dcPosVal),     selected.dcPosVal)     : undefined

  // YoY: compare to same month 12 months prior
  const yago = selectedIdx >= 12 ? months[selectedIdx - 12] : undefined
  const pctChg = (a: number, b: number) => b > 0 ? ((a - b) / b) * 100 : undefined
  const ccEcomYoY  = selected && yago ? pctChg(selected.ccEcomVal,    yago.ccEcomVal)    : undefined
  const nachYoY    = selected && yago ? pctChg(selected.nachDebitVal, yago.nachDebitVal) : undefined
  const upiValYoY  = selected && yago ? pctChg(selected.upiVal,      yago.upiVal)       : undefined
  const bbpsYoY    = selected && yago ? pctChg(selected.bbpsVal,     yago.bbpsVal)      : undefined
  const dcPosYoY   = selected && yago ? pctChg(selected.dcPosVal,    yago.dcPosVal)     : undefined

  const insights = buildInsights(selected, months.slice(0, selectedIdx + 1), viewMode)

  // Narrative paragraph hero — state of the month in plain English
  const prevSelected = selectedIdx > 0 ? months[selectedIdx - 1] : undefined
  const story = buildNarrative(selected, prevSelected, yago)

  // ── MDR Revenue Model (PA-PG) ──────────────────────────────────────────────
  const ccMDRPool   = selected ? selected.ccEcomVal * CC_MDR_RATE : 0
  const nachMDRPool = selected ? selected.nachDebitVal * NACH_MDR_RATE : 0
  const totalMDRPool = ccMDRPool + nachMDRPool
  const onePpMDR    = selected
    ? (selected.ccEcomVal * 0.01 * CC_MDR_RATE) + (selected.nachDebitVal * 0.01 * NACH_MDR_RATE)
    : 0

  // NPCI months don't have CC/DC data — hide those tiles when selected
  const isNPCI = selected?.source === 'npci'

  // My Rail overlay
  const myRailMonth = hasMyRail ? months.find(m => m.date === myRail.month) : null
  const myCCShare = myRailMonth && myRail.ccSpend > 0
    ? (myRail.ccSpend / myRailMonth.ccTotalVal) * 100 : 0
  const myUPIShare = myRailMonth && myRail.upiValue > 0
    ? (myRail.upiValue / myRailMonth.upiVal) * 100 : 0

  // Chart shows 36 months ending at selected month
  const chartMonths = months.slice(Math.max(0, selectedIdx - 35), selectedIdx + 1)

  // Context strings
  const ccEcomContext = selected
    ? `MDR pool: ${fmtCr(ccMDRPool)}/month. ${ccEcomYoY !== undefined ? `Up ${ccEcomYoY.toFixed(0)}% YoY.` : ''} Core PG revenue market.`
    : undefined

  const upiContext = selected
    ? `High volume, near-zero MDR. ${upiValYoY !== undefined ? `Up ${upiValYoY.toFixed(0)}% YoY.` : ''} Success rate signal — every failed UPI txn is merchant churn risk.`
    : undefined

  const nachContext = selected
    ? `NACH MDR pool: ${fmtCr(nachMDRPool)}/month. ${nachYoY !== undefined ? `Up ${nachYoY.toFixed(0)}% YoY.` : ''} Subscriptions is the fastest fee rail you're on.`
    : undefined

  const dcContext = selected
    ? `${dcPosYoY !== undefined ? `Down ${Math.abs(dcPosYoY).toFixed(0)}% YoY.` : 'Declining.'} Terminal merchants migrating to QR. Migration window before Razorpay closes it.`
    : undefined

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">

      {/* Header */}
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-ink-gray-9">Pulse</h1>
          <p class="text-xs text-ink-gray-6 mt-0.5">India payments market. What it means for Cashfree.</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          {/* View mode toggle */}
          <div class="flex items-center gap-0.5 bg-surface-gray-1 border border-outline-gray-2 rounded-lg p-0.5">
            {(['cashfree', 'market'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                class={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  viewMode === m
                    ? 'bg-surface-white text-ink-gray-9 shadow-sm border border-outline-gray-2'
                    : 'text-ink-gray-6 hover:text-ink-gray-8'
                }`}
              >
                {m === 'cashfree' ? 'Cashfree' : 'Market'}
              </button>
            ))}
          </div>

          {!isLoading && months.length > 0 && (
            <MonthPicker
              value={selectedDate ?? months[months.length - 1].date}
              options={[...months].reverse().map(m => ({ value: m.date, label: m.label }))}
              onChange={setSelectedDate}
            />
          )}
          <FreshnessPill dataDate={selected?.label} lagDays={lag} />
        </div>
      </div>

      {/* Narrative hero — state of the month */}
      {!isLoading && story && (
        <div class="glass-card p-5" data-tour="narrative-hero">
          <p class="text-sm text-ink-gray-8 leading-relaxed">{story}</p>
        </div>
      )}
      {isLoading && (
        <div class="glass-card p-5 h-20 bg-surface-gray-1 animate-pulse rounded-xl" />
      )}

      {/* My Rail banner */}
      {hasMyRail && (
        <div class="glass-card p-4 border border-outline-blue-1 bg-surface-blue-1">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <AppLogo name={myRail.company} size={28} rounded="lg" />
              <div>
                <p class="text-sm font-medium text-ink-gray-9">{myRail.company} vs Market</p>
                <p class="text-2xs text-ink-gray-6">Your numbers overlaid on this month's data</p>
              </div>
            </div>
            <div class="flex items-center gap-4 text-xs">
              {myUPIShare > 0 && (
                <div class="text-center">
                  <p class="font-semibold text-ink-blue-2">{myUPIShare.toFixed(2)}%</p>
                  <p class="text-ink-gray-6">UPI market share</p>
                </div>
              )}
              {myCCShare > 0 && (
                <div class="text-center">
                  <p class="font-semibold text-ink-green-2">{myCCShare.toFixed(2)}%</p>
                  <p class="text-ink-gray-6">CC market share</p>
                </div>
              )}
              <a href="/myrail" class="flex items-center gap-1 text-ink-gray-6 hover:text-ink-gray-8 transition-colors">
                <Icon name="edit-2" size={12} />
                Edit
              </a>
            </div>
          </div>
        </div>
      )}


      {/* Intelligence digest — what this means for Cashfree */}
      {!isLoading && insights.length > 0 && (
        <div class="glass-card p-5">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="activity" size={14} className="text-ink-amber-2" />
            <span class="text-2xs font-semibold text-ink-amber-2 tracking-wide">
              {viewMode === 'cashfree' ? 'What this means for Cashfree' : 'Market signals'}
            </span>
          </div>
          <ul class="space-y-1.5">
            {insights.map((s, i) => {
              const dot = s.indexOf('. ')
              const head = dot > -1 ? s.slice(0, dot + 1) : s
              const rest = dot > -1 ? s.slice(dot + 2) : ''
              return (
                <li key={i} class="flex gap-2 text-sm text-ink-gray-8">
                  <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-ink-amber-2 shrink-0" />
                  <span>
                    <span class="font-medium">{head}</span>
                    {rest && <span class="text-ink-gray-6"> {rest}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {isLoading && <div class="glass-card p-4 h-20 bg-surface-gray-1 animate-pulse rounded-xl" />}

      {/* Rail metrics — row 1: fee-bearing rails */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" data-tour="metric-tiles">
        {isNPCI ? (
          <div class="glass-card p-4 flex flex-col gap-2 justify-center">
            <span class="text-2xs font-semibold text-ink-gray-5 tracking-wide">CC Gateway Market</span>
            <p class="text-xs text-ink-gray-5">RBI reports CC/DC data with ~45-day lag. Not yet available for this month.</p>
            <p class="text-2xs text-ink-gray-4">Switch to Jan 2025 for the last complete dataset.</p>
          </div>
        ) : (
          <MetricTile
            label="CC Gateway Market"
            term="ccecom"
            value={selected ? fmtCr(selected.ccEcomVal) : '—'}
            unit="online card processing"
            context={ccEcomContext}
            mom={selected?.momCCEcom}
            yoy={ccEcomYoY}
            pctRank={ccEcomPct}
            loading={isLoading}
          />
        )}
        <MetricTile
          label="UPI Value"
          term="upi"
          value={selected ? fmtCr(selected.upiVal) : '—'}
          unit={selected ? fmtB(selected.upiVol) + ' transactions' : 'transactions'}
          context={upiContext}
          mom={selected?.momUpiVal}
          yoy={upiValYoY}
          pctRank={upiValPct}
          loading={isLoading}
        />
        <MetricTile
          label="Subscriptions Market"
          term="nach"
          value={selected ? fmtCr(selected.nachDebitVal) : '—'}
          unit="NACH recurring mandates"
          context={nachContext}
          mom={selected?.momNACH}
          yoy={nachYoY}
          pctRank={nachPct}
          loading={isLoading}
        />
      </div>

      {/* Rail metrics — row 2: structural signals */}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricTile
          label="Bills & Utilities"
          term="bbps"
          value={selected ? fmtCr(selected.bbpsVal) : '—'}
          unit="BBPS transactions"
          context="Bharat Bill Pay. Utility billers, insurance, subscriptions. Early-mover advantage window."
          mom={selected?.momBBPS}
          yoy={bbpsYoY}
          pctRank={bbpsPct}
          loading={isLoading}
        />
        {isNPCI ? (
          <div class="glass-card p-4 flex flex-col gap-2 justify-center">
            <span class="text-2xs font-semibold text-ink-gray-5 tracking-wide">DC POS Swipes</span>
            <p class="text-xs text-ink-gray-5">RBI reports DC POS data with ~45-day lag. Not yet available for this month.</p>
          </div>
        ) : (
          <MetricTile
            label="DC POS Swipes"
            term="dcpos"
            value={selected ? fmtCr(selected.dcPosVal) : '—'}
            unit="offline merchant terminals"
            context={dcContext}
            mom={selected?.momDCPos}
            yoy={dcPosYoY}
            pctRank={dcPosPct}
            loading={isLoading}
          />
        )}
      </div>

      {/* Cross-rail trend — 3 years */}
      <div class="glass-card p-5">
        <div class="flex items-start justify-between mb-1">
          <div>
            <h2 class="text-sm font-medium text-ink-gray-9">Gateway Market Trend</h2>
            <p class="text-xs text-ink-gray-6 mt-0.5">CC eCommerce vs NACH vs DC POS. 36 months ending {selected?.label ?? ''}.</p>
          </div>
          <span class="text-2xs text-ink-gray-6 shrink-0">₹ Crore/month</span>
        </div>
        <div class="mt-4">
          {isLoading ? (
            <div class="h-56 bg-surface-gray-1 rounded animate-pulse" />
          ) : (
            <LineChart
              labels={chartMonths.map(m => m.label)}
              datasets={[
                { label: 'CC eCommerce', data: chartMonths.map(m => Math.round(m.ccEcomVal)), borderColor: '#8B5CF6', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2 },
                { label: 'CC POS',       data: chartMonths.map(m => Math.round(m.ccPosVal)),  borderColor: '#3B82F6', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
                { label: 'NACH Debit',   data: chartMonths.map(m => Math.round(m.nachDebitVal)), borderColor: '#10B981', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
                { label: 'DC POS',       data: chartMonths.map(m => Math.round(m.dcPosVal)),  borderColor: '#EF4444', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
              ]}
              height={230}
              tickFormat={v => `${v >= 100000 ? (v/100000).toFixed(1)+'L' : (v/1000).toFixed(0)+'K'}`}
            />
          )}
        </div>
      </div>

      {/* PG Revenue Engine */}
      {!isLoading && selected && (
        <div class={`grid gap-3 ${isNPCI ? 'grid-cols-2' : 'grid-cols-3'}`} data-tour="mdr-engine">
          {!isNPCI && (
            <div class="glass-card p-4">
              <p class="text-2xs font-semibold text-ink-gray-5 tracking-wide mb-2 inline-flex items-center gap-1">
                CC MDR Pool
                <InfoChip term="mdr_pool" />
              </p>
              <div class="text-xl font-bold text-ink-gray-9 tracking-tight">{fmtCr(ccMDRPool)}</div>
              <p class="text-2xs text-ink-gray-5 mt-0.5">per month · 1.95% on {fmtCr(selected.ccEcomVal)}</p>
              <p class="text-2xs text-ink-gray-6 mt-2 leading-snug">Total MDR payable by merchants to all PGs this month. This is the market you compete for.</p>
            </div>
          )}
          <div class="glass-card p-4">
            <p class="text-2xs font-semibold text-ink-gray-5 tracking-wide mb-2 inline-flex items-center gap-1">
              NACH MDR Pool
              <InfoChip term="mdr_pool" />
            </p>
            <div class="text-xl font-bold text-ink-gray-9 tracking-tight">{fmtCr(nachMDRPool)}</div>
            <p class="text-2xs text-ink-gray-5 mt-0.5">per month · ~0.4% on {fmtCr(selected.nachDebitVal)}</p>
            <p class="text-2xs text-ink-gray-6 mt-2 leading-snug">Fastest-growing fee rail. Every Subscriptions merchant compounds here monthly.</p>
          </div>
          <div class="glass-card p-4">
            <p class="text-2xs font-semibold text-ink-gray-5 tracking-wide mb-2">{isNPCI ? 'NACH 1pp = MDR' : '1pp = MDR/month'}</p>
            <div class="text-xl font-bold text-ink-gray-9 tracking-tight">{fmtCr(isNPCI ? selected.nachDebitVal * 0.01 * NACH_MDR_RATE : onePpMDR)}</div>
            <p class="text-2xs text-ink-gray-5 mt-0.5">{isNPCI ? 'per 1% NACH share gain' : 'per 1% share gain across CC + NACH'}</p>
            <p class="text-2xs text-ink-gray-6 mt-2 leading-snug">{isNPCI ? 'CC data pending RBI release. NACH MDR economics only for this month.' : 'Revenue value of moving the market share needle by one point. That\'s your BD team\'s unit economics.'}</p>
          </div>
        </div>
      )}

      {/* PG Playbook */}
      {!isLoading && selected && (
        <div class="glass-card overflow-hidden">
          <div class="px-5 py-3.5 border-b border-outline-gray-1 flex items-center gap-2">
            <span class="text-2xs font-semibold text-ink-gray-5 tracking-wide">PG Playbook</span>
            <span class="text-2xs text-ink-gray-5">· where to move the business this month</span>
          </div>
          <div class="divide-y divide-outline-gray-1">
            {[
              {
                rail: 'CC eCommerce',
                tag: 'DEFEND & GROW', tagColor: 'text-ink-blue-2', tagBg: 'bg-surface-blue-1 border-outline-blue-1',
                signal: `${fmtCr(ccMDRPool)}/month MDR pool${ccEcomYoY !== undefined ? `, up ${ccEcomYoY.toFixed(0)}% YoY` : ''}.`,
                action: `1pp share = ${fmtCr(onePpMDR * (ccMDRPool / totalMDRPool))}/month. Pitch One Click Checkout (100M+ saved profiles) as conversion advantage to ₹50Cr+ GMV merchants.`,
              },
              {
                rail: 'NACH — Subscriptions',
                tag: 'SCALE NOW', tagColor: 'text-ink-green-2', tagBg: 'bg-surface-green-1 border-outline-green-1',
                signal: `${fmtCr(nachMDRPool)}/month MDR pool${nachYoY !== undefined ? `, up ${nachYoY.toFixed(0)}% YoY` : ''}. Fastest fee rail.`,
                action: 'Every SaaS company, insurer, and lender needs recurring mandates. Pipeline opportunity is wide open.',
              },
              {
                rail: 'BBPS — Biller',
                tag: 'SCALE NOW', tagColor: 'text-ink-green-2', tagBg: 'bg-surface-green-1 border-outline-green-1',
                signal: `${fmtCr(selected.bbpsVal)}/month market${bbpsYoY !== undefined ? `, up ${bbpsYoY.toFixed(0)}% YoY` : ''}. Cashfree Biller is live.`,
                action: 'Utility billers, telcos, insurance moving fast. Push BBPS Biller harder — the market is growing into you.',
              },
              {
                rail: 'DC POS',
                tag: 'MIGRATE', tagColor: 'text-ink-gray-6', tagBg: 'bg-surface-gray-2 border-outline-gray-2',
                signal: `${dcPosYoY !== undefined ? `Down ${Math.abs(dcPosYoY).toFixed(0)}% YoY.` : 'Declining.'} Offline merchants abandoning card terminals.`,
                action: 'Push SoftPOS — turns any Android phone into a card terminal. No hardware cost. Own the migration before Razorpay does.',
              },
            ].map(({ rail, tag, tagColor, tagBg, signal, action }) => (
              <div key={rail} class="flex items-start gap-4 px-5 py-3.5">
                <div class="w-36 shrink-0 pt-0.5">
                  <p class="text-xs font-medium text-ink-gray-8">{rail}</p>
                  <span class={`inline-block mt-1 text-2xs font-semibold px-1.5 py-0.5 rounded border ${tagBg} ${tagColor}`}>{tag}</span>
                </div>
                <div class="flex-1 min-w-0 space-y-0.5">
                  <p class="text-xs text-ink-gray-7">{signal}</p>
                  <p class="text-2xs text-ink-gray-5">{action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Rail CTA */}
      {!hasMyRail && !isLoading && (
        <div class="glass-card p-5 flex items-center gap-4 border border-outline-gray-2">
          <div class="p-2.5 rounded-lg bg-surface-gray-1 shrink-0">
            <Icon name="bar-chart" size={20} className="text-ink-gray-6" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-ink-gray-9">Add Cashfree's numbers</p>
            <p class="text-xs text-ink-gray-6 mt-0.5">Enter your monthly GMV by rail. See Cashfree's market share against this data in 10 seconds.</p>
          </div>
          <a href="/myrail"
            class="shrink-0 flex items-center gap-2 px-4 py-2 bg-surface-blue-1 hover:bg-surface-blue-2 border border-outline-blue-1 text-ink-blue-3 rounded-lg text-xs font-medium transition-all">
            <Icon name="plus" size={13} />
            Add numbers
          </a>
        </div>
      )}

    </div>
  )
}
