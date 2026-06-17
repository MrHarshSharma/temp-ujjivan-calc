'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/ui/Badge'
import { useUserStore } from '@/store/userStore'
import { useRiskStore } from '@/store/riskStore'
import { scoreQuestionnaire, resolveRiskTier } from '@/engine/risk.engine'
import { PeerBenchmarkPanel } from '../PeerBenchmarkPanel'
import type { RiskAnswer, RiskProfile, RiskTier } from '@/types'

type Mode = 'pick' | 'questionnaire'

export function RiskAssessmentStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const setRiskProfile = useUserStore(s => s.setRiskProfile)
  const profile = useUserStore(s => s.profile)
  const { questions, tierDefinitions } = useRiskStore()

  const [mode, setMode] = useState<Mode>('questionnaire')
  const [selectedTier, setSelectedTier] = useState<RiskTier>(profile?.riskProfile.tier ?? 'MEDIUM')
  const [answers, setAnswers] = useState<Record<string, RiskAnswer>>({})
  const [error, setError] = useState('')

  const allAnswered = questions.every(q => answers[q.id])
  const resolvedTier = allAnswered
    ? resolveRiskTier(scoreQuestionnaire(Object.values(answers)), tierDefinitions)
    : null

  function handleAnswer(questionId: string, optionId: string, score: number) {
    setAnswers(prev => ({ ...prev, [questionId]: { questionId, selectedOptionId: optionId, score } }))
  }

  function handleSubmit() {
    setError('')
    if (mode === 'pick') {
      const rp: RiskProfile = { method: 'PREDEFINED', tier: selectedTier, setManuallyAt: new Date().toISOString() }
      setRiskProfile(rp)
      onNext()
    } else {
      if (!allAnswered) { setError('Please answer all the questions before continuing'); return }
      const answers_ = Object.values(answers)
      const score = scoreQuestionnaire(answers_)
      const tier = resolveRiskTier(score, tierDefinitions)
      const rp: RiskProfile = { method: 'QUESTIONNAIRE', tier, questionnaireAnswers: answers_, totalScore: score }
      setRiskProfile(rp)
      onNext()
    }
  }

  const tierOptions: { tier: RiskTier; label: string; description: string }[] = [
    { tier: 'LOW', label: 'Conservative', description: 'I prefer keeping my money safe over chasing higher returns. Give me FDs, bonds, and PPF.' },
    { tier: 'MEDIUM', label: 'Moderate', description: 'I\'m okay with some ups and downs if it means better long-term growth.' },
    { tier: 'HIGH', label: 'Aggressive', description: 'I want maximum growth and I can handle short-term volatility.' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">How do you feel about investment risk?</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your comfort level helps us recommend the right products for you</p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
        {(['questionnaire', 'pick'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-medium transition-colors
              ${mode === m ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {m === 'pick' ? 'Quick Select' : 'Take Questionnaire'}
          </button>
        ))}
      </div>

      {mode === 'pick' && (
        <div className="flex flex-col gap-3">
          {tierOptions.map(t => (
            <button
              key={t.tier}
              onClick={() => setSelectedTier(t.tier)}
              className={`text-left p-4 rounded-lg border-2 transition-colors
                ${selectedTier === t.tier ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <RiskBadge tier={t.tier} />
                <span className="font-semibold text-slate-900 text-sm">{t.label}</span>
              </div>
              <p className="text-xs text-slate-500">{t.description}</p>
            </button>
          ))}
        </div>
      )}

      {mode === 'questionnaire' && (
        <div className="flex flex-col gap-6">
          {questions.map((q, qi) => (
            <div key={q.id}>
              <p className="text-sm font-medium text-slate-900 mb-3">
                {qi + 1}. {q.text}
              </p>
              <div className="flex flex-col gap-2">
                {q.options.map(opt => {
                  const selected = answers[q.id]?.selectedOptionId === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(q.id, opt.id, opt.score)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors
                        ${selected ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                    >
                      {opt.text}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {resolvedTier && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
              Based on your answers, your risk profile is: <RiskBadge tier={resolvedTier} />
            </div>
          )}
        </div>
      )}

      {/* F-01: advisory peer benchmark reflecting the current selection */}
      <PeerBenchmarkPanel
        age={profile?.personal.age ?? 0}
        tier={mode === 'pick' ? selectedTier : resolvedTier}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 mt-2">
        <Button variant="secondary" onClick={onBack} className="flex-1 justify-center">← Back</Button>
        <Button onClick={handleSubmit} className="flex-1 justify-center">Continue →</Button>
      </div>
    </div>
  )
}
