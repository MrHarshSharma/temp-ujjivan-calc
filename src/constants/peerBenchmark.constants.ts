import type { AgeGroup } from '@/types'

/**
 * ─── PLACEHOLDER PEER BENCHMARK DATASET (F-01) ───────────────────────────────
 * Static reference data, baked in at build time — no live API calls.
 * Intended source: AMFI Annual Household Finance Survey + RBI Household Finance
 * Committee data. The exact survey YEAR is an open question in the spec — these
 * figures are placeholders pending confirmation of the baseline year. Schema is
 * final; swap the numbers once the source year is confirmed.
 */
export interface PeerBenchmark {
  ageGroup: AgeGroup
  /** Risk-profile distribution across peers in this age band (sums to 100). */
  riskDistribution: { LOW: number; MEDIUM: number; HIGH: number }
  /** Average monthly investable surplus as % of income. */
  avgSurplusPctOfIncome: number
  /** Average SIP commitment as % of income. */
  avgSipPctOfIncome: number
  /** Typical monthly SIP rupee range for this band (for display as a range). */
  sipAmountRange: { min: number; max: number }
}

export const PEER_BENCHMARKS: Record<AgeGroup, PeerBenchmark> = {
  '20_30': {
    ageGroup: '20_30',
    riskDistribution: { LOW: 18, MEDIUM: 42, HIGH: 40 },
    avgSurplusPctOfIncome: 22,
    avgSipPctOfIncome: 16,
    sipAmountRange: { min: 6000, max: 15000 },
  },
  '30_40': {
    ageGroup: '30_40',
    riskDistribution: { LOW: 25, MEDIUM: 45, HIGH: 30 },
    avgSurplusPctOfIncome: 20,
    avgSipPctOfIncome: 18,
    sipAmountRange: { min: 10000, max: 25000 },
  },
  '40_50': {
    ageGroup: '40_50',
    riskDistribution: { LOW: 38, MEDIUM: 42, HIGH: 20 },
    avgSurplusPctOfIncome: 18,
    avgSipPctOfIncome: 15,
    sipAmountRange: { min: 12000, max: 30000 },
  },
  '50_PLUS': {
    ageGroup: '50_PLUS',
    riskDistribution: { LOW: 55, MEDIUM: 33, HIGH: 12 },
    avgSurplusPctOfIncome: 15,
    avgSipPctOfIncome: 12,
    sipAmountRange: { min: 10000, max: 25000 },
  },
}

/** Source label shown alongside the benchmark for transparency. */
export const BENCHMARK_SOURCE = 'AMFI / RBI Household Finance reference (year TBC)'
