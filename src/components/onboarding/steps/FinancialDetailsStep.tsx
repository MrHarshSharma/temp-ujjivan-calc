'use client'

import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUserStore } from '@/store/userStore'
import type { ExistingInvestment, FinancialDetails } from '@/types'
import { DEFAULT_RATES } from '@/constants/defaults.constants'
import { formatCurrency } from '@/utils/format.utils'

export function FinancialDetailsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const profile = useUserStore(s => s.profile)
  const setFinancialDetails = useUserStore(s => s.setFinancialDetails)

  const [form, setForm] = useState<FinancialDetails>({
    monthlyIncome: profile?.financial.monthlyIncome ?? 0,
    monthlyExpenses: profile?.financial.monthlyExpenses ?? 0,
    existingInvestments: profile?.financial.existingInvestments ?? [],
    emergencyFundMonths: profile?.financial.emergencyFundMonths ?? 6,
    expectedHikePercent: profile?.financial.expectedHikePercent ?? DEFAULT_RATES.expectedHikePercent,
    inflationPercent: profile?.financial.inflationPercent ?? DEFAULT_RATES.inflationPercent,
    taxBracketPercent: profile?.financial.taxBracketPercent ?? DEFAULT_RATES.taxBracketPercent,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const surplus = form.monthlyIncome - form.monthlyExpenses

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (form.monthlyIncome <= 0) e.monthlyIncome = 'Income must be greater than 0'
    if (form.monthlyExpenses < 0) e.monthlyExpenses = 'Cannot be negative'
    if (form.monthlyExpenses >= form.monthlyIncome) e.monthlyExpenses = 'Expenses must be less than income'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function addInvestment() {
    const inv: ExistingInvestment = {
      id: uuid(),
      productId: '',
      label: 'Existing Investment',
      currentValue: 0,
      monthlyContribution: 0,
      expectedReturnPercent: 10,
    }
    setForm(f => ({ ...f, existingInvestments: [...f.existingInvestments, inv] }))
  }

  function removeInvestment(id: string) {
    setForm(f => ({ ...f, existingInvestments: f.existingInvestments.filter(i => i.id !== id) }))
  }

  function updateInvestment(id: string, patch: Partial<ExistingInvestment>) {
    setForm(f => ({
      ...f,
      existingInvestments: f.existingInvestments.map(i => i.id === id ? { ...i, ...patch } : i),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setFinancialDetails(form)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">How does your money flow?</h2>
        <p className="text-sm text-slate-500 mt-0.5">Share your income, expenses, and any investments you already have</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="What is your monthly take-home income?"
          type="number"
          value={form.monthlyIncome || ''}
          onChange={e => setForm(f => ({ ...f, monthlyIncome: Number(e.target.value) }))}
          error={errors.monthlyIncome}
          prefix="₹"
          placeholder="0"
        />
        <Input
          label="What do you spend each month?"
          type="number"
          value={form.monthlyExpenses || ''}
          onChange={e => setForm(f => ({ ...f, monthlyExpenses: Number(e.target.value) }))}
          error={errors.monthlyExpenses}
          prefix="₹"
          placeholder="0"
        />
      </div>

      {form.monthlyIncome > 0 && form.monthlyExpenses > 0 && (
        <div className={`rounded-lg p-3 text-sm font-medium ${surplus > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          Monthly surplus: {formatCurrency(surplus, false)} ({surplus > 0 ? 'available for goals' : 'deficit — please review'})
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Annual Hike %"
          type="number"
          value={form.expectedHikePercent}
          onChange={e => setForm(f => ({ ...f, expectedHikePercent: Number(e.target.value) }))}
          suffix="%"
          hint="Your expected annual salary hike"
        />
        <Input
          label="Inflation %"
          type="number"
          value={form.inflationPercent}
          onChange={e => setForm(f => ({ ...f, inflationPercent: Number(e.target.value) }))}
          suffix="%"
          hint="Based on historical cost trends"
        />
        <Input
          label="Emergency Fund"
          type="number"
          value={form.emergencyFundMonths}
          onChange={e => setForm(f => ({ ...f, emergencyFundMonths: Number(e.target.value) }))}
          suffix="mo"
          hint="How many months of expenses to keep as buffer?"
        />
      </div>

      {/* Existing Investments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Do you have any existing investments?</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addInvestment}>+ Add</Button>
        </div>
        {form.existingInvestments.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">
            You haven&apos;t added any investments yet — that&apos;s okay, you can skip this
          </p>
        )}
        <div className="flex flex-col gap-3">
          {form.existingInvestments.map(inv => (
            <div key={inv.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Label (e.g. HDFC Equity Fund)"
                  value={inv.label}
                  onChange={e => updateInvestment(inv.id, { label: e.target.value })}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeInvestment(inv.id)}
                  className="text-red-500 !p-1">✕</Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Current Value"
                  type="number"
                  value={inv.currentValue || ''}
                  onChange={e => updateInvestment(inv.id, { currentValue: Number(e.target.value) })}
                  prefix="₹"
                />
                <Input
                  placeholder="Monthly SIP"
                  type="number"
                  value={inv.monthlyContribution || ''}
                  onChange={e => updateInvestment(inv.id, { monthlyContribution: Number(e.target.value) })}
                  prefix="₹"
                />
                <Input
                  placeholder="Expected Return"
                  type="number"
                  value={inv.expectedReturnPercent}
                  onChange={e => updateInvestment(inv.id, { expectedReturnPercent: Number(e.target.value) })}
                  suffix="%"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1 justify-center">← Back</Button>
        <Button type="submit" className="flex-1 justify-center">Continue →</Button>
      </div>
    </form>
  )
}
