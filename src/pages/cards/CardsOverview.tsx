/** @jsxImportSource preact */
import KPICard from '../../components/KPICard'
import Icon from '../../components/Icon'
import LineChart from '../../components/charts/LineChart'
import DoughnutChart from '../../components/charts/DoughnutChart'
import ErrorState from '../../components/ErrorState'
import SwatchDot from '../../components/SwatchDot'
import MeterBar from '../../components/MeterBar'
import { useCardsTimeSeries, useCardsBankLatest } from '../../hooks/useCardsData'
import clsx from 'clsx'

const fmt = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(2)}L Cr` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}K Cr` : `₹${v.toFixed(0)} Cr`

const fmtCount = (v: number) =>
  v >= 10000000 ? `${(v / 10000000).toFixed(2)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v.toLocaleString('en-IN')

export default function CardsOverview() {
  const { monthly, latest, prev, isLoading, error, refetch } = useCardsTimeSeries()
  const { banks } = useCardsBankLatest()

  if (error) return <ErrorState message={error.message} onRetry={refetch} />

  const loading = isLoading || !latest

  const momCC = prev && prev.ccTotalSpend > 0 ? ((latest?.ccTotalSpend - prev.ccTotalSpend) / prev.ccTotalSpend) * 100 : undefined
  const momDC = prev && prev.dcTotalSpend > 0 ? ((latest?.dcTotalSpend - prev.dcTotalSpend) / prev.dcTotalSpend) * 100 : undefined

  const trend24 = monthly.slice(-24)
  const top5Banks = banks.slice(0, 5)

  // Sparkline data (last 12 months) for KPI cards
  const spark12 = monthly.slice(-12)
  const sparkCC = spark12.map(d => d.ccTotalSpend)
  const sparkDC = spark12.map(d => d.dcTotalSpend)
  const sparkCCCards = spark12.map(d => d.creditCards)
  const sparkDCCards = spark12.map(d => d.debitCards)

  const CARD_COLORS = { CC_POS: '#3B82F6', CC_ONLINE: '#8B5CF6', CC_ATM: '#0EA5E9', DC_POS: '#10B981', DC_ONLINE: '#34D399', DC_ATM: '#6EE7B7' }

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-ink-gray-9">Cards Ecosystem</h1>
          <p class="text-xs text-ink-gray-6 mt-0.5">
            {latest?.label ?? 'Loading…'} · RBI Bank-wise data via India Data Portal
          </p>
        </div>
        <span class="pill-blue flex items-center gap-1">
          <Icon name="circle" size={10} />
          Live API · 85 Banks
        </span>
      </div>

      {/* KPIs */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Credit Cards" value={loading ? '—' : fmtCount(latest.creditCards)} sub="outstanding" icon="credit-card" accentClass="text-ink-blue-2" loading={loading} sparkData={sparkCCCards} sparkColor="var(--ink-blue-2)" />
        <KPICard label="Debit Cards"  value={loading ? '—' : fmtCount(latest.debitCards)}  sub="outstanding" icon="credit-card" accentClass="text-ink-gray-6" loading={loading} sparkData={sparkDCCards} sparkColor="#8B5CF6" />
        <KPICard label="CC Spend" value={loading ? '—' : fmt(latest.ccTotalSpend)} trend={momCC} sub="MoM" icon="credit-card" accentClass="text-ink-green-2" loading={loading} sparkData={sparkCC} sparkColor="var(--ink-green-2)" />
        <KPICard label="DC Spend" value={loading ? '—' : fmt(latest.dcTotalSpend)} trend={momDC} sub="MoM" icon="shopping-bag" accentClass="text-ink-amber-2" loading={loading} sparkData={sparkDC} sparkColor="var(--ink-amber-2)" />
      </div>

      {/* Channel mix */}
      {latest && (
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CC breakdown donut */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-4">Credit Card Channel Mix</h2>
            <DoughnutChart
              labels={['PoS', 'Online', 'ATM']}
              data={[latest.ccPosVal, latest.ccOnlineVal, latest.ccAtmVal]}
              colors={[CARD_COLORS.CC_POS, CARD_COLORS.CC_ONLINE, CARD_COLORS.CC_ATM]}
              height={160}
              tooltipFormat={fmt}
            />
            <div class="space-y-1.5 mt-3">
              {[
                { label: 'PoS',    val: latest.ccPosVal,    color: CARD_COLORS.CC_POS    },
                { label: 'Online', val: latest.ccOnlineVal, color: CARD_COLORS.CC_ONLINE },
                { label: 'ATM',    val: latest.ccAtmVal,    color: CARD_COLORS.CC_ATM    },
              ].map(({ label, val, color }) => {
                const total = latest.ccPosVal + latest.ccOnlineVal + latest.ccAtmVal
                return (
                  <div key={label} class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-1.5 text-ink-gray-8">
                      <SwatchDot color={color} square />
                      {label}
                    </span>
                    <span class="text-ink-gray-7 tabular-nums">
                      {total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* DC breakdown donut */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-4">Debit Card Channel Mix</h2>
            <DoughnutChart
              labels={['PoS', 'Online', 'ATM']}
              data={[latest.dcPosVal, latest.dcOnlineVal, latest.dcAtmVal]}
              colors={[CARD_COLORS.DC_POS, CARD_COLORS.DC_ONLINE, CARD_COLORS.DC_ATM]}
              height={160}
              tooltipFormat={fmt}
            />
            <div class="space-y-1.5 mt-3">
              {[
                { label: 'PoS',    val: latest.dcPosVal,    color: CARD_COLORS.DC_POS    },
                { label: 'Online', val: latest.dcOnlineVal, color: CARD_COLORS.DC_ONLINE },
                { label: 'ATM',    val: latest.dcAtmVal,    color: CARD_COLORS.DC_ATM    },
              ].map(({ label, val, color }) => {
                const total = latest.dcPosVal + latest.dcOnlineVal + latest.dcAtmVal
                return (
                  <div key={label} class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-1.5 text-ink-gray-8">
                      <SwatchDot color={color} square />
                      {label}
                    </span>
                    <span class="text-ink-gray-7 tabular-nums">
                      {total > 0 ? `${((val / total) * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top 5 banks */}
          <div class="glass-card p-5">
            <h2 class="text-sm font-medium text-ink-gray-9 mb-4">Top Banks by CC Spend</h2>
            {isLoading ? (
              <div class="space-y-2">{[...Array(5)].map((_, i) => <div key={i} class="h-8 bg-surface-gray-1 rounded animate-pulse" />)}</div>
            ) : (
              <div class="space-y-2">
                {top5Banks.map((b, i) => {
                  const maxVal = top5Banks[0]?.totalCCSpendVal ?? 1
                  return (
                    <div key={b.bankName} class="space-y-1">
                      <div class="flex justify-between text-xs">
                        <span class="text-ink-gray-8 truncate mr-2">#{i+1} {b.bankName}</span>
                        <span class="text-ink-gray-7 shrink-0 tabular-nums">{fmt(b.totalCCSpendVal)}</span>
                      </div>
                      <div class="h-1 bg-surface-gray-1 rounded-full overflow-hidden">
                        <MeterBar pct={(b.totalCCSpendVal / maxVal) * 100} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CC vs DC trend */}
      <div class="glass-card p-5">
        <h2 class="text-sm font-medium text-ink-gray-9 mb-1">Credit vs Debit Spend Trend</h2>
        <p class="text-xs text-ink-gray-6 mb-4">Total monthly spend (₹ Lakh Cr)</p>
        {isLoading ? (
          <div class="h-[200px] bg-surface-gray-1 rounded animate-pulse" />
        ) : (
          <LineChart
            labels={trend24.map(d => d.label)}
            datasets={[
              {
                label: 'Credit Card',
                data: trend24.map(d => +(d.ccTotalSpend / 100000).toFixed(2)),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59,130,246,0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
              },
              {
                label: 'Debit Card',
                data: trend24.map(d => +(d.dcTotalSpend / 100000).toFixed(2)),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16,185,129,0.06)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
              },
            ]}
            height={200}
            tickFormat={v => `${v}L`}
          />
        )}
      </div>
    </div>
  )
}
