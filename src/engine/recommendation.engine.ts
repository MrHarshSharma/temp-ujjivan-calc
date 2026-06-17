import type {
  AgeGroup,
  GoalAnalysis,
  GoalCategory,
  GoalRecommendation,
  PortfolioRecommendation,
  ProductAllocation,
  ProductMaster,
  RiskTier,
  UserGoal,
  UserProfile,
} from '@/types'
import { AGE_GROUP_DEFINITIONS } from '@/constants/ageGroups.constants'
import { formatCurrency } from '@/utils/format.utils'
import { applyRiskPriorityRule, isRiskCompatible } from './risk.engine'

/** Map age to AgeGroup */
export function getAgeGroup(age: number): AgeGroup {
  if (age < 30) return '20_30'
  if (age < 40) return '30_40'
  if (age < 50) return '40_50'
  return '50_PLUS'
}

/** Get the default risk suggestion for an age group */
export function getAgeGroupRiskSuggestion(ageGroup: AgeGroup): RiskTier {
  return AGE_GROUP_DEFINITIONS.find(a => a.group === ageGroup)!.defaultRiskSuggestion
}

/**
 * Filter products suitable for a given age group, risk tier, and goal category.
 * Risk compatibility: user with LOW gets only LOW products; MEDIUM gets LOW+MEDIUM; HIGH gets all.
 */
export function getCandidateProducts(
  ageGroup: AgeGroup,
  effectiveRiskTier: RiskTier,
  goalCategory: GoalCategory,
  products: ProductMaster[],
  yearsToGoal: number
): ProductMaster[] {
  return products
    .filter(p => p.isActive)
    .filter(p => p.suitableAgeGroups.includes(ageGroup))
    .filter(p => isRiskCompatible(p.riskTier, effectiveRiskTier))
    .filter(p => p.suitableGoalCategories.includes(goalCategory))
    .filter(p => {
      // Exclude equity for goals with < 3 years horizon
      if (yearsToGoal < 3 && (p.category === 'EQUITY' || p.category === 'MUTUAL_FUND' && p.riskTier === 'HIGH')) {
        return false
      }
      // Exclude FD for retirement goals with > 10 years (real returns likely negative)
      if (goalCategory === 'RETIREMENT' && yearsToGoal > 10 && p.category === 'FIXED_DEPOSIT') {
        return false
      }
      // Emergency fund: only liquid products
      if (goalCategory === 'EMERGENCY_FUND' && p.liquidityScore < 4) {
        return false
      }
      return true
    })
    .sort((a, b) => b.expectedReturnPercent - a.expectedReturnPercent)
}

/** Predefined allocation templates per risk tier */
const ALLOCATION_TEMPLATES: Record<RiskTier, { category: string; percent: number }[]> = {
  LOW: [
    { category: 'BONDS', percent: 30 },
    { category: 'FIXED_DEPOSIT', percent: 25 },
    { category: 'PPF', percent: 20 },
    { category: 'MUTUAL_FUND', percent: 15 }, // debt MF
    { category: 'GOLD', percent: 10 },
  ],
  MEDIUM: [
    { category: 'MUTUAL_FUND', percent: 35 }, // equity MF / SIP
    { category: 'SIP', percent: 20 },
    { category: 'FIXED_DEPOSIT', percent: 15 },
    { category: 'PPF', percent: 15 },
    { category: 'GOLD', percent: 10 },
    { category: 'NPS', percent: 5 },
  ],
  HIGH: [
    { category: 'MUTUAL_FUND', percent: 35 }, // equity MF
    { category: 'EQUITY', percent: 25 },
    { category: 'SIP', percent: 20 },
    { category: 'NPS', percent: 10 },
    { category: 'GOLD', percent: 10 },
  ],
}

/**
 * Build product allocations for a single goal.
 * Maps allocation template percentages to actual available products.
 */
export function buildGoalAllocations(
  candidates: ProductMaster[],
  effectiveRiskTier: RiskTier,
  totalMonthlySIP: number,
  wasOverridden: boolean
): ProductAllocation[] {
  if (candidates.length === 0 || totalMonthlySIP <= 0) return []

  const template = ALLOCATION_TEMPLATES[effectiveRiskTier]
  const allocations: ProductAllocation[] = []
  let usedPercent = 0

  for (const slot of template) {
    const match = candidates.find(p => p.category === slot.category)
    if (!match) continue

    // Cap any single product at 40% (diversification rule)
    const cappedPercent = Math.min(slot.percent, 40)
    const monthlyAmount = (cappedPercent / 100) * totalMonthlySIP

    allocations.push({
      productId: match.id,
      allocationPercent: cappedPercent,
      monthlyAmount,
      rationale: `${cappedPercent}% allocation based on ${effectiveRiskTier} risk profile`,
      isRiskOverride: wasOverridden,
    })
    usedPercent += cappedPercent
  }

  // Redistribute any remaining % to the first candidate
  const remaining = 100 - usedPercent
  if (remaining > 0 && allocations.length > 0) {
    allocations[0].allocationPercent += remaining
    allocations[0].monthlyAmount += (remaining / 100) * totalMonthlySIP
  }

  // Normalise percentages to exactly 100
  const totalPercent = allocations.reduce((s, a) => s + a.allocationPercent, 0)
  if (totalPercent > 0) {
    allocations.forEach(a => {
      a.allocationPercent = Math.round((a.allocationPercent / totalPercent) * 100)
    })
  }

  return allocations
}

/** Build the full portfolio recommendation */
export function buildPortfolioRecommendation(
  user: UserProfile,
  goals: UserGoal[],
  analyses: GoalAnalysis[],
  products: ProductMaster[]
): PortfolioRecommendation {
  const ageGroup = getAgeGroup(user.personal.age)
  const ageGroupSuggestion = getAgeGroupRiskSuggestion(ageGroup)
  const { effectiveTier, wasOverridden } = applyRiskPriorityRule(
    ageGroupSuggestion,
    user.riskProfile.tier
  )

  const monthlyExistingContributions = user.financial.existingInvestments.reduce(
    (s, inv) => s + inv.monthlyContribution,
    0
  )
  const availableSurplus =
    user.financial.monthlyIncome -
    user.financial.monthlyExpenses -
    monthlyExistingContributions

  const goalRecommendations: GoalRecommendation[] = goals.map(goal => {
    const analysis = analyses.find(a => a.goalId === goal.id)!
    const candidates = getCandidateProducts(
      ageGroup,
      effectiveTier,
      goal.category,
      products,
      analysis.yearsToGoal
    )

    const needsInsurance =
      user.personal.dependents > 0 &&
      !candidates.some(p => p.category === 'INSURANCE')

    if (needsInsurance) {
      const insurance = products.find(p => p.category === 'INSURANCE' && p.isActive && p.id === 'prod_term_insurance')
      if (insurance) candidates.push(insurance)
    }

    const needsPPFOrNPS =
      user.personal.retirementAge - user.personal.age <= 15 &&
      !candidates.some(p => p.category === 'PPF' || p.category === 'NPS')

    if (needsPPFOrNPS) {
      const ppf = products.find(p => p.category === 'PPF' && p.isActive)
      if (ppf) candidates.push(ppf)
    }

    const totalMonthlySIP = analysis.requiredMonthlyContribution
    const allocations = buildGoalAllocations(candidates, effectiveTier, totalMonthlySIP, wasOverridden)

    const notes: string[] = []
    if (wasOverridden) {
      notes.push(`Your risk profile (${user.riskProfile.tier}) is more conservative than typical for age group ${ageGroup}. Recommendations adjusted accordingly.`)
    }
    if (!analysis.isAchievable) {
      notes.push(`This goal requires ${formatCurrency(totalMonthlySIP, false)}/month which exceeds your available surplus.`)
    }

    return {
      goalId: goal.id,
      allocations,
      totalMonthlySIP,
      recommendedLumpSum: analysis.lumpSumEquivalent > 0 ? analysis.lumpSumEquivalent : undefined,
      notes,
    }
  })

  const totalMonthlyRequired = goalRecommendations.reduce((s, g) => s + g.totalMonthlySIP, 0)

  // Aggregate overall allocation across all goals
  const allocationMap = new Map<string, ProductAllocation>()
  for (const gr of goalRecommendations) {
    for (const alloc of gr.allocations) {
      if (allocationMap.has(alloc.productId)) {
        const existing = allocationMap.get(alloc.productId)!
        existing.monthlyAmount += alloc.monthlyAmount
      } else {
        allocationMap.set(alloc.productId, { ...alloc })
      }
    }
  }

  const overallTotal = Array.from(allocationMap.values()).reduce((s, a) => s + a.monthlyAmount, 0)
  const overallAllocation = Array.from(allocationMap.values()).map(a => ({
    ...a,
    allocationPercent: overallTotal > 0 ? Math.round((a.monthlyAmount / overallTotal) * 100) : 0,
  }))

  return {
    userId: user.id,
    generatedAt: new Date().toISOString(),
    ageGroup,
    riskTier: effectiveTier,
    wasRiskOverridden: wasOverridden,
    overallAllocation,
    goalRecommendations,
    totalMonthlyRequired,
    availableSurplus,
    isAffordable: totalMonthlyRequired <= availableSurplus,
  }
}
