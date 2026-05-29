import type { UserProfile, UserGoal, GoalAnalysis, PortfolioRecommendation } from '@/types'
import { getAgeGroup } from './recommendation.engine'
import { formatCurrency } from '@/utils/format.utils'

export type PointSeverity = 'info' | 'warning' | 'action' | 'positive'

export interface TalkingPoint {
  id: string
  severity: PointSeverity
  headline: string
  detail: string
}

/**
 * Generates a list of talking points for the manager to use during the customer meeting.
 * Each point has a headline (spoken quickly) and a detail (elaboration if needed).
 */
export function generateTalkingPoints(
  profile: UserProfile,
  goals: UserGoal[],
  analyses: GoalAnalysis[],
  recommendation: PortfolioRecommendation | null
): TalkingPoint[] {
  const points: TalkingPoint[] = []
  const { personal, financial, riskProfile } = profile
  const currentYear = new Date().getFullYear()
  const ageGroup = getAgeGroup(personal.age)
  const yearsToRetirement = personal.retirementAge - personal.age
  const monthlySurplus = financial.monthlyIncome - financial.monthlyExpenses -
    financial.existingInvestments.reduce((s, i) => s + i.monthlyContribution, 0)

  // ── Risk vs Age ───────────────────────────────────────────────────────────
  if (riskProfile.tier === 'LOW' && (ageGroup === '20_30' || ageGroup === '30_40')) {
    points.push({
      id: 'risk_conservative_young',
      severity: 'warning',
      headline: `Customer is Conservative but only ${personal.age} years old`,
      detail: `At this age, a Conservative profile limits long-term growth. Discuss whether fear of loss or lack of knowledge is the reason — equity exposure is generally safe over a 10+ year horizon.`,
    })
  }

  if (riskProfile.tier === 'HIGH' && ageGroup === '50_PLUS') {
    points.push({
      id: 'risk_aggressive_old',
      severity: 'warning',
      headline: `Customer is Aggressive but ${personal.age} years old — close to retirement`,
      detail: `With ${yearsToRetirement} years to retirement, high-risk allocation may not allow enough time to recover from market downturns. Recommend gradually shifting to balanced or conservative products.`,
    })
  }

  // ── Dependents & Insurance ────────────────────────────────────────────────
  if (personal.dependents > 0) {
    const hasLifeGoal = goals.some(g => g.category === 'LIFE_PROTECTION')
    if (!hasLifeGoal) {
      points.push({
        id: 'insurance_missing',
        severity: 'action',
        headline: `Customer has ${personal.dependents} dependent(s) — no life protection goal set`,
        detail: `Term insurance is the most critical first step for anyone with dependents. A cover of ${formatCurrency(financial.monthlyIncome * 12 * 10)} (10x annual income) is the minimum recommended.`,
      })
    }
  }

  if (personal.dependents === 0) {
    points.push({
      id: 'no_dependents',
      severity: 'info',
      headline: 'No financial dependents — insurance need is lower',
      detail: `Customer can focus surplus on wealth creation. Term insurance is still advisable for loan liabilities or future family planning.`,
    })
  }

  // ── Emergency Fund ────────────────────────────────────────────────────────
  const hasEmergencyFund = goals.some(g => g.category === 'EMERGENCY_FUND')
  if (!hasEmergencyFund) {
    points.push({
      id: 'emergency_missing',
      severity: 'action',
      headline: 'No emergency fund planned',
      detail: `Customer should first build ${financial.emergencyFundMonths} months of expenses (${formatCurrency(financial.monthlyExpenses * financial.emergencyFundMonths)}) in a liquid fund before committing to long-term goals.`,
    })
  }

  // ── Savings Rate ──────────────────────────────────────────────────────────
  const savingsRate = financial.monthlyIncome > 0
    ? ((financial.monthlyIncome - financial.monthlyExpenses) / financial.monthlyIncome) * 100
    : 0

  if (savingsRate < 20) {
    points.push({
      id: 'low_savings_rate',
      severity: 'warning',
      headline: `Savings rate is only ${savingsRate.toFixed(0)}% — below the recommended 20%`,
      detail: `Customer spends ${formatCurrency(financial.monthlyExpenses)}/month out of ${formatCurrency(financial.monthlyIncome)} income. Discuss areas where expenses can be reduced to free up SIP capacity.`,
    })
  } else if (savingsRate >= 30) {
    points.push({
      id: 'high_savings_rate',
      severity: 'positive',
      headline: `Strong savings rate of ${savingsRate.toFixed(0)}% — good discipline`,
      detail: `Customer saves ${formatCurrency(financial.monthlyIncome - financial.monthlyExpenses)}/month. This is a strong foundation — ensure it is being channelled into goal-linked investments rather than idle savings accounts.`,
    })
  }

  // ── Goal Gaps ─────────────────────────────────────────────────────────────
  const atRiskGoals = analyses.filter(a => !a.isAchievable && a.yearsToGoal > 0)
  if (atRiskGoals.length > 0) {
    atRiskGoals.forEach(a => {
      const goal = goals.find(g => g.id === a.goalId)
      if (!goal) return
      points.push({
        id: `gap_${goal.id}`,
        severity: 'warning',
        headline: `"${goal.name}" goal needs ${formatCurrency(a.requiredMonthlyContribution)}/mo — may exceed surplus`,
        detail: `The inflation-adjusted target is ${formatCurrency(a.inflationAdjustedTarget)} by ${goal.targetYear}. Current savings gap is ${formatCurrency(a.savingsGap)}. Options: increase SIP, extend timeline, or reduce target amount.`,
      })
    })
  }

  // ── Retirement proximity ──────────────────────────────────────────────────
  if (yearsToRetirement <= 10) {
    const retirementGoal = goals.find(g => g.category === 'RETIREMENT')
    const retirementAnalysis = retirementGoal ? analyses.find(a => a.goalId === retirementGoal.id) : null
    points.push({
      id: 'retirement_near',
      severity: retirementAnalysis?.isAchievable === false ? 'action' : 'warning',
      headline: `Only ${yearsToRetirement} years to retirement — focus on capital preservation`,
      detail: retirementAnalysis
        ? `Retirement corpus target: ${formatCurrency(retirementAnalysis.inflationAdjustedTarget)}. Required SIP: ${formatCurrency(retirementAnalysis.requiredMonthlyContribution)}/month. Shift allocation toward debt and balanced funds.`
        : `Retirement corpus planning is critical at this stage. Ensure equity exposure is being reduced and stable income products are prioritised.`,
    })
  }

  if (yearsToRetirement > 20) {
    points.push({
      id: 'retirement_far',
      severity: 'positive',
      headline: `${yearsToRetirement} years to retirement — compounding works in customer's favour`,
      detail: `Starting early is the biggest advantage. Even a SIP of ${formatCurrency(5000)}/month at 12% for ${yearsToRetirement} years grows significantly. Encourage starting now rather than delaying.`,
    })
  }

  // ── Risk override ─────────────────────────────────────────────────────────
  if (recommendation?.wasRiskOverridden) {
    points.push({
      id: 'risk_override',
      severity: 'info',
      headline: `Products adjusted to match customer's ${riskProfile.tier} risk profile, not age group default`,
      detail: `Age group (${ageGroup.replace('_', '–')} yrs) typically suggests a higher risk allocation, but customer's declared risk preference has been honoured. Revisit if customer is open to a more growth-oriented allocation.`,
    })
  }

  // ── Existing investments ──────────────────────────────────────────────────
  if (financial.existingInvestments.length > 0) {
    const existingTotal = financial.existingInvestments.reduce((s, i) => s + i.currentValue, 0)
    points.push({
      id: 'existing_investments',
      severity: 'positive',
      headline: `Customer already has ${formatCurrency(existingTotal)} in existing investments`,
      detail: `These have been factored into goal calculations. Review if existing products overlap with new recommendations — avoid duplication and check if returns are competitive.`,
    })
  }

  // ── Multiple high-priority goals ─────────────────────────────────────────
  const highPriorityGoals = goals.filter(g => g.priority === 'HIGH')
  if (highPriorityGoals.length > 3) {
    points.push({
      id: 'too_many_high_priority',
      severity: 'warning',
      headline: `${highPriorityGoals.length} goals marked HIGH priority — all cannot be funded simultaneously`,
      detail: `Help customer rank these: ${highPriorityGoals.map(g => g.name).join(', ')}. Spreading surplus too thin reduces progress on all goals. Focus top 2–3 and defer others.`,
    })
  }

  // ── Positive close ────────────────────────────────────────────────────────
  const achievableCount = analyses.filter(a => a.isAchievable && a.yearsToGoal > 0).length
  if (achievableCount > 0 && achievableCount === analyses.filter(a => a.yearsToGoal > 0).length) {
    points.push({
      id: 'all_achievable',
      severity: 'positive',
      headline: `All ${achievableCount} goals are achievable with current income`,
      detail: `Customer's financial profile is well-positioned. Reinforce the importance of consistency — staying invested through market cycles is key to achieving these milestones.`,
    })
  }

  return points
}
