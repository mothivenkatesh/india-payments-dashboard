/**
 * useFirstVisit — localStorage-backed flag for "has this visitor seen the
 * welcome tour yet?" Used to auto-open the tour on a true first load, and
 * to let the user re-open it from a sidebar link any time.
 */
import { useEffect, useState } from 'preact/hooks'

const KEY = 'india-pmts-tour-seen'

const safeLocal = () => (typeof localStorage !== 'undefined' ? localStorage : null)

export function useFirstVisit(): { firstVisit: boolean; markSeen: () => void } {
  const [firstVisit, setFirstVisit] = useState(false)

  useEffect(() => {
    const ls = safeLocal()
    if (!ls) return
    if (ls.getItem(KEY) !== '1') setFirstVisit(true)
  }, [])

  const markSeen = () => {
    safeLocal()?.setItem(KEY, '1')
    setFirstVisit(false)
  }

  return { firstVisit, markSeen }
}
