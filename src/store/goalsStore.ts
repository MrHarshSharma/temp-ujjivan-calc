'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuid } from 'uuid'
import type { GoalTemplate, UserGoal } from '@/types'
import { GOAL_TEMPLATES } from '@/constants/goals.constants'

interface GoalsStore {
  templates: GoalTemplate[]
  userGoals: UserGoal[]
  addGoal: (goal: Omit<UserGoal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, patch: Partial<UserGoal>) => void
  removeGoal: (id: string) => void
  addTemplate: (t: Omit<GoalTemplate, 'id'>) => void
  updateTemplate: (id: string, patch: Partial<GoalTemplate>) => void
  resetGoals: () => void
}

export const useGoalsStore = create<GoalsStore>()(
  immer((set) => ({
    templates: GOAL_TEMPLATES,
    userGoals: [],

    addGoal: (goal) =>
      set((state) => {
        state.userGoals.push({
          ...goal,
          id: uuid(),
          createdAt: new Date().toISOString(),
        })
      }),

    updateGoal: (id, patch) =>
      set((state) => {
        const idx = state.userGoals.findIndex(g => g.id === id)
        if (idx !== -1) Object.assign(state.userGoals[idx], patch)
      }),

    removeGoal: (id) =>
      set((state) => {
        state.userGoals = state.userGoals.filter(g => g.id !== id)
      }),

    addTemplate: (t) =>
      set((state) => {
        state.templates.push({ ...t, id: uuid() })
      }),

    updateTemplate: (id, patch) =>
      set((state) => {
        const idx = state.templates.findIndex(t => t.id === id)
        if (idx !== -1) Object.assign(state.templates[idx], patch)
      }),

    resetGoals: () =>
      set((state) => {
        state.userGoals = []
      }),
  }))
)
