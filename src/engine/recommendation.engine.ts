import type {
  AgeGroup,
  CrossGoalProductSplit,
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

// ─── F-09: cross-goal corpus split ────────────────────────────────────────────

/**
 * Priority order used to rank goals when one product is split across several
 * (spec: Insurance > Emergency > Retirement > Education > Assets > Lifestyle).
 * Lower number = higher priority = larger share shown first.
 */
const GOAL_CATEGORY_PRIORITY: Record<GoalCategory, number> = {
  LIFE_PROTECTION: 0, CRITICAL_ILLNESS: 0, FAMILY_HEALTH: 0, MEDICAL_CORPUS: 0,
  EMERGENCY_FUND: 1,
  RETIREMENT: 2,
  EDUCATION: 3, CHILD_BIRTH: 3,
  HOME_PURCHASE: 4, REAL_ESTATE: 4, VEHICLE: 4, BUSINESS: 4, GOLD_PURCHASE: 4, LOAN_FORECLOSURE: 4,
  TRAVEL: 5, MARRIAGE: 5, CHILDS_MARRIAGE: 5, OWN_MARRIAGE: 5,
  SABBATICAL: 5, CHARITY: 5, LEGACY_INHERITANCE: 5, CUSTOM: 5,
}

/** Rank a goal for cross-goal splits: explicit priority first, then category order. */
export function goalPriorityRank(goal: UserGoal): number {
  const tier = { HIGH: 0, MEDIUM: 1, LOW: 2 }[goal.priority]
  return tier * 100 + (GOAL_CATEGORY_PRIORITY[goal.category] ?? 99)
}

/**
 * F-09: for every product that funds two or more goals, compute how its total
 * monthly corpus divides across those goals, sorted by goal priority.
 */
export function computeCrossGoalSplits(
  goalRecommendations: GoalRecommendation[],
  goals: UserGoal[]
): CrossGoalProductSplit[] {
  const byProduct = new Map<string, { goalId: string; amount: number }[]>()
  for (const gr of goalRecommendations) {
    for (const a of gr.allocations) {
      if (!byProduct.has(a.productId)) byProduct.set(a.productId, [])
      byProduct.get(a.productId)!.push({ goalId: gr.goalId, amount: a.monthlyAmount })
    }
  }

  const splits: CrossGoalProductSplit[] = []
  for (const [productId, entries] of byProduct) {
    if (entries.length < 2) continue
    const total = entries.reduce((s, e) => s + e.amount, 0)
    if (total <= 0) continue

    const ranked = entries
      .map(e => {
        const goal = goals.find(g => g.id === e.goalId)
        return {
          goalId: e.goalId,
          goalName: goal?.name ?? 'Goal',
          monthlyAmount: e.amount,
          percent: Math.round((e.amount / total) * 100),
          rank: goal ? goalPriorityRank(goal) : 999,
        }
      })
      .sort((a, b) => a.rank - b.rank)

    splits.push({
      productId,
      totalMonthly: total,
      goals: ranked.map(g => ({
        goalId: g.goalId,
        goalName: g.goalName,
        monthlyAmount: g.monthlyAmount,
        percent: g.percent,
      })),
    })
  }
  return splits
}

/**
 * F-09: RM override of a product's split. Sets `goalId`'s share of the product
 * to `newPercent` and redistributes the rest across the product's other goals
 * proportionally. The product's total monthly amount is conserved, so the
 * overall plan total is unchanged — only per-goal SIPs shift.
 */
export function applySplitOverride(
  rec: PortfolioRecommendation,
  productId: string,
  goalId: string,
  newPercent: number
): PortfolioRecommendation {
  const pct = Math.max(0, Math.min(100, Math.round(newPercent)))
  const entries = rec.goalRecommendations
    .map(gr => ({ goalId: gr.goalId, alloc: gr.allocations.find(a => a.productId === productId) }))
    .filter((x): x is { goalId: string; alloc: ProductAllocation } => !!x.alloc)

  const total = entries.reduce((s, e) => s + e.alloc.monthlyAmount, 0)
  if (entries.length < 2 || total <= 0) return rec

  const others = entries.filter(e => e.goalId !== goalId)
  const othersTotal = others.reduce((s, e) => s + e.alloc.monthlyAmount, 0)
  const targetAmount = (pct / 100) * total
  const remaining = total - targetAmount

  const next: PortfolioRecommendation = JSON.parse(JSON.stringify(rec))
  for (const gr of next.goalRecommendations) {
    const alloc = gr.allocations.find(a => a.productId === productId)
    if (!alloc) continue
    if (gr.goalId === goalId) {
      alloc.monthlyAmount = targetAmount
    } else {
      const prev = rec.goalRecommendations
        .find(g => g.goalId === gr.goalId)!
        .allocations.find(a => a.productId === productId)!.monthlyAmount
      const share = othersTotal > 0 ? prev / othersTotal : 1 / others.length
      alloc.monthlyAmount = remaining * share
    }
  }

  // Recompute totals + within-goal percentages for every affected goal.
  for (const gr of next.goalRecommendations) {
    if (!gr.allocations.some(a => a.productId === productId)) continue
    const goalTotal = gr.allocations.reduce((s, a) => s + a.monthlyAmount, 0)
    gr.totalMonthlySIP = goalTotal
    gr.allocations.forEach(a => {
      a.allocationPercent = goalTotal > 0 ? Math.round((a.monthlyAmount / goalTotal) * 100) : 0
    })
  }

  next.totalMonthlyRequired = next.goalRecommendations.reduce((s, g) => s + g.totalMonthlySIP, 0)
  next.isAffordable = next.totalMonthlyRequired <= next.availableSurplus
  return next
}
