/**
 * Pure financial calculation functions.
 * No side effects, no React imports — fully unit-testable.
 */

import type { CashflowSummary, GoalAnalysis } from '@/types'

/** Future Value of a lump sum: FV = PV × (1 + r)^n */
export function fv(presentValue: number, annualRatePercent: number, years: number): number {
  if (years <= 0) return presentValue
  const r = annualRatePercent / 100
  return presentValue * Math.pow(1 + r, years)
}

/** Present Value of a future lump sum: PV = FV / (1 + r)^n */
export function pv(futureValue: number, annualRatePercent: number, years: number): number {
  if (years <= 0) return futureValue
  const r = annualRatePercent / 100
  return futureValue / Math.pow(1 + r, years)
}

/**
 * Future Value of a SIP (ordinary annuity, monthly compounding)
 * FV = PMT × [((1 + r/12)^(n×12) - 1) / (r/12)]
 */
export function sipFutureValue(
  monthlyContribution: number,
  annualRatePercent: number,
  years: number
): number {
  if (years <= 0) return 0
  if (annualRatePercent === 0) return monthlyContribution * years * 12
  const r = annualRatePercent / 100 / 12
  const n = years * 12
  return monthlyContribution * ((Math.pow(1 + r, n) - 1) / r)
}

/**
 * Required monthly SIP to accumulate a future value
 * PMT = FV × (r/12) / ((1 + r/12)^(n×12) - 1)
 */
export function requiredSIP(
  futureValue: number,
  annualRatePercent: number,
  years: number
): number {
  if (years <= 0) return futureValue
  if (annualRatePercent === 0) return futureValue / (years * 12)
  const r = annualRatePercent / 100 / 12
  const n = years * 12
  return futureValue * r / (Math.pow(1 + r, n) - 1)
}

/**
 * Inflation-adjusted Future Value (nominal cost of a real amount)
 * nominalFV = realAmount × (1 + inflation)^years
 */
export function inflationAdjustedFV(
  realAmount: number,
  inflationRatePercent: number,
  years: number
): number {
  return fv(realAmount, inflationRatePercent, years)
}

/**
 * Real rate of return (Fisher equation)
 * realRate = (1 + nominalRate) / (1 + inflationRate) - 1
 */
export function realReturnRate(
  nominalRatePercent: number,
  inflationRatePercent: number
): number {
  const nominal = nominalRatePercent / 100
  const inflation = inflationRatePercent / 100
  return ((1 + nominal) / (1 + inflation) - 1) * 100
}

/** Projected income with annual hike: income × (1 + hikeRate)^years */
export function projectedIncome(
  currentIncome: number,
  hikeRatePercent: number,
  years: number
): number {
  return fv(currentIncome, hikeRatePercent, years)
}

/** Tax-adjusted return: nominalReturn × (1 - taxRate) */
export function taxAdjustedReturn(
  nominalRatePercent: number,
  taxRatePercent: number
): number {
  return nominalRatePercent * (1 - taxRatePercent / 100)
}

/** Compute cashflow summary from income, expenses, goal contributions, existing contributions */
export function computeCashflow(
  monthlyIncome: number,
  monthlyExpenses: number,
  goalAnalyses: GoalAnalysis[],
  monthlyExistingContributions: number
): CashflowSummary {
  const monthlyGoalContributions = goalAnalyses.reduce(
    (sum, g) => sum + Math.max(0, g.requiredMonthlyContribution),
    0
  )
  const monthlySurplus =
    monthlyIncome - monthlyExpenses - monthlyGoalContributions - monthlyExistingContributions

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyGoalContributions,
    monthlyExistingContributions,
    monthlySurplus,
    annualIncome: monthlyIncome * 12,
    annualExpenses: monthlyExpenses * 12,
    savingsRate: monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0,
  }
}
