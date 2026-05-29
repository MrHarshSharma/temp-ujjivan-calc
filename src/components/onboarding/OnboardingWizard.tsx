'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PersonalDetailsStep } from './steps/PersonalDetailsStep'
import { FinancialDetailsStep } from './steps/FinancialDetailsStep'
import { RiskAssessmentStep } from './steps/RiskAssessmentStep'
import { GoalSelectionStep } from './steps/GoalSelectionStep'
import { useUserStore } from '@/store/userStore'

const STEPS = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'Financial' },
  { id: 3, label: 'Risk Profile' },
  { id: 4, label: 'Goals' },
]

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const router = useRouter()
  const completeOnboarding = useUserStore(s => s.completeOnboarding)

  function next() {
    if (step < 4) setStep(s => s + 1)
    else {
      completeOnboarding()
      router.push('/dashboard')
    }
  }

  function back() {
    if (step > 1) setStep(s => s - 1)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">P</div>
            <span className="font-semibold text-slate-900">Ujjivan Financial Planning Tool</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Let&apos;s build your financial plan</h1>
          <p className="text-slate-500 text-sm mt-1">Answer a few questions and we&apos;ll personalise everything for you</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="contents">
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                  ${step > s.id ? 'bg-blue-600 text-white' : step === s.id ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'}`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                <span className={`text-xs mt-1 font-medium ${step >= s.id ? 'text-blue-600' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 mb-5 transition-colors ${step > s.id ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {step === 1 && <PersonalDetailsStep onNext={next} />}
          {step === 2 && <FinancialDetailsStep onNext={next} onBack={back} />}
          {step === 3 && <RiskAssessmentStep onNext={next} onBack={back} />}
          {step === 4 && <GoalSelectionStep onNext={next} onBack={back} />}
        </div>
      </div>
    </div>
  )
}
