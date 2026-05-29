'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUserStore } from '@/store/userStore'
import type { PersonalDetails } from '@/types'
import { DEFAULT_RATES } from '@/constants/defaults.constants'

export function PersonalDetailsStep({ onNext }: { onNext: () => void }) {
  const profile = useUserStore(s => s.profile)
  const setPersonalDetails = useUserStore(s => s.setPersonalDetails)

  const [form, setForm] = useState<PersonalDetails>({
    name: profile?.personal.name ?? '',
    age: profile?.personal.age ?? 30,
    retirementAge: profile?.personal.retirementAge ?? DEFAULT_RATES.retirementAge,
    dependents: profile?.personal.dependents ?? 0,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalDetails, string>>>({})

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (form.age < 18 || form.age > 80) e.age = 'Age must be between 18 and 80'
    if (form.retirementAge <= form.age) e.retirementAge = 'Retirement age must be greater than current age'
    if (form.dependents < 0) e.dependents = 'Cannot be negative'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setPersonalDetails(form)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Tell us about yourself</h2>
        <p className="text-sm text-slate-500 mt-0.5">We&apos;ll use this to personalise your plan</p>
      </div>

      <Input
        label="What's your full name?"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        error={errors.name}
        placeholder="e.g. Rahul Sharma"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="How old are you?"
          type="number"
          value={form.age}
          onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))}
          error={errors.age}
          min={18}
          max={80}
          suffix="yrs"
        />
        <Input
          label="When do you plan to retire?"
          type="number"
          value={form.retirementAge}
          onChange={e => setForm(f => ({ ...f, retirementAge: Number(e.target.value) }))}
          error={errors.retirementAge}
          min={40}
          max={80}
          suffix="yrs"
        />
      </div>
      <Input
        label="How many people financially depend on you?"
        type="number"
        value={form.dependents}
        onChange={e => setForm(f => ({ ...f, dependents: Number(e.target.value) }))}
        error={errors.dependents}
        min={0}
        hint="Include spouse, children, or parents you financially support"
      />

      <Button type="submit" className="w-full justify-center mt-2">
        Continue →
      </Button>
    </form>
  )
}
