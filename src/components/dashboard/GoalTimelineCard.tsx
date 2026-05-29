'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PriorityBadge } from '@/components/ui/Badge'
import type { UserGoal, GoalAnalysis } from '@/types'
import { formatCurrency, formatYears } from '@/utils/format.utils'

export function GoalTimelineCard({
  goals,
  analyses,
}: {
  goals: UserGoal[]
  analyses: GoalAnalysis[]
}) {
  const currentYear = new Date().getFullYear()
  const sorted = [...goals].sort((a, b) => a.targetYear - b.targetYear)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Timeline</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-3">
        {sorted.map(goal => {
          const analysis = analyses.find(a => a.goalId === goal.id)
          const yearsLeft = goal.targetYear - currentYear
          const progressPct = analysis
            ? Math.min(100, (goal.currentSavingsForGoal / Math.max(1, analysis.inflationAdjustedTarget)) * 100)
            : 0

          return (
            <div key={goal.id} className="flex items-start gap-4">
              <div className="w-12 text-center shrink-0">
                <div className="text-sm font-bold text-slate-900">{goal.targetYear}</div>
                <div className="text-xs text-slate-400">{yearsLeft > 0 ? `${yearsLeft}yr` : 'due'}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900 truncate">{goal.name}</span>
                  <PriorityBadge priority={goal.priority} />
                  {analysis && !analysis.isAchievable && yearsLeft > 0 && (
                    <span className="text-xs text-red-600 font-medium">At risk</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mb-1.5">
                  Target: {analysis ? formatCurrency(analysis.inflationAdjustedTarget) : formatCurrency(goal.targetAmount)} (inflation-adjusted)
                  {analysis && analysis.requiredMonthlyContribution > 0 && (
                    <> · SIP: {formatCurrency(analysis.requiredMonthlyContribution)}/mo</>
                  )}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
