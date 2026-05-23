import type { CKANResponse } from '../types'

const CKAN_BASE = '/api/ckan'

// Resource IDs
export const RESOURCE_IDS = {
  // NPCI UPI Transactions - P2P and P2M (monthly, Apr 2020–Aug 2023)
  UPI_AGGREGATE: '64589755-cfaa-4c0e-a8ef-3ac243327360',
  // RBI Bank-wise ATM/POS/Cards Statistics (85 banks, 2022–2025)
  CARDS_BANKWISE: '1bb59cb1-6965-4c02-88ab-82333f101f5b',
  // RBI Daily Digital Payments (all rails, Jun 2020–Jan 2025)
  RBI_DAILY: '1f9367ac-01b0-4c82-83a1-4069d4340667',
} as const

interface FetchOptions {
  resourceId: string
  limit?: number
  offset?: number
  sort?: string
  filters?: Record<string, string>
}

async function ckanFetch<T>(opts: FetchOptions): Promise<CKANResponse<T>> {
  const params = new URLSearchParams({
    resource_id: opts.resourceId,
    limit: String(opts.limit ?? 500),
    offset: String(opts.offset ?? 0),
  })
  if (opts.sort) params.set('sort', opts.sort)
  if (opts.filters) params.set('filters', JSON.stringify(opts.filters))

  const res = await fetch(`${CKAN_BASE}/datastore_search?${params}`)
  if (!res.ok) throw new Error(`CKAN API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  if (!data.success) throw new Error('CKAN API returned success: false')
  return data
}

// Fetch all records by paginating through CKAN
export async function fetchAllCKAN<T>(
  resourceId: string,
  sort?: string
): Promise<T[]> {
  const pageSize = 1000
  let offset = 0
  let all: T[] = []

  const first = await ckanFetch<T>({ resourceId, limit: pageSize, offset, sort })
  const total = first.result.total
  all = first.result.records

  while (all.length < total) {
    offset += pageSize
    const page = await ckanFetch<T>({ resourceId, limit: pageSize, offset, sort })
    all = [...all, ...page.result.records]
  }

  return all
}

export { ckanFetch }
