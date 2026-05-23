import { useState, useEffect } from 'preact/hooks'

export interface MyRailData {
  company: string
  month: string        // "2025-03"
  upiVolume: number    // Mn transactions (0 = not set)
  upiValue: number     // ₹ Cr
  ccSpend: number      // ₹ Cr
  dcSpend: number      // ₹ Cr
}

const EMPTY: MyRailData = { company: '', month: '', upiVolume: 0, upiValue: 0, ccSpend: 0, dcSpend: 0 }
const KEY = 'india-payments-myrail-v1'

export function useMyRail() {
  const [data, setData] = useState<MyRailData>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
    } catch {
      return EMPTY
    }
  })

  const save = (next: MyRailData) => {
    setData(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  }

  const clear = () => {
    setData(EMPTY)
    try { localStorage.removeItem(KEY) } catch {}
  }

  const hasData = data.company.trim().length > 0 &&
    (data.upiVolume > 0 || data.upiValue > 0 || data.ccSpend > 0 || data.dcSpend > 0)

  return { data, save, clear, hasData }
}
