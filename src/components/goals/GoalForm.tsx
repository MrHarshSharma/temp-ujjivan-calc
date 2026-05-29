'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useGoalsStore } from '@/store/goalsStore'
import type { UserGoal, GoalPriority, GoalCategory } from '@/types'
import { formatCurrency } from '@/utils/format.utils'

const CURRENT_YEAR = new Date().getFullYear()

const CATEGORY_OPTIONS: { value: GoalCategory; label: string }[] = [
  { value: 'RETIREMENT', label: 'Retirement Corpus' },
  { value: 'EDUCATION', label: "Child's Higher Education" },
  { value: 'CHILDS_MARRIAGE', label: "Child's Marriage" },
  { value: 'OWN_MARRIAGE', label: 'Own Marriage' },
  { value: 'HOME_PURCHASE', label: 'Home Downpayment' },
  { value: 'REAL_ESTATE', label: 'Real Estate Purchase' },
  { value: 'VEHICLE', label: 'Luxury Car Purchase' },
  { value: 'TRAVEL', label: 'Annual Vacation' },
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund' },
  { value: 'BUSINESS', label: 'Business Capital' },
  { value: 'LEGACY_INHERITANCE', label: 'Legacy / Inheritance' },
  { value: 'LOAN_FORECLOSURE', label: 'Loan Foreclosure' },
  { value: 'CRITICAL_ILLNESS', label: 'Critical Illness Cover' },
  { value: 'LIFE_PROTECTION', label: 'Life Protection' },
  { value: 'FAMILY_HEALTH', label: 'Family Health Cover' },
  { value: 'GOLD_PURCHASE', label: 'Purchase of Gold' },
  { value: 'SABBATICAL', label: 'Sabbatical / Career Break' },
  { value: 'CHARITY', label: 'Charity / Philanthropy' },
  { value: 'CHILD_BIRTH', label: 'Child Birth & Early Years' },
  { value: 'MEDICAL_CORPUS', label: 'Medical Corpus' },
  { value: 'MARRIAGE', label: 'Marriage (General)' },
  { value: 'CUSTOM', label: 'Custom' },
]

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'LOW', label: 'Low Priority' },
]

export function GoalForm({ goal, onClose }: { goal: UserGoal | null; onClose: () => void }) {
  const addGoal = useGoalsStore(s => s.addGoal)
  const updateGoal = useGoalsStore(s => s.updateGoal)

  const [form, setForm] = useState({
    name: goal?.name ?? '',
    category: goal?.category ?? 'CUSTOM' as GoalCategory,
    targetAmount: goal?.targetAmount ?? 0,
    targetYear: goal?.targetYear ?? CURRENT_YEAR + 5,
    currentSavingsForGoal: goal?.currentSavingsForGoal ?? 0,
    priority: goal?.priority ?? 'MEDIUM' as GoalPriority,
    notes: goal?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Goal name is required'
    if (form.targetAmount <= 0) e.targetAmount = 'Target amount must be greater than 0'
    if (form.targetYear <= CURRENT_YEAR) e.targetYear = 'Target year must be in the future'
    if (form.currentSavingsForGoal < 0) e.currentSavingsForGoal = 'Cannot be negative'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    if (goal) {
      updateGoal(goal.id, form)
    } else {
      addGoal({ ...form, status: 'NOT_STARTED' })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={goal ? 'Edit Goal' : 'Add New Goal'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{goal ? 'Save Changes' : 'Add Goal'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Goal Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          error={errors.name}
          placeholder="e.g. Down payment for apartment"
        />
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value as GoalCategory }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Target Amount (today's value)"
            type="number"
            value={form.targetAmount || ''}
            onChange={e => setForm(f => ({ ...f, targetAmount: Number(e.target.value) }))}
            error={errors.targetAmount}
            prefix="₹"
            hint={form.targetAmount ? formatCurrency(form.targetAmount, false) : undefined}
          />
          <Input
            label="Target Year"
            type="number"
            value={form.targetYear}
            onChange={e => setForm(f => ({ ...f, targetYear: Number(e.target.value) }))}
            error={errors.targetYear}
            min={CURRENT_YEAR + 1}
            hint={`${form.targetYear - CURRENT_YEAR} years from now`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Already Saved"
            type="number"
            value={form.currentSavingsForGoal || ''}
            onChange={e => setForm(f => ({ ...f, currentSavingsForGoal: Number(e.target.value) }))}
            error={errors.currentSavingsForGoal}
            prefix="₹"
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value as GoalPriority }))}
          />
        </div>
        <Input
          label="Notes (optional)"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Any additional details..."
        />
      </div>
    </Modal>
  )
}
