/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks'
import { useRBIMonthly } from '../../hooks/useRBIData'
import Icon from '../../components/Icon'
import InfoChip from '../../components/InfoChip'
import type { RBIMonthly } from '../../api/rbiDaily'

const fmtCr = (v: number) => v > 0 ? Math.round(v).toLocaleString('en-IN') : ''
const fmtMn = (v: number) => v > 0 ? v.toFixed(0) : ''

interface Col {
  id: string
  label: string
  get: (m: RBIMonthly) => number
  unit: string
}

const COLS: Col[] = [
  { id: 'upiVol',       label: 'UPI Vol',       get: m => m.upiVol,       unit: 'Mn' },
  { id: 'upiVal',       label: 'UPI Val',       get: m => m.upiVal,       unit: '₹ Cr' },
  { id: 'ccEcomVal',    label: 'CC eCom Val',   get: m => m.ccEcomVal,    unit: '₹ Cr' },
  { id: 'ccPosVal',     label: 'CC POS Val',    get: m => m.ccPosVal,     unit: '₹ Cr' },
  { id: 'dcPosVal',     label: 'DC POS Val',    get: m => m.dcPosVal,     unit: '₹ Cr' },
  { id: 'nachDebitVal', label: 'NACH Val',      get: m => m.nachDebitVal, unit: '₹ Cr' },
  { id: 'bbpsVal',      label: 'BBPS Val',      get: m => m.bbpsVal,      unit: '₹ Cr' },
]

function downloadCSV(rows: RBIMonthly[], filename: string) {
  const headers = ['Month', 'Date', 'Source', ...COLS.map(c => `${c.label} (${c.unit})`)]
  const lines = [headers.join(',')]
  for (const m of rows) {
    const row = [
      `"${m.label}"`,
      m.date,
      m.source ?? 'ckan',
      ...COLS.map(c => c.get(m).toString()),
    ]
    lines.push(row.join(','))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const RANGES = [
  { label: '12M', months: 12 },
  { label: '2Y',  months: 24 },
  { label: '5Y',  months: 60 },
  { label: 'ALL', months: 9999 },
]

export default function Data() {
  const { months, isLoading } = useRBIMonthly()
  const [range, setRange] = useState('2Y')
  const [orderDesc, setOrderDesc] = useState(true)

  const rows = useMemo(() => {
    const n = RANGES.find(r => r.label === range)?.months ?? 9999
    const slice = months.slice(-Math.min(n, months.length))
    return orderDesc ? [...slice].reverse() : slice
  }, [months, range, orderDesc])

  const latest = months[months.length - 1]

  return (
    <div class="space-y-6 max-w-[1800px] mx-auto">

      {/* Header */}
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-2xs font-semibold tracking-wide text-ink-gray-5 mb-1">Data</div>
          <h1 class="view-h1 text-ink-gray-9 leading-snug">Browse the raw monthly data</h1>
          <p class="text-xs text-ink-gray-6 mt-1">
            All rails. Source-attributed per row.
            {latest && <span class="ml-1">Latest: <span class="text-ink-gray-8 font-medium">{latest.label}</span>.</span>}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <div class="flex items-center gap-1 bg-surface-gray-1 border border-outline-gray-2 rounded-lg p-0.5">
            {RANGES.map(r => (
              <button
                key={r.label}
                onClick={() => setRange(r.label)}
                class={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  range === r.label
                    ? 'bg-surface-white text-ink-gray-9 shadow-sm border border-outline-gray-2'
                    : 'text-ink-gray-6 hover:text-ink-gray-8'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => downloadCSV(rows, `india-payments-${range.toLowerCase()}.csv`)}
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-outline-blue-1 bg-surface-blue-1 text-ink-blue-2 hover:bg-surface-blue-2 transition-colors cursor-pointer"
            disabled={isLoading || rows.length === 0}
          >
            <Icon name="file-text" size={13} />
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div class="glass-card overflow-hidden">
        <div class="px-5 py-3 border-b border-outline-gray-1 flex items-center justify-between">
          <span class="text-2xs text-ink-gray-5">
            {isLoading ? 'Loading…' : `${rows.length} months`}
          </span>
          <button
            onClick={() => setOrderDesc(o => !o)}
            class="text-2xs text-ink-gray-6 hover:text-ink-gray-9 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Icon name="sliders" size={11} />
            {orderDesc ? 'Newest first' : 'Oldest first'}
          </button>
        </div>

        {isLoading ? (
          <div class="p-5 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} class="h-7 bg-surface-gray-1 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div class="overflow-x-auto" tabIndex={0}>
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-outline-gray-1 bg-surface-gray-1">
                  <th class="text-left px-4 py-2.5 text-ink-gray-6 font-medium whitespace-nowrap sticky left-0 bg-surface-gray-1">Month</th>
                  <th class="text-left px-4 py-2.5 text-ink-gray-6 font-medium whitespace-nowrap">
                    <span class="inline-flex items-center gap-1">
                      Source
                      <InfoChip term="ckan" />
                    </span>
                  </th>
                  {COLS.map(c => (
                    <th key={c.id} class="text-right px-4 py-2.5 text-ink-gray-6 font-medium whitespace-nowrap">
                      {c.label}
                      <div class="text-2xs text-ink-gray-4 font-normal">{c.unit}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(m => (
                  <tr key={m.date} class="border-b border-outline-gray-1 hover:bg-surface-gray-1">
                    <td class="px-4 py-2 text-ink-gray-9 font-medium whitespace-nowrap sticky left-0 bg-surface-white">{m.label}</td>
                    <td class="px-4 py-2">
                      <span class={`text-2xs px-1.5 py-0.5 rounded border whitespace-nowrap ${
                        m.source === 'npci'
                          ? 'border-outline-amber-1 bg-surface-amber-1 text-ink-amber-2'
                          : 'border-outline-gray-2 bg-surface-gray-2 text-ink-gray-6'
                      }`}>
                        {m.source === 'npci' ? 'NPCI live' : 'CKAN'}
                      </span>
                    </td>
                    {COLS.map(c => {
                      const v = c.get(m)
                      return (
                        <td key={c.id} class={`px-4 py-2 text-right tabular-nums whitespace-nowrap ${v > 0 ? 'text-ink-gray-8' : 'text-ink-gray-4'}`}>
                          {v > 0 ? (c.unit === 'Mn' ? fmtMn(v) : fmtCr(v)) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p class="text-2xs text-ink-gray-5 italic">
        CKAN rows are RBI historical (full rail coverage). NPCI rows are live monthly (UPI + NACH + BBPS only — card rails come in with ~45-day RBI lag).
      </p>

    </div>
  )
}
