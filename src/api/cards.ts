import { fetchAllCKAN, RESOURCE_IDS } from './ckan'
import type { CardsRawRecord, BankMonthRecord, MonthlyCardsAggregate } from '../types'

const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function parseDate(raw: string): { sortKey: string; label: string } | null {
  const mmm = raw.match(/^([A-Za-z]+)[-\/\s](\d{4})$/)
  if (mmm) {
    const mon = mmm[1].slice(0, 3)
    const idx = MONTH_ORDER.findIndex(m => m.toLowerCase() === mon.toLowerCase())
    if (idx === -1) return null
    const mo = String(idx + 1).padStart(2, '0')
    return { sortKey: `${mmm[2]}-${mo}`, label: `${mon} ${mmm[2]}` }
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const label = `${MONTH_ORDER[parseInt(iso[2]) - 1]} ${iso[1]}`
    return { sortKey: `${iso[1]}-${iso[2]}`, label }
  }
  return null
}

function n(s: string | null | undefined): number {
  if (!s) return 0
  return parseFloat(String(s).replace(/,/g, '')) || 0
}

// RBI CKAN stores transaction values in Rupees Thousands → convert to Crores (÷10000)
function v(s: string | null | undefined): number { return n(s) / 10000 }

export async function fetchCardsRaw(): Promise<BankMonthRecord[]> {
  const records = await fetchAllCKAN<CardsRawRecord>(RESOURCE_IDS.CARDS_BANKWISE)

  return records
    .map((r): BankMonthRecord | null => {
      const parsed = parseDate(r.date)
      if (!parsed) return null

      const ccPosVol = n(r.cc_pay_trns_at_pos_vol)
      const ccPosVal = v(r.cc_pay_trns_at_pos_val)
      const ccOnlineVol = n(r.cc_pay_trns_online_vol)
      const ccOnlineVal = v(r.cc_pay_trns_online_val)
      const ccOtherVol = n(r.cc_pay_trns_other_vol)
      const ccOtherVal = v(r.cc_pay_trns_other_val)
      const dcPosVol = n(r.dc_pay_trns_at_pos_vol)
      const dcPosVal = v(r.dc_pay_trns_at_pos_val)
      const dcOnlineVol = n(r.dc_pay_trns_online_vol)
      const dcOnlineVal = v(r.dc_pay_trns_online_val)

      return {
        date: parsed.sortKey,
        label: parsed.label,
        bankName: r.bank_name,
        bankCategory: r.bank_category,
        creditCards: n(r.credit_cards),
        debitCards: n(r.debit_cards),
        ccPosVol, ccPosVal,
        ccOnlineVol, ccOnlineVal,
        ccOtherVol, ccOtherVal,
        ccAtmVol: n(r.cc_cash_withdraw_atm_vol),
        ccAtmVal: v(r.cc_cash_withdraw_atm_val),
        dcPosVol, dcPosVal,
        dcOnlineVol, dcOnlineVal,
        dcOtherVol: n(r.dc_pay_trns_other_vol),
        dcOtherVal: v(r.dc_pay_trns_other_val),
        dcAtmVol: n(r.dc_cash_withdraw_atm_vol),
        dcAtmVal: v(r.dc_cash_withdraw_atm_val),
        totalCCSpendVol: ccPosVol + ccOnlineVol + ccOtherVol,
        totalCCSpendVal: ccPosVal + ccOnlineVal + ccOtherVal,
        totalDCSpendVol: dcPosVol + dcOnlineVol + n(r.dc_pay_trns_other_vol),
        totalDCSpendVal: dcPosVal + dcOnlineVal + v(r.dc_pay_trns_other_val),
      }
    })
    .filter(Boolean) as BankMonthRecord[]
}

export function aggregateCardsByMonth(records: BankMonthRecord[]): MonthlyCardsAggregate[] {
  const map = new Map<string, MonthlyCardsAggregate>()

  for (const r of records) {
    const existing = map.get(r.date)
    if (!existing) {
      map.set(r.date, {
        date: r.date,
        label: r.label,
        creditCards: r.creditCards,
        debitCards: r.debitCards,
        ccPosVal: r.ccPosVal,
        ccOnlineVal: r.ccOnlineVal,
        ccAtmVal: r.ccAtmVal,
        ccTotalSpend: r.totalCCSpendVal,
        dcPosVal: r.dcPosVal,
        dcOnlineVal: r.dcOnlineVal,
        dcAtmVal: r.dcAtmVal,
        dcTotalSpend: r.totalDCSpendVal,
        totalSpend: r.totalCCSpendVal + r.totalDCSpendVal,
      })
    } else {
      existing.creditCards += r.creditCards
      existing.debitCards += r.debitCards
      existing.ccPosVal += r.ccPosVal
      existing.ccOnlineVal += r.ccOnlineVal
      existing.ccAtmVal += r.ccAtmVal
      existing.ccTotalSpend += r.totalCCSpendVal
      existing.dcPosVal += r.dcPosVal
      existing.dcOnlineVal += r.dcOnlineVal
      existing.dcAtmVal += r.dcAtmVal
      existing.dcTotalSpend += r.totalDCSpendVal
      existing.totalSpend += r.totalCCSpendVal + r.totalDCSpendVal
    }
  }

  const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))

  // Compute MoM
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    if (prev.ccTotalSpend > 0) curr.momCC = ((curr.ccTotalSpend - prev.ccTotalSpend) / prev.ccTotalSpend) * 100
    if (prev.dcTotalSpend > 0) curr.momDC = ((curr.dcTotalSpend - prev.dcTotalSpend) / prev.dcTotalSpend) * 100
  }

  return sorted
}

export function aggregateCardsByBank(
  records: BankMonthRecord[],
  latestDate?: string
): Array<BankMonthRecord & { monthCount: number }> {
  const date = latestDate ?? records.reduce((a: BankMonthRecord, b: BankMonthRecord) => (a.date > b.date ? a : b), records[0])?.date ?? ''
  const latest = records.filter(r => r.date === date)
  return latest.map(r => ({ ...r, monthCount: 1 }))
    .sort((a, b) => b.totalCCSpendVal - a.totalCCSpendVal)
}
