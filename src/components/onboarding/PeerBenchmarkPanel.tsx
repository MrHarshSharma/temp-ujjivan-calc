'use client'

import type { RiskTier } from '@/types'
import { getPeerBenchmark, pctMoreAggressiveThan, pctBalancedOrAggressive } from '@/engine/benchmark.engine'
import { BENCHMARK_SOURCE } from '@/constants/peerBenchmark.constants'
import { formatCurrency } from '@/utils/format.utils'

const TIER_LABEL: Record<RiskTier, string> = {
  LOW: 'Conservative',
  MEDIUM: 'Balanced',
  HIGH: 'Aggressive',
}

/**
 * F-01 peer benchmark — advisory only. Surfaces a data-backed reference point
 * after the risk profile is chosen. Never changes the client's selection.
 * Renders nothing until age is known.
 */
export function PeerBenchmarkPanel({ age, tier }: { age: number; tier: RiskTier | null }) {
  if (!age || age <= 0 || !tier) return null

  const b = getPeerBenchmark(age)
  const moreAggressive = pctMoreAggressiveThan(tier, b)
  const balancedOrAbove = pctBalancedOrAggressive(b)

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-indigo-900">How peers your age invest</p>
        <span className="text-[10px] text-indigo-400 uppercase tracking-wide">Reference only</span>
      </div>

      {/* Comparison headline */}
      <p className="text-sm text-indigo-800">
        At age {age}, <strong>{balancedOrAbove}%</strong> of investors in your bracket have a
        Balanced or Aggressive risk profile. Your current selection is <strong>{TIER_LABEL[tier]}</strong>.
      </p>

      {/* Three peer data points */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-white rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-indigo-700">{moreAggressive}%</p>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">take more risk than you</p>
        </div>
        <div className="bg-white rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-indigo-700">{b.avgSurplusPctOfIncome}%</p>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">avg investable surplus of income</p>
        </div>
        <div className="bg-white rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-indigo-700">{b.avgSipPctOfIncome}%</p>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">avg SIP of income</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mt-2">
        Peers your age invest {formatCurrency(b.sipAmountRange.min)}–{formatCurrency(b.sipAmountRange.max)} per month on average.
      </p>

      <p className="text-[10px] text-slate-400 mt-2">Source: {BENCHMARK_SOURCE}</p>
    </div>
  )
}
