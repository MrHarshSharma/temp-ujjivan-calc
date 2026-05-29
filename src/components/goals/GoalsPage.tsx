'use client'

import { useState } from 'react'
import { useGoalsStore } from '@/store/goalsStore'
import { useCalculations } from '@/hooks/useCalculations'
import { Button } from '@/components/ui/Button'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'
import type { UserGoal } from '@/types'

export function GoalsPage() {
  const userGoals = useGoalsStore(s => s.userGoals)
  const { goalAnalyses } = useCalculations()
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null)

  function handleEdit(goal: UserGoal) {
    setEditingGoal(goal)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingGoal(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goals</h1>
          <p className="text-sm text-slate-500 mt-0.5">{userGoals.length} goal{userGoals.length !== 1 ? 's' : ''} planned</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Goal</Button>
      </div>

      {userGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No goals yet</h2>
          <p className="text-slate-500 text-sm mt-1 mb-4">Add your first financial goal to start planning</p>
          <Button onClick={() => setShowForm(true)}>Add Your First Goal</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {userGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              analysis={goalAnalyses.find(a => a.goalId === goal.id) ?? null}
              onEdit={() => handleEdit(goal)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <GoalForm
          goal={editingGoal}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
