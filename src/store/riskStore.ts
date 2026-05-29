'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { RiskQuestion, RiskTierDefinition, RiskTier } from '@/types'
import { RISK_QUESTIONS, RISK_TIER_DEFINITIONS } from '@/constants/risk.constants'

interface RiskStore {
  questions: RiskQuestion[]
  tierDefinitions: RiskTierDefinition[]
  updateQuestion: (id: string, patch: Partial<RiskQuestion>) => void
  updateTierDefinition: (tier: RiskTier, patch: Partial<RiskTierDefinition>) => void
}

export const useRiskStore = create<RiskStore>()(
  immer((set) => ({
    questions: RISK_QUESTIONS,
    tierDefinitions: RISK_TIER_DEFINITIONS,

    updateQuestion: (id, patch) =>
      set((state) => {
        const idx = state.questions.findIndex(q => q.id === id)
        if (idx !== -1) Object.assign(state.questions[idx], patch)
      }),

    updateTierDefinition: (tier, patch) =>
      set((state) => {
        const idx = state.tierDefinitions.findIndex(t => t.tier === tier)
        if (idx !== -1) Object.assign(state.tierDefinitions[idx], patch)
      }),
  }))
)
