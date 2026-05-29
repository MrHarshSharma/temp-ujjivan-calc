'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { UserGoal, GoalAnalysis } from '@/types'
import { formatCurrency, formatYears } from '@/utils/format.utils'

interface StoryMilestone {
  year: number
  age: number
  goal: UserGoal
  analysis: GoalAnalysis
}

export function TimelineStoryCard({
  goals,
  analyses,
  currentAge,
}: {
  goals: UserGoal[]
  analyses: GoalAnalysis[]
  currentAge: number
}) {
  const currentYear = new Date().getFullYear()

  const milestones: StoryMilestone[] = goals
    .map(goal => {
      const analysis = analyses.find(a => a.goalId === goal.id)
      if (!analysis || analysis.yearsToGoal <= 0) return null
      return {
        year: goal.targetYear,
        age: currentAge + analysis.yearsToGoal,
        goal,
        analysis,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.year - b!.year) as StoryMilestone[]

  if (milestones.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer&apos;s Financial Journey</CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          Year-by-year story of goals, milestones, and what it takes to get there
        </p>
      </CardHeader>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[30px] top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="flex flex-col gap-0">
          {/* Today marker */}
          <div className="flex items-center gap-4 pb-6 relative">
            <div className="w-[60px] shrink-0 flex justify-center">
              <div className="w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100 z-10" />
            </div>
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Today — {currentYear}</p>
              <p className="text-sm text-blue-800 mt-0.5">
                Age {currentAge} · Starting the plan now. Every month invested today is worth more tomorrow.
              </p>
            </div>
          </div>

          {milestones.map((m, i) => {
            const isFunded = m.analysis.savingsGap <= 0
            const isAtRisk = !m.analysis.isAchievable
            const shortfall = m.analysis.savingsGap

            const statusColor = isFunded
              ? 'border-green-200 bg-green-50'
              : isAtRisk
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50'

            const dotColor = isFunded
              ? 'bg-green-500 ring-green-100'
              : isAtRisk
              ? 'bg-red-500 ring-red-100'
              : 'bg-amber-500 ring-amber-100'

            const yearsFromNow = m.year - currentYear

            return (
              <div key={m.goal.id} className={`flex items-start gap-4 relative ${i < milestones.length - 1 ? 'pb-6' : ''}`}>
                <div className="w-[60px] shrink-0 flex flex-col items-center gap-1 pt-3">
                  <div className={`w-4 h-4 rounded-full ring-4 z-10 ${dotColor}`} />
                  <span className="text-xs font-bold text-slate-700">{m.year}</span>
                </div>

                <div className={`flex-1 border rounded-lg p-4 ${statusColor}`}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{m.goal.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Age {Math.round(m.age)} · {formatYears(yearsFromNow)} from now
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0
                      ${isFunded ? 'bg-green-200 text-green-800' : isAtRisk ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                      {isFunded ? 'Funded ✓' : isAtRisk ? 'At Risk' : 'Needs SIP'}
                    </span>
                  </div>

                  {/* Story sentence */}
                  <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                    {isFunded
                      ? `Customer will have enough to cover this goal. The inflation-adjusted cost will be ${formatCurrency(m.analysis.inflationAdjustedTarget)} and current savings are on track.`
                      : isAtRisk
                      ? `This goal needs ${formatCurrency(m.analysis.requiredMonthlyContribution)}/month but exceeds the available surplus. Without action, there will be a ${formatCurrency(shortfall)} shortfall in ${m.year}.`
                      : `Requires ${formatCurrency(m.analysis.requiredMonthlyContribution)}/month starting today. The cost in ${m.year} will be ${formatCurrency(m.analysis.inflationAdjustedTarget)} after inflation.`
                    }
                  </p>

                  {/* Key numbers */}
                  <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200/60">
                    <div>
                      <p className="text-xs text-slate-500">Target (today)</p>
                      <p className="text-xs font-semibold text-slate-800">{formatCurrency(m.goal.targetAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Inflation-adjusted</p>
                      <p className="text-xs font-semibold text-slate-800">{formatCurrency(m.analysis.inflationAdjustedTarget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Monthly SIP needed</p>
                      <p className={`text-xs font-semibold ${isAtRisk ? 'text-red-700' : 'text-slate-800'}`}>
                        {formatCurrency(m.analysis.requiredMonthlyContribution)}/mo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
