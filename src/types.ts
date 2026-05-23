// ─── UPI Types ────────────────────────────────────────────────────────────────

export interface UPIMonthlyRecord {
  _id: number
  id: number
  month: string                  // "2023-08-01"
  total_vol: number              // transactions in millions
  total_val: number              // in crore INR
  p2p_vol: number
  p2p_val: number
  p2m_vol: number
  p2m_val: number
}

export interface UPIPoint {
  date: string           // "2025-04"
  label: string          // "Apr 2025"
  volume: number         // millions
  value: number          // crore INR
  banks: number
  momVolume?: number     // MoM % change
  momValue?: number
}

// App-wise data (bundled historical — NPCI doesn't have a public API for this)
export interface AppRecord {
  month: number          // 1–12
  year: number
  app: string
  volume: number         // Mn transactions
  value: number          // Rs Crore
  estimated?: boolean
}

// ─── Cards Types ──────────────────────────────────────────────────────────────

export interface CardsRawRecord {
  _id: number
  id: string
  date: string                        // "2024-04-01" or "Apr-2024"
  bank_category: string               // "Public Sector Banks" etc.
  bank_name: string
  atms_crms_onsite: string
  atms_crms_offsite: string
  pos: string
  micro_atms: string
  bharat_qr: string
  upi_qr: string
  credit_cards: string                // cards outstanding
  debit_cards: string
  cc_pay_trns_at_pos_vol: string
  cc_pay_trns_at_pos_val: string
  cc_pay_trns_online_vol: string
  cc_pay_trns_online_val: string
  cc_pay_trns_other_vol: string
  cc_pay_trns_other_val: string
  cc_cash_withdraw_atm_vol: string
  cc_cash_withdraw_atm_val: string
  dc_pay_trns_at_pos_vol: string
  dc_pay_trns_at_pos_val: string
  dc_pay_trns_online_vol: string
  dc_pay_trns_online_val: string
  dc_pay_trns_other_vol: string
  dc_pay_trns_other_val: string
  dc_cash_withdraw_atm_vol: string
  dc_cash_withdraw_atm_val: string
  dc_cash_withdraw_pos_vol: string
  dc_cash_withdraw_pos_val: string
}

export interface BankMonthRecord {
  date: string
  label: string
  bankName: string
  bankCategory: string
  creditCards: number
  debitCards: number
  ccPosVol: number
  ccPosVal: number
  ccOnlineVol: number
  ccOnlineVal: number
  ccOtherVol: number
  ccOtherVal: number
  ccAtmVol: number
  ccAtmVal: number
  dcPosVol: number
  dcPosVal: number
  dcOnlineVol: number
  dcOnlineVal: number
  dcOtherVol: number
  dcOtherVal: number
  dcAtmVol: number
  dcAtmVal: number
  // Computed
  totalCCSpendVol: number
  totalCCSpendVal: number
  totalDCSpendVol: number
  totalDCSpendVal: number
}

export interface MonthlyCardsAggregate {
  date: string
  label: string
  creditCards: number
  debitCards: number
  ccPosVal: number
  ccOnlineVal: number
  ccAtmVal: number
  ccTotalSpend: number
  dcPosVal: number
  dcOnlineVal: number
  dcAtmVal: number
  dcTotalSpend: number
  totalSpend: number
  momCC?: number
  momDC?: number
}

// ─── CKAN Response ────────────────────────────────────────────────────────────

export interface CKANResponse<T> {
  success: boolean
  result: {
    resource_id: string
    fields: Array<{ id: string; type: string }>
    records: T[]
    total: number
    _links?: { next?: string }
  }
}
