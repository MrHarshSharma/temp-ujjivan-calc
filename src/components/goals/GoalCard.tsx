'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PriorityBadge, Badge } from '@/components/ui/Badge'
import { useGoalsStore } from '@/store/goalsStore'
import type { UserGoal, GoalAnalysis } from '@/types'
import { formatCurrency, formatYears } from '@/utils/format.utils'

export function GoalCard({
  goal,
  analysis,
  onEdit,
}: {
  goal: UserGoal
  analysis: GoalAnalysis | null
  onEdit: () => void
}) {
  const removeGoal = useGoalsStore(s => s.removeGoal)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const currentYear = new Date().getFullYear()
  const yearsLeft = goal.targetYear - currentYear

  const isAchievable = analysis?.isAchievable ?? true

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-semibold text-slate-900">{goal.name}</h3>
            <PriorityBadge priority={goal.priority} />
            {yearsLeft <= 0
              ? <Badge variant="muted">Past Due</Badge>
              : !isAchievable
              ? <Badge variant="danger">At Risk</Badge>
              : <Badge variant="success">On Track</Badge>
            }
          </div>
          <p className="text-xs text-slate-500">Target year: {goal.targetYear} · {yearsLeft > 0 ? formatYears(yearsLeft) + ' away' : 'Due'}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
          {confirmDelete
            ? (
              <div className="flex gap-1">
                <Button variant="danger" size="sm" onClick={() => removeGoal(goal.id)}>Confirm</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            )
            : <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-red-500">Delete</Button>
          }
        </div>
      </div>

      {/* Analysis metrics */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Target (inflation-adj.)</p>
            <p className="text-sm font-semibold text-slate-900">{formatCurrency(analysis.inflationAdjustedTarget)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Required SIP</p>
            <p className={`text-sm font-semibold ${!isAchievable ? 'text-red-600' : 'text-slate-900'}`}>
              {formatCurrency(analysis.requiredMonthlyContribution)}/mo
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Lump Sum Alt.</p>
            <p className="text-sm font-semibold text-slate-900">{formatCurrency(analysis.lumpSumEquivalent)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Savings Gap</p>
            <p className={`text-sm font-semibold ${analysis.savingsGap > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {analysis.savingsGap > 0 ? formatCurrency(analysis.savingsGap) : 'Funded ✓'}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
