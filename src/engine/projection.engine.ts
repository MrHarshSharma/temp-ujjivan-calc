import type { ProjectionDataPoint, UserGoal, UserProfile } from '@/types'
import { fv, projectedIncome, sipFutureValue } from './financial.engine'
import { DEFAULT_RATES } from '@/constants/defaults.constants'

/**
 * Build a year-by-year wealth projection up to retirement age.
 */
export function buildProjection(
  user: UserProfile,
  goals: UserGoal[],
  monthlyInvestment: number,
  blendedReturnPercent: number = DEFAULT_RATES.equityReturnPercent
): ProjectionDataPoint[] {
  const currentYear = new Date().getFullYear()
  const currentAge = user.personal.age
  const yearsUntilRetirement = Math.max(user.personal.retirementAge - currentAge, 1)

  const baseIncome = user.financial.monthlyIncome * 12
  const baseExpenses = user.financial.monthlyExpenses * 12
  const hikeRate = user.financial.expectedHikePercent
  const inflationRate = user.financial.inflationPercent

  // Existing investments current value
  const existingValue = user.financial.existingInvestments.reduce(
    (s, inv) => s + inv.currentValue,
    0
  )
  const existingMonthly = user.financial.existingInvestments.reduce(
    (s, inv) => s + inv.monthlyContribution,
    0
  )

  const points: ProjectionDataPoint[] = []

  for (let y = 0; y <= yearsUntilRetirement; y++) {
    const year = currentYear + y
    const age = currentAge + y

    // Projected income and expenses at year y
    const income = projectedIncome(baseIncome, hikeRate, y)
    const expenses = fv(baseExpenses, inflationRate, y)

    // Total investment made so far (cumulative)
    const totalInvestment = (monthlyInvestment + existingMonthly) * 12 * y

    // Portfolio value: existing investments grown + new SIP contributions
    const existingPortfolioValue = fv(existingValue, blendedReturnPercent, y) +
      sipFutureValue(existingMonthly, blendedReturnPercent, y)
    const newContributionsValue = sipFutureValue(monthlyInvestment, blendedReturnPercent, y)
    let totalValue = existingPortfolioValue + newContributionsValue

    // Deduct lump-sum goal amounts in their target years
    const goalsMilestones: string[] = []
    for (const goal of goals) {
      if (goal.targetYear === year) {
        goalsMilestones.push(goal.name)
        totalValue = Math.max(0, totalValue - goal.targetAmount)
      }
    }

    points.push({
      year,
      age,
      totalInvestment,
      totalValue,
      goalsMilestones,
    })

    // Suppress unused variable warnings
    void income
    void expenses
  }

  return points
}
