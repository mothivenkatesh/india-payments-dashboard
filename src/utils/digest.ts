import type { UPIPoint, MonthlyCardsAggregate } from '../types'
import { consecutiveTrend } from './anomaly'

export function generateUPIDigest(points: UPIPoint[]): string[] {
  if (points.length < 13) return []
  const latest = points[points.length - 1]
  const yearAgo = points[points.length - 13]
  const sentences: string[] = []

  // YoY
  if (yearAgo.value > 0) {
    const yoy = ((latest.value - yearAgo.value) / yearAgo.value) * 100
    const volYoy = yearAgo.volume > 0 ? ((latest.volume - yearAgo.volume) / yearAgo.volume) * 100 : 0
    sentences.push(
      `UPI settled ₹${(latest.value / 100000).toFixed(2)}L Cr this month — ` +
      `${yoy.toFixed(0)}% above the same month last year, with ${volYoy.toFixed(0)}% more transactions.`
    )
  }

  // MoM signal
  if (latest.momValue !== undefined) {
    const dir = latest.momValue >= 0 ? 'up' : 'down'
    const valStreak = consecutiveTrend(points.map(p => p.value))
    if (Math.abs(valStreak) >= 3) {
      sentences.push(
        `Value is ${dir} ${Math.abs(latest.momValue).toFixed(1)}% MoM — ` +
        `${Math.abs(valStreak)} consecutive months of ${valStreak > 0 ? 'growth' : 'decline'}.`
      )
    } else {
      sentences.push(
        `Value ${dir} ${Math.abs(latest.momValue).toFixed(1)}% MoM; ` +
        `volume ${latest.momVolume !== undefined ? (latest.momVolume >= 0 ? 'up' : 'down') + ' ' + Math.abs(latest.momVolume).toFixed(1) + '%' : 'unchanged'}.`
      )
    }
  }

  return sentences.slice(0, 2)
}

export function generateCardsDigest(monthly: MonthlyCardsAggregate[]): string[] {
  if (monthly.length < 2) return []
  const latest = monthly[monthly.length - 1]
  const sentences: string[] = []

  // DC POS trend
  const dcPosValues = monthly.map(m => m.dcPosVal)
  const dcPosStreak = consecutiveTrend(dcPosValues)
  if (dcPosStreak <= -2) {
    sentences.push(
      `Debit card merchant swipes declined for ${Math.abs(dcPosStreak)} consecutive months — ` +
      `UPI substitution at POS is compounding.`
    )
  }

  // CC vs DC divergence
  if (latest.momCC !== undefined && latest.momDC !== undefined) {
    if (latest.momCC > 2 && latest.momDC < -1) {
      sentences.push(`Credit up ${latest.momCC.toFixed(1)}%, debit down ${Math.abs(latest.momDC).toFixed(1)}% — credit-debit gap widening.`)
    }
  }

  return sentences.slice(0, 2)
}

export function generateCrossRailLine(upi: UPIPoint | undefined, cards: MonthlyCardsAggregate | undefined): string {
  if (!upi || !cards) return ''
  const totalCards = cards.ccTotalSpend + cards.dcTotalSpend
  if (totalCards === 0) return ''
  const ratio = upi.value / totalCards
  return `UPI moves ${ratio.toFixed(0)}× more value than all card spend combined.`
}
