import { useFetch } from './useFetch'
import { fetchRBIMonthly, mergeWithNPCI } from '../api/rbiDaily'
import { fetchNPCIRecent } from '../api/npci'
import type { RBIMonthly } from '../api/rbiDaily'

async function fetchMerged(): Promise<RBIMonthly[]> {
  // Fetch CKAN historical data and NPCI live data in parallel.
  // NPCI failure is non-fatal — we fall back to CKAN-only data.
  const [ckan, npci] = await Promise.all([
    fetchRBIMonthly(),
    fetchNPCIRecent().catch(() => []),
  ])
  return mergeWithNPCI(ckan, npci)
}

export function useRBIMonthly() {
  const { data, isLoading, error } = useFetch<RBIMonthly[]>('rbi-merged', fetchMerged)
  const months = data ?? []
  const latest = months[months.length - 1]
  const prev   = months[months.length - 2]
  const yearAgo = months[months.length - 13]
  return { months, latest, prev, yearAgo, isLoading, error }
}
