import { fetchAllCKAN, RESOURCE_IDS } from './ckan'
import type { NPCIMonthData } from './npci'

interface RBIDailyRecord {
  _id: number
  date: string
  upi_vol: number | null
  upi_val: number | null
  credit_card_at_pos_val: number | null
  credit_card_at_pos_vol: number | null
  credit_card_at_e_commerce_val: number | null
  credit_card_at_e_commerce_vol: number | null
  debit_card_at_pos_val: number | null
  debit_card_at_pos_vol: number | null
  debit_card_at_e_commerce_val: number | null
  debit_card_at_e_commerce_vol: number | null
  nach_debit_val: number | null
  nach_debit_vol: number | null
  bbps_val: number | null
  bbps_vol: number | null
  imps_val: number | null
  imps_vol: number | null
}

export interface RBIMonthly {
  date: string          // "2024-12"
  label: string         // "Dec 2024"
  upiVol: number        // million transactions
  upiVal: number        // ₹ Crore
  ccPosVal: number
  ccEcomVal: number
  ccTotalVal: number    // CC POS + eCommerce
  dcPosVal: number
  dcEcomVal: number
  dcTotalVal: number
  nachDebitVal: number
  bbpsVal: number
  impsVal: number
  // derived
  cashfreeTAM: number   // ccTotalVal + nachDebitVal + bbpsVal (merchant-facing, fee-bearing rails)
  momUpiVal?: number
  momCCEcom?: number
  momCCTotal?: number
  momNACH?: number
  momBBPS?: number
  momDCPos?: number
  yoyUpiVal?: number
  yoyCCEcom?: number
  yoyNACH?: number
  daysInMonth: number
  // data provenance
  source?: 'ckan' | 'npci'   // undefined = ckan (historical default)
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const n = (v: number | null | undefined): number => Number(v) || 0

export async function fetchRBIMonthly(): Promise<RBIMonthly[]> {
  const records = await fetchAllCKAN<RBIDailyRecord>(RESOURCE_IDS.RBI_DAILY, '_id asc')

  // Group daily records by YYYY-MM
  const byMonth = new Map<string, RBIDailyRecord[]>()
  for (const r of records) {
    if (!r.date) continue
    const month = r.date.slice(0, 7)
    if (!byMonth.has(month)) byMonth.set(month, [])
    byMonth.get(month)!.push(r)
  }

  const months: RBIMonthly[] = Array.from(byMonth.entries())
    .map(([date, rows]) => {
      const [year, mo] = date.split('-').map(Number)
      const label = `${MONTHS[mo - 1]} ${year}`
      const sum = (field: keyof RBIDailyRecord) =>
        rows.reduce((s, r) => s + n(r[field] as number), 0)

      const ccPosVal    = sum('credit_card_at_pos_val')
      const ccEcomVal   = sum('credit_card_at_e_commerce_val')
      const ccTotalVal  = ccPosVal + ccEcomVal
      const dcPosVal    = sum('debit_card_at_pos_val')
      const dcEcomVal   = sum('debit_card_at_e_commerce_val')
      const nachDebitVal = sum('nach_debit_val')
      const bbpsVal     = sum('bbps_val')

      return {
        date, label,
        upiVol:      sum('upi_vol'),
        upiVal:      sum('upi_val'),
        ccPosVal, ccEcomVal, ccTotalVal,
        dcPosVal, dcEcomVal,
        dcTotalVal:  dcPosVal + dcEcomVal,
        nachDebitVal, bbpsVal,
        impsVal:     sum('imps_val'),
        cashfreeTAM: ccTotalVal + nachDebitVal + bbpsVal,
        daysInMonth: rows.length,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // Remove partial first/last months (< 20 days of data)
  const complete = months.filter(m => m.daysInMonth >= 20)

  // Compute MoM and YoY
  for (let i = 1; i < complete.length; i++) {
    const prev = complete[i - 1]
    const curr = complete[i]
    const mom = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : undefined
    curr.momUpiVal  = mom(curr.upiVal, prev.upiVal)
    curr.momCCEcom  = mom(curr.ccEcomVal, prev.ccEcomVal)
    curr.momCCTotal = mom(curr.ccTotalVal, prev.ccTotalVal)
    curr.momNACH    = mom(curr.nachDebitVal, prev.nachDebitVal)
    curr.momBBPS    = mom(curr.bbpsVal, prev.bbpsVal)
    curr.momDCPos   = mom(curr.dcPosVal, prev.dcPosVal)
  }
  for (let i = 12; i < complete.length; i++) {
    const yoy = complete[i - 12]
    const curr = complete[i]
    const yo = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : undefined
    curr.yoyUpiVal  = yo(curr.upiVal, yoy.upiVal)
    curr.yoyCCEcom  = yo(curr.ccEcomVal, yoy.ccEcomVal)
    curr.yoyNACH    = yo(curr.nachDebitVal, yoy.nachDebitVal)
  }

  return complete
}

/**
 * Extend CKAN months with NPCI live data for months beyond the CKAN cutoff.
 * NPCI covers UPI, NACH, BBPS at ~15-day lag.
 * CC eCommerce and DC POS are not published by NPCI monthly — those fields stay 0.
 * MoM/YoY for new months are computed relative to CKAN history.
 */
export function mergeWithNPCI(ckanMonths: RBIMonthly[], npciData: NPCIMonthData[]): RBIMonthly[] {
  if (ckanMonths.length === 0 || npciData.length === 0) return ckanMonths

  const lastCKANDate = ckanMonths[ckanMonths.length - 1].date
  const mom = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : undefined
  const yo  = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : undefined

  const newMonths: RBIMonthly[] = npciData
    .filter(n => n.date > lastCKANDate && ((n.upiVal ?? 0) > 0 || (n.nachVal ?? 0) > 0))
    .map(n => {
      const upiVal      = n.upiVal ?? 0
      const nachDebitVal = n.nachVal ?? 0
      const bbpsVal     = n.bbpsVal ?? 0

      return {
        date: n.date,
        label: n.label,
        upiVol:      n.upiVol ?? 0,
        upiVal,
        ccPosVal:    0,
        ccEcomVal:   0,
        ccTotalVal:  0,
        dcPosVal:    0,
        dcEcomVal:   0,
        dcTotalVal:  0,
        nachDebitVal,
        bbpsVal,
        impsVal:     0,
        cashfreeTAM: nachDebitVal + bbpsVal,
        daysInMonth: 28,
        source: 'npci' as const,
      }
    })

  // Recompute MoM and YoY across the extended array
  const all = [...ckanMonths, ...newMonths]
  for (let i = ckanMonths.length; i < all.length; i++) {
    const prev = all[i - 1]
    const curr = all[i]
    curr.momUpiVal     = mom(curr.upiVal,       prev.upiVal)
    curr.momNACH       = mom(curr.nachDebitVal,  prev.nachDebitVal)
    curr.momBBPS       = mom(curr.bbpsVal,       prev.bbpsVal)
    if (i >= 12) {
      const yago = all[i - 12]
      curr.yoyUpiVal   = yo(curr.upiVal,       yago.upiVal)
      curr.yoyNACH     = yo(curr.nachDebitVal,  yago.nachDebitVal)
    }
  }

  return all
}
