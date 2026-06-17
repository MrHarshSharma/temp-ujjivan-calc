import type { GoalAnalysis, PortfolioRecommendation, ProductMaster, UserGoal, UserProfile } from '@/types'
import { formatCurrency } from '@/utils/format.utils'

/**
 * F-10: build the natural-language session context injected into the assistant's
 * system prompt so answers cite the specific client's numbers.
 */
export function buildChatContext(
  profile: UserProfile | null,
  goals: UserGoal[],
  analyses: GoalAnalysis[],
  recommendation: PortfolioRecommendation | null,
  products: ProductMaster[]
): string {
  if (!profile) return ''

  const lines: string[] = []
  const p = profile.personal
  const f = profile.financial

  lines.push(`Client: ${p.name}, age ${p.age}, retirement age ${p.retirementAge}, ${p.dependents} dependent(s).`)
  lines.push(`Risk profile: ${profile.riskProfile.tier} (${profile.riskProfile.method.toLowerCase()}).`)
  lines.push(`Monthly income: ${formatCurrency(f.monthlyIncome, false)}; expenses: ${formatCurrency(f.monthlyExpenses, false)}; assumed inflation ${f.inflationPercent}%.`)

  if (goals.length) {
    lines.push('\nGoals:')
    for (const g of goals) {
      const a = analyses.find(x => x.goalId === g.id)
      const sip = a ? `${formatCurrency(a.requiredMonthlyContribution, false)}/mo` : 'n/a'
      const target = a ? formatCurrency(a.inflationAdjustedTarget, false) : formatCurrency(g.targetAmount, false)
      lines.push(`- ${g.name} (${g.category}): target ${target} by ${g.targetYear}, required SIP ${sip}.`)
    }
  }

  if (recommendation) {
    lines.push(`\nTotal monthly SIP required: ${formatCurrency(recommendation.totalMonthlyRequired, false)}; available surplus: ${formatCurrency(recommendation.availableSurplus, false)}; affordable: ${recommendation.isAffordable ? 'yes' : 'no'}.`)
    lines.push('Recommended products by goal:')
    for (const gr of recommendation.goalRecommendations) {
      const goal = goals.find(g => g.id === gr.goalId)
      const names = gr.allocations
        .map(al => products.find(pr => pr.id === al.productId)?.name)
        .filter(Boolean)
        .join(', ')
      if (goal && names) lines.push(`- ${goal.name}: ${names}.`)
    }
  }

  return lines.join('\n')
}
