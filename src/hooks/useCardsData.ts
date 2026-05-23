import { useFetch } from './useFetch'
import { fetchCardsRaw, aggregateCardsByMonth, aggregateCardsByBank } from '../api/cards'
import type { BankMonthRecord, MonthlyCardsAggregate } from '../types'

function useCardsRaw() {
  return useFetch<BankMonthRecord[]>('cards-raw', fetchCardsRaw)
}

export function useCardsTimeSeries() {
  const { data: raw, isLoading, error, refetch } = useCardsRaw()
  const monthly: MonthlyCardsAggregate[] = raw ? aggregateCardsByMonth(raw) : []
  const latest = monthly[monthly.length - 1]
  const prev = monthly[monthly.length - 2]
  return { monthly, latest, prev, isLoading, error, refetch }
}

export function useCardsBankLatest() {
  const { data: raw, isLoading, error, refetch } = useCardsRaw()
  const latestDate = raw?.reduce((a: BankMonthRecord, b: BankMonthRecord) => (a.date > b.date ? a : b), raw[0])?.date ?? ''
  const banks = raw ? aggregateCardsByBank(raw, latestDate) : []
  return { banks, latestDate, isLoading, error, refetch }
}

export function useBankDetail(bankName: string) {
  const { data: raw } = useCardsRaw()
  return { bankData: [...(raw?.filter(r => r.bankName === bankName) ?? [])].sort((a, b) => a.date.localeCompare(b.date)) }
}

export function useAllBanks() {
  const { data: raw } = useCardsRaw()
  const latestDate = raw?.reduce((a: BankMonthRecord, b: BankMonthRecord) => (a.date > b.date ? a : b), raw[0])?.date ?? ''
  return { bankNames: Array.from(new Set(raw?.filter(r => r.date === latestDate).map(r => r.bankName) ?? [])).sort() }
}
