'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuid } from 'uuid'
import type { PersonalDetails, FinancialDetails, RiskProfile, UserProfile } from '@/types'

interface UserStore {
  profile: UserProfile | null
  isOnboardingComplete: boolean
  setPersonalDetails: (d: PersonalDetails) => void
  setFinancialDetails: (d: FinancialDetails) => void
  setRiskProfile: (r: RiskProfile) => void
  completeOnboarding: () => void
  resetProfile: () => void
}

export const useUserStore = create<UserStore>()(
  immer((set) => ({
    profile: null,
    isOnboardingComplete: false,

    setPersonalDetails: (d) =>
      set((state) => {
        if (!state.profile) {
          state.profile = {
            id: uuid(),
            personal: d,
            financial: {
              monthlyIncome: 0,
              monthlyExpenses: 0,
              existingInvestments: [],
              emergencyFundMonths: 6,
              expectedHikePercent: 8,
              inflationPercent: 6,
              taxBracketPercent: 30,
            },
            riskProfile: { method: 'PREDEFINED', tier: 'MEDIUM' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        } else {
          state.profile.personal = d
          state.profile.updatedAt = new Date().toISOString()
        }
      }),

    setFinancialDetails: (d) =>
      set((state) => {
        if (state.profile) {
          state.profile.financial = d
          state.profile.updatedAt = new Date().toISOString()
        }
      }),

    setRiskProfile: (r) =>
      set((state) => {
        if (state.profile) {
          state.profile.riskProfile = r
          state.profile.updatedAt = new Date().toISOString()
        }
      }),

    completeOnboarding: () =>
      set((state) => {
        state.isOnboardingComplete = true
      }),

    resetProfile: () =>
      set((state) => {
        state.profile = null
        state.isOnboardingComplete = false
      }),
  }))
)
