/**
 * NPCI live data via Excel file — ~15-day lag after month end
 * Covers: UPI, BBPS  (NACH Debit not published in this Excel — always undefined)
 * Source: npci.org.in retail-payment-statistics-list XLSX
 *
 * Unit conversion: NPCI "Value (in Bn)" × 100 = ₹ Crore  (CKAN units)
 * Confirmed: NPCI Q3 FY24-25 = 68,297 Bn → 6,829,700 Cr ≈ CKAN Oct+Nov+Dec 2024 = 6,829,707 Cr ✓
 *
 * Column layout (0-indexed) confirmed via SheetJS eval on 2026-05-07 XLSX snapshot:
 *   Row 26 = UPI, Row 25 = BBPS
 *   Cols 20-35: 8 quarters × 2 cols (vol, val), starting FY24-25 Q1
 *   Cols 36-37: Apr 2026 single month (vol, val)
 */
import * as XLSX from 'xlsx'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export interface NPCIMonthData {
  date: string       // "2025-04"
  label: string      // "Apr 2025"
  upiVol?: number    // million transactions
  upiVal?: number    // ₹ Crore
  nachVal?: number   // ₹ Crore (not available from this source)
  bbpsVal?: number   // ₹ Crore
}

function numCell(row: unknown[], col: number): number {
  const v = row[col]
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return v
  return parseFloat(String(v).replace(/,/g, '')) || 0
}

// Indian FY quarter → calendar months
const Q_MONTHS: Record<number, number[]> = {
  1: [4, 5, 6],
  2: [7, 8, 9],
  3: [10, 11, 12],
  4: [1, 2, 3],
}

interface Period {
  volCol: number
  valCol: number
  fyStart: number       // e.g. 2024 for FY24-25
  quarter: 1|2|3|4
  singleMonth?: number  // if set, only emit this specific month (for standalone monthly data)
}

// Periods cover FY24-25 through latest available data
const PERIODS: Period[] = [
  { volCol: 20, valCol: 21, fyStart: 2024, quarter: 1 }, // Apr–Jun 2024
  { volCol: 22, valCol: 23, fyStart: 2024, quarter: 2 }, // Jul–Sep 2024
  { volCol: 24, valCol: 25, fyStart: 2024, quarter: 3 }, // Oct–Dec 2024
  { volCol: 26, valCol: 27, fyStart: 2024, quarter: 4 }, // Jan–Mar 2025
  { volCol: 28, valCol: 29, fyStart: 2025, quarter: 1 }, // Apr–Jun 2025
  { volCol: 30, valCol: 31, fyStart: 2025, quarter: 2 }, // Jul–Sep 2025
  { volCol: 32, valCol: 33, fyStart: 2025, quarter: 3 }, // Oct–Dec 2025
  { volCol: 34, valCol: 35, fyStart: 2025, quarter: 4 }, // Jan–Mar 2026
  { volCol: 36, valCol: 37, fyStart: 2026, quarter: 1, singleMonth: 4 }, // Apr 2026 only
]

// Q4 months (Jan–Mar) fall in the next calendar year
function calYear(fyStart: number, month: number): number {
  return month <= 3 ? fyStart + 1 : fyStart
}

function parseXLSX(buf: ArrayBuffer): NPCIMonthData[] {
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: 0 })

  const upiRow  = rows[26] as unknown[]
  const bbpsRow = rows[25] as unknown[]

  if (!upiRow || !bbpsRow) return []

  const result: NPCIMonthData[] = []

  for (const { volCol, valCol, fyStart, quarter, singleMonth } of PERIODS) {
    const qUpiVol  = numCell(upiRow, volCol)   // Mn transactions (quarterly or single-month total)
    const qUpiVal  = numCell(upiRow, valCol)   // Bn ₹
    const qBbpsVal = numCell(bbpsRow, valCol)  // Bn ₹

    if (qUpiVal <= 0) continue  // unpublished future quarter — stop here

    const months  = Q_MONTHS[quarter]
    const divisor = singleMonth ? 1 : 3

    for (const mo of months) {
      if (singleMonth && mo !== singleMonth) continue
      const year  = calYear(fyStart, mo)
      const date  = `${year}-${String(mo).padStart(2, '0')}`
      const label = `${MONTH_LABELS[mo - 1]} ${year}`
      result.push({
        date,
        label,
        upiVol:  qUpiVol  / divisor,
        upiVal:  (qUpiVal  * 100) / divisor,   // Bn × 100 = Crore, then monthly avg
        bbpsVal: qBbpsVal > 0 ? (qBbpsVal * 100) / divisor : undefined,
      })
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

async function fetchXLSXUrl(): Promise<string | null> {
  try {
    const res = await fetch('/api/npci/api/retail-payment-statistics-list', {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    // Response: { data: { files: [{ media: { url: "/uploads/...xlsx" } }] } }
    const files: Array<{ media?: { url?: string } }> =
      data?.data?.files ?? data?.files ?? []
    const found = files.find(f =>
      (f.media?.url ?? '').toLowerCase().endsWith('.xlsx')
    )
    return found?.media?.url ?? null
  } catch {
    return null
  }
}

/**
 * Fetch NPCI retail payments Excel and parse into monthly data.
 * Returns empty array on any failure (caller falls back to CKAN-only data).
 */
export async function fetchNPCIRecent(): Promise<NPCIMonthData[]> {
  const xlsxPath = await fetchXLSXUrl()
  if (!xlsxPath) return []

  try {
    const url = xlsxPath.startsWith('http') ? xlsxPath : `/api/npci${xlsxPath}`
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) return []
    const buf = await res.arrayBuffer()
    return parseXLSX(buf)
  } catch {
    return []
  }
}
