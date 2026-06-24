'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { useProductsStore } from '@/store/productsStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useCommitmentStore } from '@/store/commitmentStore'
import { useCalculations } from '@/hooks/useCalculations'
import { buildPortfolioRecommendation, computeCrossGoalSplits, applySplitOverride } from '@/engine/recommendation.engine'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { RiskBadge, Badge } from '@/components/ui/Badge'
import { AllocationPieChart } from './AllocationPieChart'
import { ProductDeepDive, XirrInline } from './ProductDeepDive'
import { getAlternateProduct } from '@/engine/product.engine'
import { formatCurrency } from '@/utils/format.utils'
import type { GoalCategory, CrossGoalProductSplit } from '@/types'

const CURRENT_YEAR = new Date().getFullYear()

// F-09: foundation goals that carry a "Start here" flag (non-negotiable basics).
const FOUNDATION_CATEGORIES: Set<GoalCategory> = new Set([
  'LIFE_PROTECTION', 'CRITICAL_ILLNESS', 'FAMILY_HEALTH',
  'EMERGENCY_FUND', 'RETIREMENT',
])

const PRODUCT_RATIONALE: Partial<Record<string, string>> = {
  MUTUAL_FUND: 'Inflation-beating returns over 5+ years.',
  EQUITY: 'Higher-return potential for 7+ year horizons.',
  SIP: 'Smooths volatility via rupee cost averaging.',
  FIXED_DEPOSIT: 'Capital protection for near-term goals (<3 yrs).',
  PPF: 'Tax-free compounding under Section 80C.',
  NPS: 'Retirement product with equity exposure + tax breaks.',
  GOLD: 'Inflation hedge — cap at 5–10% of portfolio.',
  BONDS: 'Steady income, lower volatility than equity.',
  INSURANCE: 'Term cover protects the plan if income stops.',
}

/**
 * F-09: shows how a shared product's monthly corpus splits across goals (by
 * priority) and lets the RM override this goal's share. Total is conserved.
 */
function CrossGoalSplit({
  split,
  currentGoalId,
  onOverride,
}: {
  split: CrossGoalProductSplit
  currentGoalId: string
  onOverride: (goalId: string, percent: number) => void
}) {
  const current = split.goals.find(g => g.goalId === currentGoalId)
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(current?.percent ?? 0)

  return (
    <div className="rounded-md border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-indigo-800">
          <span className="font-semibold">Shared across goals</span> · split by priority:{' '}
          {split.goals.map((g, i) => (
            <span key={g.goalId}>
              {i > 0 && ' · '}
              <span className={g.goalId === currentGoalId ? 'font-semibold' : ''}>{g.percent}% {g.goalName}</span>
            </span>
          ))}
        </p>
        <button
          type="button"
          onClick={() => { setVal(current?.percent ?? 0); setEditing(e => !e) }}
          className="text-[11px] font-medium text-indigo-600 shrink-0"
        >
          {editing ? 'Cancel' : 'Adjust split'}
        </button>
      </div>
      {editing && (
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-slate-600 shrink-0">This goal&apos;s share</span>
          <input
            type="range" min={0} max={100} value={val}
            onChange={e => setVal(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <span className="text-[11px] font-semibold w-9 text-right">{val}%</span>
          <button
            type="button"
            onClick={() => { onOverride(currentGoalId, val); setEditing(false) }}
            className="text-[11px] bg-indigo-600 text-white px-2 py-0.5 rounded font-medium"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}

export function RecommendationsPage() {
  const profile = useUserStore(s => s.profile)
  const userGoals = useGoalsStore(s => s.userGoals)
  const products = useProductsStore(s => s.products)
  const { recommendation, setRecommendation } = useRecommendationStore()
  const commitment = useCommitmentStore(s => s.commitment)
  const { goalAnalyses } = useCalculations()
  const router = useRouter()
  const lastGoalCount = useRef<number | null>(null)

  function generate() {
    if (!profile || userGoals.length === 0) return
    const reco = buildPortfolioRecommendation(profile, userGoals, goalAnalyses, products)
    setRecommendation(reco)
  }

  // Generate when there's no plan yet, or when the goal set changes within a
  // session. A persisted plan is preserved across navigation so F-09 split
  // overrides survive — use "Refresh" to rebuild from scratch.
  useEffect(() => {
    const goalCountChanged = lastGoalCount.current !== null && lastGoalCount.current !== userGoals.length
    if (!recommendation || goalCountChanged) generate()
    lastGoalCount.current = userGoals.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, userGoals.length])

  // F-09: apply an RM override to a shared product's cross-goal split.
  function handleSplitOverride(productId: string, goalId: string, percent: number) {
    if (!recommendation) return
    setRecommendation(applySplitOverride(recommendation, productId, goalId, percent))
  }

  if (!profile) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-slate-500">Complete the customer profile first to generate a plan.</p>
      </div>
    )
  }

  if (!recommendation) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm">Generating investment plan…</p>
      </div>
    )
  }

  // F-09: products that fund 2+ goals, keyed by product id, for the split display.
  const splitsByProduct = new Map<string, CrossGoalProductSplit>()
  for (const s of computeCrossGoalSplits(recommendation.goalRecommendations, userGoals)) {
    splitsByProduct.set(s.productId, s)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Investment Action Plan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            For {profile.personal.name} · Age {profile.personal.age} · <RiskBadge tier={recommendation.riskTier} />
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={generate}>Refresh</Button>
          <Button variant="secondary" size="sm" onClick={() => router.push('/report')}>Report</Button>
          <Button size="sm" onClick={() => router.push('/commitment')}>Start your plan →</Button>
        </div>
      </div>

      {/* F-04: committed-vs-recommended status */}
      {commitment && commitment.status !== 'PENDING' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 flex items-center justify-between">
          <p className="text-sm text-blue-800">
            {commitment.status === 'DEFERRED_ALL'
              ? 'Plan generated — activation deferred.'
              : <>Client committed <strong>{formatCurrency(commitment.monthlySIPCommitment)}/mo</strong>
                  {commitment.lumpsum > 0 && <> + {formatCurrency(commitment.lumpsum)} lumpsum</>}.</>}
          </p>
          <Button variant="ghost" size="sm" onClick={() => router.push('/commitment')}>Edit</Button>
        </div>
      )}

      {/* Risk override notice */}
      {recommendation.wasRiskOverridden && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          <p className="text-sm text-amber-800">
            Customer&apos;s <strong>{profile.riskProfile.tier}</strong> risk preference is more conservative than
            typical for the <strong>{recommendation.ageGroup.replace('_', '–')} age group</strong>.
            Product recommendations have been adjusted accordingly.
          </p>
        </div>
      )}

      {/* Affordability banner */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${
        recommendation.isAffordable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${recommendation.isAffordable ? 'bg-green-100' : 'bg-red-100'}`}>
            <svg className={`w-4 h-4 ${recommendation.isAffordable ? 'text-green-600' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {recommendation.isAffordable
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              }
            </svg>
          </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${recommendation.isAffordable ? 'text-green-800' : 'text-red-800'}`}>
            {recommendation.isAffordable
              ? `All goals are fundable within the monthly surplus of ${formatCurrency(recommendation.availableSurplus)}`
              : `Goals need ${formatCurrency(recommendation.totalMonthlyRequired)}/month but only ${formatCurrency(recommendation.availableSurplus)} is available`}
          </p>
          {!recommendation.isAffordable && (
            <p className="text-xs text-red-700 mt-1">
              Options to discuss: increase SIP over time with income growth, defer lower-priority goals, or reduce target amounts.
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500 mb-0.5">Total SIP needed</p>
          <p className="text-base font-bold text-slate-900">{formatCurrency(recommendation.totalMonthlyRequired)}<span className="text-xs font-normal text-slate-500">/mo</span></p>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-xs text-slate-500 mb-1">Monthly SIP Needed</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(recommendation.totalMonthlyRequired)}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 mb-1">Surplus Available</p>
          <p className={`text-lg font-bold ${recommendation.isAffordable ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(recommendation.availableSurplus)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 mb-1">Goals Covered</p>
          <p className="text-lg font-bold text-slate-900">{recommendation.goalRecommendations.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 mb-1">Risk Profile</p>
          <RiskBadge tier={recommendation.riskTier} />
        </Card>
      </div>

      {/* Per-goal action cards */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">What to Pitch — Goal by Goal</h2>
        <div className="flex flex-col gap-4">
          {recommendation.goalRecommendations.map(gr => {
            const goal = userGoals.find(g => g.id === gr.goalId)
            if (!goal) return null
            const analysis = goalAnalyses.find(a => a.goalId === gr.goalId)
            const yearsAway = goal.targetYear - CURRENT_YEAR

            // F-03: primary = highest-allocation product for this goal; alternate resolved from master.
            const topAlloc = [...gr.allocations].sort((a, b) => b.allocationPercent - a.allocationPercent)[0]
            const primaryProduct = topAlloc ? products.find(p => p.id === topAlloc.productId) ?? null : null
            const alternateProduct = primaryProduct ? getAlternateProduct(primaryProduct, products) : null

            return (
              <Card key={gr.goalId}>
                {/* Goal header */}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle>{goal.name}</CardTitle>
                        {FOUNDATION_CATEGORIES.has(goal.category) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            ★ Start here
                          </span>
                        )}
                      </div>
                      {goal.currentSavingsForGoal > 0 && (
                        <p className="text-xs text-emerald-700 mt-1">
                          Existing: {formatCurrency(goal.currentSavingsForGoal)} corpus already working toward this goal
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        Target {formatCurrency(goal.targetAmount)} by {goal.targetYear}
                        {analysis && analysis.inflationAdjustedTarget > goal.targetAmount && (
                          <> · Inflation-adjusted: <span className="text-slate-700 font-medium">{formatCurrency(analysis.inflationAdjustedTarget)}</span></>
                        )}
                        {yearsAway > 0 && <> · {yearsAway} yr{yearsAway !== 1 ? 's' : ''} away</>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(gr.totalMonthlySIP)}
                        <span className="text-xs font-normal text-slate-500">/mo</span>
                      </p>
                      {gr.recommendedLumpSum && gr.recommendedLumpSum > 0 && (
                        <p className="text-xs text-slate-400">or {formatCurrency(gr.recommendedLumpSum)} lump sum</p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Warning notes */}
                {gr.notes.map((note, i) => (
                  <div key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                    ⚠ {note}
                  </div>
                ))}

                {/* Product recommendations */}
                {gr.allocations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Products to recommend</p>

                    {/* F-09: per-goal SIP total — per-product split shown in each row below */}
                    {gr.allocations.length > 1 && (
                      <p className="text-[11px] text-slate-500 mb-2">
                        <span className="text-slate-700 font-medium">{formatCurrency(gr.totalMonthlySIP)}/mo</span> across {gr.allocations.length} products
                      </p>
                    )}

                    <div className="flex flex-col gap-2">
                      {gr.allocations.map(alloc => {
                        const product = products.find(p => p.id === alloc.productId)
                        if (!product) return null
                        const rationale = PRODUCT_RATIONALE[product.category] ?? alloc.rationale
                        const split = splitsByProduct.get(alloc.productId)
                        return (
                          <div key={alloc.productId} className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
                              <div className="w-10 text-right shrink-0">
                                <span className="text-sm font-bold text-slate-700">{alloc.allocationPercent}%</span>
                              </div>
                              <div className="w-24 shrink-0">
                                <div className="bg-slate-200 rounded-full h-1.5">
                                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${alloc.allocationPercent}%` }} />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900">{product.name}</p>
                                <p className="text-xs text-slate-500">{rationale}</p>
                                <div className="mt-0.5"><XirrInline product={product} /></div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-semibold text-slate-800">{formatCurrency(alloc.monthlyAmount)}</p>
                                <p className="text-xs text-slate-400">per month</p>
                              </div>
                              {alloc.isRiskOverride && <Badge variant="warning">Adjusted</Badge>}
                            </div>
                            {split && (
                              <CrossGoalSplit
                                split={split}
                                currentGoalId={gr.goalId}
                                onOverride={(goalId, pct) => handleSplitOverride(alloc.productId, goalId, pct)}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* F-03: Recommended vs Alternate deep dive */}
                {primaryProduct && (
                  <ProductDeepDive primary={primaryProduct} alternate={alternateProduct} />
                )}

              </Card>
            )
          })}
        </div>
      </div>

      {/* Overall portfolio mix */}
      {recommendation.overallAllocation.length > 0 && (
        <AllocationPieChart
          allocations={recommendation.overallAllocation}
          products={products}
          totalMonthly={recommendation.totalMonthlyRequired}
        />
      )}
    </div>
  )
}
