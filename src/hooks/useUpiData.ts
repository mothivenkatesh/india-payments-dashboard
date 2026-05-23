import { useFetch } from './useFetch'
import { fetchUPITimeSeries } from '../api/upi'
import { UPI_APP_DATA, getMonthKeys, toMonthLabel, APP_COLORS } from '../data/upiAppData'
import type { UPIPoint } from '../types'

export function useUPITimeSeries() {
  return useFetch<UPIPoint[]>('upi-timeseries', fetchUPITimeSeries)
}

export function useUPIAppData() {
  const monthKeys = getMonthKeys(UPI_APP_DATA)

  const monthlyTotals = monthKeys.map(key => {
    const [year, month] = key.split('-').map(Number)
    const rows = UPI_APP_DATA.filter(r => r.year === year && r.month === month)
    return {
      date: key,
      label: toMonthLabel(key),
      volume: rows.reduce((s, r) => s + r.volume, 0),
      value: rows.reduce((s, r) => s + r.value, 0),
    }
  })

  const apps = Array.from(new Set(UPI_APP_DATA.map(r => r.app)))

  const appSeries = apps.reduce<Record<string, Array<{
    date: string; label: string; volume: number; value: number; estimated: boolean
  }>>>((acc, app) => {
    acc[app] = monthKeys.map(key => {
      const [year, month] = key.split('-').map(Number)
      const row = UPI_APP_DATA.find(r => r.year === year && r.month === month && r.app === app)
      return { date: key, label: toMonthLabel(key), volume: row?.volume ?? 0, value: row?.value ?? 0, estimated: row?.estimated ?? false }
    })
    return acc
  }, {})

  const latestKey = monthKeys[monthKeys.length - 1]
  const [ly, lm] = latestKey.split('-').map(Number)
  const latestRows = UPI_APP_DATA.filter(r => r.year === ly && r.month === lm)
  const totalVol = latestRows.reduce((s, r) => s + r.volume, 0)
  const totalVal = latestRows.reduce((s, r) => s + r.value, 0)
  const latestRanked = [...latestRows]
    .sort((a, b) => b.volume - a.volume)
    .map((r, i) => ({
      ...r,
      rank: i + 1,
      volShare: totalVol > 0 ? (r.volume / totalVol) * 100 : 0,
      valShare: totalVal > 0 ? (r.value / totalVal) * 100 : 0,
      color: APP_COLORS[r.app] ?? '#6B7280',
    }))

  const prevKey = monthKeys[monthKeys.length - 2]
  const [py, pm] = prevKey ? prevKey.split('-').map(Number) : [0, 0]
  const prevRows = UPI_APP_DATA.filter(r => r.year === py && r.month === pm)
  const prevVol = prevRows.reduce((s, r) => s + r.volume, 0)
  const prevVal = prevRows.reduce((s, r) => s + r.value, 0)

  return {
    monthKeys, monthlyTotals, appSeries, apps,
    latestKey, latestLabel: toMonthLabel(latestKey),
    latestRanked, totalVol, totalVal,
    momVol: prevVol > 0 ? ((totalVol - prevVol) / prevVol) * 100 : 0,
    momVal: prevVal > 0 ? ((totalVal - prevVal) / prevVal) * 100 : 0,
    activeApps: latestRows.length,
  }
}
