import type { RiskTier } from '@/types'
import { PEER_BENCHMARKS, type PeerBenchmark } from '@/constants/peerBenchmark.constants'
import { getAgeGroup } from './recommendation.engine'

/** F-01: resolve the peer benchmark for a given age. */
export function getPeerBenchmark(age: number): PeerBenchmark {
  return PEER_BENCHMARKS[getAgeGroup(age)]
}

/** % of peers with a strictly more aggressive risk profile than the given tier. */
export function pctMoreAggressiveThan(tier: RiskTier, b: PeerBenchmark): number {
  const d = b.riskDistribution
  if (tier === 'LOW') return d.MEDIUM + d.HIGH
  if (tier === 'MEDIUM') return d.HIGH
  return 0
}

/** % of peers with a Balanced (Medium) or Aggressive (High) profile. */
export function pctBalancedOrAggressive(b: PeerBenchmark): number {
  return b.riskDistribution.MEDIUM + b.riskDistribution.HIGH
}

export type NudgeTone = 'green' | 'amber' | 'red'

/**
 * Compare the user's value (e.g. surplus or SIP % of income) against the peer
 * average. Green if at/above average, amber if within 5pp below, red if more
 * than 5pp below. Advisory only — never mutates the user's choice.
 */
export function compareToPeerAverage(userPct: number, peerAvgPct: number): NudgeTone {
  if (userPct >= peerAvgPct) return 'green'
  if (peerAvgPct - userPct <= 5) return 'amber'
  return 'red'
}
