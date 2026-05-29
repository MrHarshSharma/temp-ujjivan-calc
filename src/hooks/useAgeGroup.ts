'use client'

import { useUserStore } from '@/store/userStore'
import { getAgeGroup } from '@/engine/recommendation.engine'
import type { AgeGroup } from '@/types'

export function useAgeGroup(): AgeGroup | null {
  const profile = useUserStore(s => s.profile)
  if (!profile) return null
  return getAgeGroup(profile.personal.age)
}
