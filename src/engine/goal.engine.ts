import type { UserGoal, GoalAnalysis, FinancialDetails } from '@/types'
import { fv, pv, requiredSIP, inflationAdjustedFV, sipFutureValue } from './financial.engine'
import { DEFAULT_RATES } from '@/constants/defaults.constants'

const DEFAULT_RETURN = DEFAULT_RATES.equityReturnPercent

/**
 * Analyse a single goal — compute inflation-adjusted target, required SIP, and achievability.
 */
export function analyzeGoal(
  goal: UserGoal,
  financial: FinancialDetails,
  currentYear: number,
  availableMonthlySurplus: number,
  expectedReturnPercent: number = DEFAULT_RETURN
): GoalAnalysis {
  const yearsToGoal = goal.targetYear - currentYear

  // Goal already passed
  if (yearsToGoal <= 0) {
    const isAchieved = goal.currentSavingsForGoal >= goal.targetAmount
    return {
      goalId: goal.id,
      inflationAdjustedTarget: goal.targetAmount,
      yearsToGoal: 0,
      requiredMonthlyContribution: 0,
      lumpSumEquivalent: 0,
      savingsGap: Math.max(0, goal.targetAmount - goal.currentSavingsForGoal),
      isAchievable: isAchieved,
      projectedValueAtGoalYear: goal.currentSavingsForGoal,
    }
  }

  const inflation = financial.inflationPercent
  const nominalTarget = inflationAdjustedFV(goal.targetAmount, inflation, yearsToGoal)

  // Future value of existing savings toward this goal
  const existingSavingsFV = fv(goal.currentSavingsForGoal, expectedReturnPercent, yearsToGoal)

  // Shortfall after existing savings grow
  const shortfall = Math.max(0, nominalTarget - existingSavingsFV)

  // Required monthly SIP for the shortfall
  const requiredMonthly = shortfall > 0
    ? requiredSIP(shortfall, expectedReturnPercent, yearsToGoal)
    : 0

  // Lump sum equivalent (PV of the shortfall)
  const lumpSumEquivalent = shortfall > 0
    ? pv(shortfall, expectedReturnPercent, yearsToGoal)
    : 0

  // Projected value if current monthly capacity is maintained
  const projectedValueAtGoalYear =
    existingSavingsFV +
    sipFutureValue(
      Math.min(availableMonthlySurplus, requiredMonthly),
      expectedReturnPercent,
      yearsToGoal
    )

  return {
    goalId: goal.id,
    inflationAdjustedTarget: nominalTarget,
    yearsToGoal,
    requiredMonthlyContribution: requiredMonthly,
    lumpSumEquivalent,
    savingsGap: Math.max(0, nominalTarget - projectedValueAtGoalYear),
    isAchievable: requiredMonthly <= availableMonthlySurplus,
    projectedValueAtGoalYear,
  }
}

/**
 * Analyse all goals, allocating surplus greedily by priority (HIGH → MEDIUM → LOW).
 */
export function analyzeAllGoals(
  goals: UserGoal[],
  financial: FinancialDetails,
  currentYear: number,
  monthlySurplusBeforeGoals: number,
  expectedReturnPercent: number = DEFAULT_RETURN
): GoalAnalysis[] {
  const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  const sorted = [...goals].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  )

  let remainingSurplus = monthlySurplusBeforeGoals
  const analyses: GoalAnalysis[] = []

  for (const goal of sorted) {
    const analysis = analyzeGoal(
      goal,
      financial,
      currentYear,
      remainingSurplus,
      expectedReturnPercent
    )
    analyses.push(analysis)
    remainingSurplus = Math.max(0, remainingSurplus - analysis.requiredMonthlyContribution)
  }

  // Return in original order
  return goals.map(g => analyses.find(a => a.goalId === g.id)!)
}
