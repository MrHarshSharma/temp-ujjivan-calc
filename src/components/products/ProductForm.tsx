'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useProductsStore } from '@/store/productsStore'
import type { ProductMaster, ProductCategory, RiskTier, AgeGroup, GoalCategory } from '@/types'

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: 'MUTUAL_FUND', label: 'Mutual Fund' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
  { value: 'SIP', label: 'SIP' },
  { value: 'PPF', label: 'PPF' },
  { value: 'NPS', label: 'NPS' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'BONDS', label: 'Bonds' },
  { value: 'CUSTOM', label: 'Custom' },
]

const RISK_OPTIONS: { value: RiskTier; label: string }[] = [
  { value: 'LOW', label: 'Low (Conservative)' },
  { value: 'MEDIUM', label: 'Medium (Moderate)' },
  { value: 'HIGH', label: 'High (Aggressive)' },
]

const ALL_AGE_GROUPS: AgeGroup[] = ['20_30', '30_40', '40_50', '50_PLUS']
const ALL_GOAL_CATEGORIES: GoalCategory[] = [
  'RETIREMENT', 'EDUCATION', 'MARRIAGE', 'HOME_PURCHASE', 'VEHICLE',
  'TRAVEL', 'EMERGENCY_FUND', 'BUSINESS', 'CHILD_BIRTH', 'MEDICAL_CORPUS', 'CUSTOM',
]

export function ProductForm({ product, onClose }: { product: ProductMaster | null; onClose: () => void }) {
  const { addProduct, updateProduct } = useProductsStore()

  const [form, setForm] = useState({
    name: product?.name ?? '',
    category: product?.category ?? 'MUTUAL_FUND' as ProductCategory,
    description: product?.description ?? '',
    minInvestment: product?.minInvestment ?? 500,
    expectedReturnPercent: product?.expectedReturnPercent ?? 8,
    riskTier: product?.riskTier ?? 'MEDIUM' as RiskTier,
    liquidityScore: product?.liquidityScore ?? 3,
    taxEfficiency: product?.taxEfficiency ?? 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    suitableAgeGroups: product?.suitableAgeGroups ?? ['20_30', '30_40'] as AgeGroup[],
    suitableGoalCategories: product?.suitableGoalCategories ?? [] as GoalCategory[],
    isActive: product?.isActive ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function toggleAgeGroup(ag: AgeGroup) {
    setForm(f => ({
      ...f,
      suitableAgeGroups: f.suitableAgeGroups.includes(ag)
        ? f.suitableAgeGroups.filter(a => a !== ag)
        : [...f.suitableAgeGroups, ag],
    }))
  }

  function toggleGoalCategory(gc: GoalCategory) {
    setForm(f => ({
      ...f,
      suitableGoalCategories: f.suitableGoalCategories.includes(gc)
        ? f.suitableGoalCategories.filter(c => c !== gc)
        : [...f.suitableGoalCategories, gc],
    }))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Product name is required'
    if (form.expectedReturnPercent < 0) e.expectedReturnPercent = 'Return cannot be negative'
    if (form.suitableGoalCategories.length === 0) e.goals = 'Select at least one goal category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    if (product) {
      updateProduct(product.id, form)
    } else {
      addProduct({ ...form, tags: [] })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add Product'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{product ? 'Save Changes' : 'Add Product'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Product Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />
        <Input
          label="Description"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as ProductCategory }))}
          />
          <Select
            label="Risk Tier"
            options={RISK_OPTIONS}
            value={form.riskTier}
            onChange={e => setForm(f => ({ ...f, riskTier: e.target.value as RiskTier }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Expected Return"
            type="number"
            value={form.expectedReturnPercent}
            onChange={e => setForm(f => ({ ...f, expectedReturnPercent: Number(e.target.value) }))}
            error={errors.expectedReturnPercent}
            suffix="%"
          />
          <Input
            label="Min Investment"
            type="number"
            value={form.minInvestment}
            onChange={e => setForm(f => ({ ...f, minInvestment: Number(e.target.value) }))}
            prefix="₹"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Liquidity (1–5)</label>
            <input
              type="range"
              min={1}
              max={5}
              value={form.liquidityScore}
              onChange={e => setForm(f => ({ ...f, liquidityScore: Number(e.target.value) }))}
              className="w-full"
            />
            <span className="text-xs text-slate-500 text-center">{form.liquidityScore} / 5</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Suitable Age Groups</p>
          <div className="flex gap-2 flex-wrap">
            {ALL_AGE_GROUPS.map(ag => (
              <button
                key={ag}
                onClick={() => toggleAgeGroup(ag)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer
                  ${form.suitableAgeGroups.includes(ag) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                {ag.replace('_', '–')} yrs
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Suitable Goal Categories</p>
          {errors.goals && <p className="text-xs text-red-600 mb-1">{errors.goals}</p>}
          <div className="flex gap-2 flex-wrap">
            {ALL_GOAL_CATEGORIES.map(gc => (
              <button
                key={gc}
                onClick={() => toggleGoalCategory(gc)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer
                  ${form.suitableGoalCategories.includes(gc) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                {gc.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
