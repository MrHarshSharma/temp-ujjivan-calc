'use client'

import { useMemo } from 'react'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { analyzeAllGoals } from '@/engine/goal.engine'
import { computeCashflow } from '@/engine/financial.engine'
import { buildProjection } from '@/engine/projection.engine'
import type { CashflowSummary, GoalAnalysis, ProjectionDataPoint } from '@/types'
import { DEFAULT_RATES } from '@/constants/defaults.constants'

interface CalculationsResult {
  cashflow: CashflowSummary | null
  goalAnalyses: GoalAnalysis[]
  projection: ProjectionDataPoint[]
  availableSurplus: number
  surplusBeforeGoals: number
}

export function useCalculations(): CalculationsResult {
  const profile = useUserStore(s => s.profile)
  const userGoals = useGoalsStore(s => s.userGoals)

  return useMemo(() => {
    if (!profile) {
      return { cashflow: null, goalAnalyses: [], projection: [], availableSurplus: 0, surplusBeforeGoals: 0 }
    }

    const currentYear = new Date().getFullYear()
    const { financial } = profile

    const monthlyExistingContributions = financial.existingInvestments.reduce(
      (s, inv) => s + inv.monthlyContribution,
      0
    )
    const surplusBeforeGoals =
      financial.monthlyIncome - financial.monthlyExpenses - monthlyExistingContributions

    const goalAnalyses = analyzeAllGoals(
      userGoals,
      financial,
      currentYear,
      surplusBeforeGoals,
      DEFAULT_RATES.equityReturnPercent
    )

    const cashflow = computeCashflow(
      financial.monthlyIncome,
      financial.monthlyExpenses,
      goalAnalyses,
      monthlyExistingContributions
    )

    const monthlyGoalContributions = goalAnalyses.reduce(
      (s, a) => s + Math.max(0, a.requiredMonthlyContribution),
      0
    )

    const projection = buildProjection(
      profile,
      userGoals,
      monthlyGoalContributions,
      DEFAULT_RATES.equityReturnPercent
    )

    return {
      cashflow,
      goalAnalyses,
      projection,
      availableSurplus: cashflow.monthlySurplus,
      surplusBeforeGoals,
    }
  }, [profile, userGoals])
}
