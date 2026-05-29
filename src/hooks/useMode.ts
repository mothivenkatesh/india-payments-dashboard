/**
 * useMode — a tiny module-scoped store for the global Volume/Value toggle.
 * Reads/writes localStorage and broadcasts changes to every subscribed
 * component, so one click in the sidebar flips every Vol/Val toggle on
 * every page.
 */
import { useEffect, useState } from 'preact/hooks'

export type Mode = 'vol' | 'val'
const KEY = 'india-pmts-mode'

const safeLocal = () => (typeof localStorage !== 'undefined' ? localStorage : null)

const initial: Mode = (() => {
  const ls = safeLocal()
  const stored = ls?.getItem(KEY)
  return stored === 'vol' || stored === 'val' ? stored : 'val'
})()

let current: Mode = initial
const listeners = new Set<(m: Mode) => void>()

export function setMode(m: Mode): void {
  if (m === current) return
  current = m
  safeLocal()?.setItem(KEY, m)
  listeners.forEach(fn => fn(m))
}

export function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setLocal] = useState<Mode>(current)
  useEffect(() => {
    listeners.add(setLocal)
    setLocal(current)
    return () => { listeners.delete(setLocal) }
  }, [])
  return [mode, setMode]
}
