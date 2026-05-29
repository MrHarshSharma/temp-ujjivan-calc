'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PortfolioRecommendation } from '@/types'

interface RecommendationStore {
  recommendation: PortfolioRecommendation | null
  lastGeneratedAt: string | null
  setRecommendation: (r: PortfolioRecommendation) => void
  clear: () => void
}

export const useRecommendationStore = create<RecommendationStore>()(
  immer((set) => ({
    recommendation: null,
    lastGeneratedAt: null,

    setRecommendation: (r) =>
      set((state) => {
        state.recommendation = r
        state.lastGeneratedAt = new Date().toISOString()
      }),

    clear: () =>
      set((state) => {
        state.recommendation = null
        state.lastGeneratedAt = null
      }),
  }))
)
