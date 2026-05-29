'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { useProductsStore } from '@/store/productsStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useCalculations } from '@/hooks/useCalculations'
import { buildPortfolioRecommendation } from '@/engine/recommendation.engine'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { RiskBadge, Badge } from '@/components/ui/Badge'
import { AllocationPieChart } from './AllocationPieChart'
import { formatCurrency } from '@/utils/format.utils'
import type { GoalCategory } from '@/types'

const CURRENT_YEAR = new Date().getFullYear()

const GOAL_TIPS: Partial<Record<GoalCategory, string>> = {
  RETIREMENT: 'Ask when they picture stopping work. Link the SIP to that specific retirement date to make it concrete.',
  EDUCATION: "Ask about the child's current age and which college they're aiming for — ambitious parents respond to corpus numbers tied to specific institutions.",
  EMERGENCY_FUND: 'Frame this as "sleep money" — the amount that means no panic if income stops for 6 months.',
  HOME_PURCHASE: 'Show the down payment as the first milestone, not the full property cost. Smaller number, easier commitment.',
  REAL_ESTATE: 'Ask if this is for self-use or investment. The answer changes how you frame returns.',
  CHILDS_MARRIAGE: 'Ask what kind of wedding they envision. Cultural context makes this goal feel real and urgent.',
  OWN_MARRIAGE: 'Keep it light — ask what the dream day looks like, then work backwards from the cost.',
  VEHICLE: 'Ask if they want to avoid a loan. Frame the SIP as "own it outright, pay no interest".',
  TRAVEL: 'People underestimate travel costs — show the inflation-adjusted number, it usually surprises them.',
  BUSINESS: 'Ask if they have a target year in mind for starting. A date drives commitment.',
  CRITICAL_ILLNESS: 'Mention that 1 in 5 people face a critical illness before 60. Personalises the risk.',
  LIFE_PROTECTION: 'Ask about dependents — spouse, parents, children. The number of dependents drives the cover conversation.',
  FAMILY_HEALTH: 'Hospital costs double every 7 years. Show what a 5-day ICU stay costs today vs at retirement.',
  GOLD_PURCHASE: 'Suggest sovereign gold bonds or gold ETFs over physical gold — better returns and no storage risk.',
  LOAN_FORECLOSURE: 'Calculate the total interest saved by foreclosing early — that number is usually the strongest motivator.',
  LEGACY_INHERITANCE: "Ask what they want to leave behind for their family. Let them answer first, then present the numbers.",
  SABBATICAL: 'Frame it as "financial independence for a year" — sounds more achievable than a career break.',
  CHARITY: 'Mention 80G tax deductions if applicable. Makes it an easier yes.',
}

const PRODUCT_RATIONALE: Partial<Record<string, string>> = {
  MUTUAL_FUND: 'Equity mutual funds deliver inflation-beating returns over long horizons (5+ years).',
  EQUITY: 'Direct equity for higher risk tolerance and long time horizons (7+ years).',
  SIP: 'Systematic investment smooths out market volatility through rupee cost averaging.',
  FIXED_DEPOSIT: 'Capital protection with guaranteed returns — best for near-term goals (< 3 years).',
  PPF: 'Tax-free compounding under Section 80C — ideal for long-term retirement building.',
  NPS: 'Government-backed retirement product with equity exposure and additional tax benefits.',
  GOLD: 'Hedge against inflation and currency risk — limit to 5–10% of overall portfolio.',
  BONDS: 'Steady income with lower volatility than equity — suitable for conservative allocations.',
  INSURANCE: 'Term cover to protect the entire financial plan if income stops unexpectedly.',
}

export function RecommendationsPage() {
  const profile = useUserStore(s => s.profile)
  const userGoals = useGoalsStore(s => s.userGoals)
  const products = useProductsStore(s => s.products)
  const { recommendation, setRecommendation } = useRecommendationStore()
  const { goalAnalyses } = useCalculations()

  function generate() {
    if (!profile || userGoals.length === 0) return
    const reco = buildPortfolioRecommendation(profile, userGoals, goalAnalyses, products)
    setRecommendation(reco)
  }

  // Auto-generate on mount and when goals change
  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, userGoals.length])

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
        <Button variant="secondary" size="sm" onClick={generate}>Refresh</Button>
      </div>

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
            const tip = GOAL_TIPS[goal.category]
            const yearsAway = goal.targetYear - CURRENT_YEAR

            return (
              <Card key={gr.goalId}>
                {/* Goal header */}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <CardTitle>{goal.name}</CardTitle>
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
                    <div className="flex flex-col gap-2">
                      {gr.allocations.map(alloc => {
                        const product = products.find(p => p.id === alloc.productId)
                        if (!product) return null
                        const rationale = PRODUCT_RATIONALE[product.category] ?? alloc.rationale
                        return (
                          <div key={alloc.productId} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
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
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold text-slate-800">{formatCurrency(alloc.monthlyAmount)}</p>
                              <p className="text-xs text-slate-400">per month</p>
                            </div>
                            {alloc.isRiskOverride && <Badge variant="warning">Adjusted</Badge>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Manager conversation tip */}
                {tip && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                    <span className="text-blue-400 shrink-0 text-sm mt-0.5">💬</span>
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Conversation tip: </span>{tip}
                    </p>
                  </div>
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
