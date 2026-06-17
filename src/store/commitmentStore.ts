'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CommitmentRecord } from '@/types'

interface CommitmentStore {
  commitment: CommitmentRecord | null
  setCommitment: (c: CommitmentRecord) => void
  clear: () => void
}

export const useCommitmentStore = create<CommitmentStore>()(
  immer((set) => ({
    commitment: null,

    setCommitment: (c) =>
      set((state) => {
        state.commitment = c
      }),

    clear: () =>
      set((state) => {
        state.commitment = null
      }),
  }))
)
