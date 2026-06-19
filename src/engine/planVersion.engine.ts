import type {
  CommitmentRecord,
  GoalAnalysis,
  PlanChange,
  PlanSnapshot,
  PortfolioRecommendation,
  ProductMaster,
  UserGoal,
  UserProfile,
} from '@/types'
import { formatCurrency } from '@/utils/format.utils'

/** F-11: capture the current plan as an immutable snapshot for versioning. */
export function buildSnapshot(
  profile: UserProfile,
  goals: UserGoal[],
  analyses: GoalAnalysis[],
  recommendation: PortfolioRecommendation | null,
  products: ProductMaster[],
  commitment: CommitmentRecord | null
): PlanSnapshot {
  const snapshotGoals = goals.map(g => {
    const analysis = analyses.find(a => a.goalId === g.id)
    const gr = recommendation?.goalRecommendations.find(r => r.goalId === g.id)
    const productNames = (gr?.allocations ?? [])
      .map(al => products.find(p => p.id === al.productId)?.name)
      .filter((n): n is string => Boolean(n))
    return {
      id: g.id,
      name: g.name,
      category: g.category,
      targetAmount: g.targetAmount,
      targetYear: g.targetYear,
      requiredMonthlySIP: Math.round(analysis?.requiredMonthlyContribution ?? 0),
      products: productNames,
    }
  })

  return {
    clientId: profile.id,
    clientName: profile.personal.name,
    generatedAt: new Date().toISOString(),
    monthlyIncome: profile.financial.monthlyIncome,
    monthlyExpenses: profile.financial.monthlyExpenses,
    riskTier: profile.riskProfile.tier,
    goals: snapshotGoals,
    totalMonthlySIP: Math.round(recommendation?.totalMonthlyRequired ?? 0),
    committedMonthlySIP: commitment?.monthlySIPCommitment ?? null,
    lumpsum: commitment?.lumpsum ?? null,
    commitmentStatus: commitment?.status ?? null,
  }
}

/**
 * F-11: diff two snapshots into a human-readable change log.
 * Detects income/expense/risk/SIP/commitment changes and goals added/removed
 * or with changed SIP/products.
 */
export function diffSnapshots(prev: PlanSnapshot, next: PlanSnapshot): PlanChange[] {
  const changes: PlanChange[] = []
  const money = (n: number) => formatCurrency(n, false)

  if (prev.monthlyIncome !== next.monthlyIncome) {
    changes.push({ label: 'Monthly income', oldValue: money(prev.monthlyIncome), newValue: money(next.monthlyIncome) })
  }
  if (prev.monthlyExpenses !== next.monthlyExpenses) {
    changes.push({ label: 'Monthly expenses', oldValue: money(prev.monthlyExpenses), newValue: money(next.monthlyExpenses) })
  }
  if (prev.riskTier !== next.riskTier) {
    changes.push({ label: 'Risk profile', oldValue: prev.riskTier, newValue: next.riskTier })
  }
  if (prev.totalMonthlySIP !== next.totalMonthlySIP) {
    changes.push({ label: 'Total monthly SIP', oldValue: money(prev.totalMonthlySIP), newValue: money(next.totalMonthlySIP) })
  }

  const prevGoals = new Map(prev.goals.map(g => [g.id, g]))
  const nextGoals = new Map(next.goals.map(g => [g.id, g]))

  for (const g of next.goals) {
    if (!prevGoals.has(g.id)) {
      changes.push({ label: `Goal added — ${g.name}`, oldValue: '—', newValue: `${money(g.targetAmount)} by ${g.targetYear}` })
    }
  }
  for (const g of prev.goals) {
    if (!nextGoals.has(g.id)) {
      changes.push({ label: `Goal removed — ${g.name}`, oldValue: `${money(g.targetAmount)} by ${g.targetYear}`, newValue: '—' })
    }
  }
  for (const g of next.goals) {
    const old = prevGoals.get(g.id)
    if (!old) continue
    if (old.requiredMonthlySIP !== g.requiredMonthlySIP) {
      changes.push({ label: `Monthly SIP — ${g.name}`, oldValue: money(old.requiredMonthlySIP), newValue: money(g.requiredMonthlySIP) })
    }
    if (old.products.join(', ') !== g.products.join(', ')) {
      changes.push({ label: `Products — ${g.name}`, oldValue: old.products.join(', ') || '—', newValue: g.products.join(', ') || '—' })
    }
  }

  if (prev.commitmentStatus !== next.commitmentStatus) {
    changes.push({ label: 'Commitment status', oldValue: prev.commitmentStatus ?? '—', newValue: next.commitmentStatus ?? '—' })
  }

  return changes
}
