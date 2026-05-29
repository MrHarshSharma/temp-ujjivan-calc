'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useGoalsStore } from '@/store/goalsStore'
import { useUserStore } from '@/store/userStore'
import type { GoalTemplate, UserGoal, GoalPriority } from '@/types'
import { formatCurrency } from '@/utils/format.utils'

const CURRENT_YEAR = new Date().getFullYear()

const priorityOptions = [
  { value: 'HIGH', label: 'High Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'LOW', label: 'Low Priority' },
]

export function GoalSelectionStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const templates = useGoalsStore(s => s.templates)
  const userGoals = useGoalsStore(s => s.userGoals)
  const addGoal = useGoalsStore(s => s.addGoal)
  const removeGoal = useGoalsStore(s => s.removeGoal)
  const profile = useUserStore(s => s.profile)

  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)
  const [goalForm, setGoalForm] = useState<Partial<UserGoal>>({})
  const [error, setError] = useState('')
  const [finishError, setFinishError] = useState('')

  function openModal(template: GoalTemplate) {
    setSelectedTemplate(template)
    setGoalForm({
      name: template.name,
      category: template.category,
      targetAmount: template.defaultAmount ?? 500000,
      targetYear: CURRENT_YEAR + (template.defaultTargetYears ?? 5),
      currentSavingsForGoal: 0,
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
    })
    setError('')
  }

  function closeModal() {
    setSelectedTemplate(null)
    setGoalForm({})
    setError('')
  }

  function handleTemplateClick(template: GoalTemplate) {
    const existing = userGoals.find(g => g.templateId === template.id)
    if (existing) {
      removeGoal(existing.id)
      return
    }
    openModal(template)
  }

  function saveGoal() {
    if (!selectedTemplate || !goalForm.targetAmount || !goalForm.targetYear) {
      setError('Please fill in all required fields')
      return
    }
    if (goalForm.targetYear! <= CURRENT_YEAR) {
      setError('Target year must be in the future')
      return
    }
    addGoal({
      templateId: selectedTemplate.id,
      name: goalForm.name ?? selectedTemplate.name,
      category: goalForm.category ?? selectedTemplate.category,
      targetAmount: goalForm.targetAmount!,
      targetYear: goalForm.targetYear!,
      currentSavingsForGoal: goalForm.currentSavingsForGoal ?? 0,
      priority: goalForm.priority as GoalPriority ?? 'MEDIUM',
      status: 'NOT_STARTED',
      notes: goalForm.notes,
    })
    closeModal()
  }

  function handleFinish() {
    if (userGoals.length === 0) {
      setFinishError('Please select at least one goal to continue')
      return
    }
    const hasEmergencyFund = userGoals.some(g => g.category === 'EMERGENCY_FUND')
    if (!hasEmergencyFund && profile?.financial.monthlyExpenses) {
      const emergencyTarget = profile.financial.monthlyExpenses * profile.financial.emergencyFundMonths
      addGoal({
        templateId: 'tpl_emergency',
        name: 'Emergency Fund',
        category: 'EMERGENCY_FUND',
        targetAmount: emergencyTarget,
        targetYear: CURRENT_YEAR + 1,
        currentSavingsForGoal: 0,
        priority: 'HIGH',
        status: 'NOT_STARTED',
      })
    }
    onNext()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">What are you saving towards?</h2>
        <p className="text-sm text-slate-500 mt-0.5">Pick the life goals you&apos;d like to plan for — you can always add more later</p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-2">
        {templates.map(t => {
          const added = userGoals.some(g => g.templateId === t.id)
          return (
            <button
              key={t.id}
              onClick={() => handleTemplateClick(t)}
              className={`text-left p-3 rounded-lg border-2 transition-colors
                ${added
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 bg-white'}`}
            >
              <div className="font-medium text-sm text-slate-900">{t.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>
              {added && <div className="text-xs text-blue-600 font-medium mt-1">✓ Added</div>}
            </button>
          )
        })}
      </div>

      {/* Added goals list */}
      {userGoals.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Your goals so far ({userGoals.length})</h3>
          {userGoals.map(g => (
            <div key={g.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
              <div>
                <span className="text-sm font-medium text-slate-900">{g.name}</span>
                <span className="text-xs text-slate-500 ml-2">{formatCurrency(g.targetAmount)} by {g.targetYear}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeGoal(g.id)} className="text-red-500 !p-1 text-xs">Remove</Button>
            </div>
          ))}
        </div>
      )}

      {finishError && <p className="text-sm text-red-600">{finishError}</p>}

      <div className="flex gap-3 mt-2">
        <Button variant="secondary" onClick={onBack} className="flex-1 justify-center">← Back</Button>
        <Button onClick={handleFinish} className="flex-1 justify-center">Generate Plan →</Button>
      </div>

      {/* Goal config modal */}
      {selectedTemplate && (
        <Modal
          open
          onClose={closeModal}
          size="lg"
          title={`Tell us more about your ${selectedTemplate.name} goal`}
          footer={
            <>
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button onClick={saveGoal}>Add Goal</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="How much do you need? (today's value)"
                type="number"
                value={goalForm.targetAmount || ''}
                onChange={e => setGoalForm(f => ({ ...f, targetAmount: Number(e.target.value) }))}
                prefix="₹"
                hint={goalForm.targetAmount ? formatCurrency(goalForm.targetAmount, false) : undefined}
              />
              <Input
                label="When do you want to achieve this?"
                type="number"
                value={goalForm.targetYear || ''}
                onChange={e => setGoalForm(f => ({ ...f, targetYear: Number(e.target.value) }))}
                min={CURRENT_YEAR + 1}
                hint={goalForm.targetYear ? `${goalForm.targetYear - CURRENT_YEAR} years away` : undefined}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="How much have you already saved for this?"
                type="number"
                value={goalForm.currentSavingsForGoal || ''}
                onChange={e => setGoalForm(f => ({ ...f, currentSavingsForGoal: Number(e.target.value) }))}
                prefix="₹"
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={goalForm.priority ?? 'MEDIUM'}
                onChange={e => setGoalForm(f => ({ ...f, priority: e.target.value as GoalPriority }))}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}
