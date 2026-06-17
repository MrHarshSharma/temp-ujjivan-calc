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

const COVERAGE_OPTIONS = [
  { value: 'true', label: 'Ujjivan product' },
  { value: 'false', label: 'Third-party (Other market option)' },
]

const ALL_AGE_GROUPS: AgeGroup[] = ['20_30', '30_40', '40_50', '50_PLUS']
const ALL_GOAL_CATEGORIES: GoalCategory[] = [
  'RETIREMENT', 'EDUCATION', 'MARRIAGE', 'HOME_PURCHASE', 'VEHICLE',
  'TRAVEL', 'EMERGENCY_FUND', 'BUSINESS', 'CHILD_BIRTH', 'MEDICAL_CORPUS', 'CUSTOM',
]

/** Parse a textarea (one item per line) into a trimmed string[]. */
function linesToArray(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
}

/** Parse an XIRR text input into a number or null (blank/invalid → null). */
function parseXirr(text: string): number | null {
  if (text.trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

function Textarea({
  label, value, onChange, placeholder, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-400 -mt-0.5">{hint}</p>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}

export function ProductForm({ product, onClose }: { product: ProductMaster | null; onClose: () => void }) {
  const { addProduct, updateProduct, products } = useProductsStore()

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
    // F-02 / F-03 / F-07 fields
    isUjjivanProduct: product?.isUjjivanProduct ?? true,
    rmPitch: product?.rmPitch ?? '',
    priorityRank: product?.priorityRank ?? 1,
    pros: (product?.pros ?? []).join('\n'),
    cons: (product?.cons ?? []).join('\n'),
    alternateProductId: product?.alternateProductId ?? '',
    ctaLink: product?.ctaLink ?? '',
    xirr3yr: product?.returnHistory?.xirr3yr != null ? String(product.returnHistory.xirr3yr) : '',
    xirr5yr: product?.returnHistory?.xirr5yr != null ? String(product.returnHistory.xirr5yr) : '',
    xirr10yr: product?.returnHistory?.xirr10yr != null ? String(product.returnHistory.xirr10yr) : '',
    xirrAsOf: product?.returnHistory?.asOf ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const alternateOptions = [
    { value: '', label: '— Auto (next-ranked in category) —' },
    ...products
      .filter(p => p.id !== product?.id)
      .map(p => ({ value: p.id, label: p.name })),
  ]

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
    if (!form.rmPitch.trim()) e.rmPitch = 'RM pitch is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    const xirr3yr = parseXirr(form.xirr3yr)
    const xirr5yr = parseXirr(form.xirr5yr)
    const xirr10yr = parseXirr(form.xirr10yr)
    const hasAnyXirr = xirr3yr !== null || xirr5yr !== null || xirr10yr !== null

    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      minInvestment: form.minInvestment,
      expectedReturnPercent: form.expectedReturnPercent,
      riskTier: form.riskTier,
      liquidityScore: form.liquidityScore,
      taxEfficiency: form.taxEfficiency,
      suitableAgeGroups: form.suitableAgeGroups,
      suitableGoalCategories: form.suitableGoalCategories,
      isActive: form.isActive,
      isUjjivanProduct: form.isUjjivanProduct,
      rmPitch: form.rmPitch.trim(),
      priorityRank: form.priorityRank,
      pros: linesToArray(form.pros),
      cons: linesToArray(form.cons),
      alternateProductId: form.alternateProductId || undefined,
      ctaLink: form.ctaLink.trim() || undefined,
      returnHistory: {
        xirr3yr,
        xirr5yr,
        xirr10yr,
        asOf: hasAnyXirr ? (form.xirrAsOf.trim() || null) : null,
      },
    }

    if (product) {
      updateProduct(product.id, payload)
    } else {
      addProduct({ ...payload, tags: [] })
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

        {/* F-02 coverage mapping */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Coverage"
            options={COVERAGE_OPTIONS}
            value={String(form.isUjjivanProduct)}
            onChange={e => setForm(f => ({ ...f, isUjjivanProduct: e.target.value === 'true' }))}
          />
          <Input
            label="Priority Rank"
            type="number"
            value={form.priorityRank}
            onChange={e => setForm(f => ({ ...f, priorityRank: Number(e.target.value) }))}
          />
        </div>

        <Input
          label="RM Pitch (one line read to the client)"
          value={form.rmPitch}
          onChange={e => setForm(f => ({ ...f, rmPitch: e.target.value }))}
          error={errors.rmPitch}
        />

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

        {/* F-07 Historical XIRR — leave blank for protection products (shows N/A) */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">Historical XIRR (%) — leave blank for protection products</p>
          <div className="grid grid-cols-4 gap-3">
            <Input label="3-yr" type="number" value={form.xirr3yr}
              onChange={e => setForm(f => ({ ...f, xirr3yr: e.target.value }))} suffix="%" />
            <Input label="5-yr" type="number" value={form.xirr5yr}
              onChange={e => setForm(f => ({ ...f, xirr5yr: e.target.value }))} suffix="%" />
            <Input label="10-yr" type="number" value={form.xirr10yr}
              onChange={e => setForm(f => ({ ...f, xirr10yr: e.target.value }))} suffix="%" />
            <Input label="As of" value={form.xirrAsOf} placeholder="2026-03"
              onChange={e => setForm(f => ({ ...f, xirrAsOf: e.target.value }))} />
          </div>
        </div>

        {/* F-03 deep-dive content */}
        <div className="grid grid-cols-2 gap-3">
          <Textarea label="Pros (one per line)" value={form.pros}
            onChange={v => setForm(f => ({ ...f, pros: v }))} placeholder={'Tax-free returns\nSovereign guarantee'} />
          <Textarea label="Cons (one per line)" value={form.cons}
            onChange={v => setForm(f => ({ ...f, cons: v }))} placeholder={'15-year lock-in\nContribution cap'} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Default Alternate Product"
            options={alternateOptions}
            value={form.alternateProductId}
            onChange={e => setForm(f => ({ ...f, alternateProductId: e.target.value }))}
          />
          <Input
            label="CTA Link (account-opening / learn-more URL)"
            value={form.ctaLink}
            onChange={e => setForm(f => ({ ...f, ctaLink: e.target.value }))}
            placeholder="https://…"
          />
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
