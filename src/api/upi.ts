import { fetchAllCKAN, RESOURCE_IDS } from './ckan'
import type { UPIMonthlyRecord, UPIPoint } from '../types'

const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function parseDate(raw: string): { sortKey: string; label: string } | null {
  // "2025-04-01" or "2025-04" — always try YYYY-MM first (handles both)
  const iso = raw.match(/^(\d{4})-(\d{2})/)
  if (iso) {
    const label = `${MONTH_ORDER[parseInt(iso[2]) - 1]} ${iso[1]}`
    return { sortKey: `${iso[1]}-${iso[2]}`, label }
  }
  // "Apr-2025" or "April-2025"
  const mmm = raw.match(/^([A-Za-z]+)[-\/\s](\d{4})$/)
  if (mmm) {
    const mon = mmm[1].slice(0, 3)
    const idx = MONTH_ORDER.findIndex(m => m.toLowerCase() === mon.toLowerCase())
    if (idx === -1) return null
    const mo = String(idx + 1).padStart(2, '0')
    return { sortKey: `${mmm[2]}-${mo}`, label: `${mon} ${mmm[2]}` }
  }
  return null
}

function toNum(s: string | undefined | null): number {
  if (!s) return 0
  return parseFloat(String(s).replace(/,/g, '')) || 0
}

export async function fetchUPITimeSeries(): Promise<UPIPoint[]> {
  const records = await fetchAllCKAN<UPIMonthlyRecord>(RESOURCE_IDS.UPI_AGGREGATE)

  const points: UPIPoint[] = records
    .map((r) => {
      const parsed = parseDate(r.month)
      if (!parsed) return null
      return {
        date: parsed.sortKey,
        label: parsed.label,
        volume: Number(r.total_vol) || 0,
        value: Number(r.total_val) || 0,
        banks: 0,
      } satisfies UPIPoint
    })
    .filter(Boolean) as UPIPoint[]

  points.sort((a, b) => a.date.localeCompare(b.date))

  // Compute MoM changes
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    if (prev.volume > 0) curr.momVolume = ((curr.volume - prev.volume) / prev.volume) * 100
    if (prev.value > 0) curr.momValue = ((curr.value - prev.value) / prev.value) * 100
  }

  return points
}
