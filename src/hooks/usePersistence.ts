'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { useProductsStore } from '@/store/productsStore'
import { useRiskStore } from '@/store/riskStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useCommitmentStore } from '@/store/commitmentStore'
import type { CommitmentRecord, ProductMaster } from '@/types'

// v2: ProductMaster gained F-02/F-03/F-07 fields — bump so cached v1 products reseed.
const STORAGE_VERSION = 2
const KEYS = {
  user: 'fp:user',
  goals: 'fp:goals',
  products: 'fp:products',
  risk: 'fp:risk',
  reco: 'fp:reco',
  commitment: 'fp:commitment',
}

function save(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data }))
  } catch {
    // localStorage full or unavailable
  }
}

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.version !== STORAGE_VERSION) return null
    return parsed.data as T
  } catch {
    return null
  }
}

/**
 * Hydrates all stores from localStorage on mount.
 * Subscribes to store changes and writes back on every update.
 * Mount this once at the root layout level.
 */
export function usePersistence() {
  const userStore = useUserStore
  const goalsStore = useGoalsStore
  const productsStore = useProductsStore
  const riskStore = useRiskStore
  const recoStore = useRecommendationStore
  const commitmentStore = useCommitmentStore

  // Hydrate on mount
  useEffect(() => {
    const userData = load<{ profile: unknown; isOnboardingComplete: boolean }>(KEYS.user)
    if (userData) {
      useUserStore.setState(userData as Parameters<typeof useUserStore.setState>[0])
    }

    const goalsData = load<{ userGoals: unknown[] }>(KEYS.goals)
    if (goalsData) {
      useGoalsStore.setState(prev => ({ ...prev, userGoals: goalsData.userGoals }))
    }

    const productsData = load<{ products: ProductMaster[] }>(KEYS.products)
    if (productsData) {
      useProductsStore.setState(prev => ({ ...prev, products: productsData.products }))
    }

    const recoData = load<{ recommendation: unknown; lastGeneratedAt: string | null }>(KEYS.reco)
    if (recoData) {
      useRecommendationStore.setState(prev => ({ ...prev, ...recoData }))
    }

    const commitmentData = load<{ commitment: CommitmentRecord | null }>(KEYS.commitment)
    if (commitmentData) {
      useCommitmentStore.setState(prev => ({ ...prev, commitment: commitmentData.commitment }))
    }
  }, [])

  // Subscribe and persist on change
  useEffect(() => {
    const unsubs = [
      userStore.subscribe((state) => save(KEYS.user, {
        profile: state.profile,
        isOnboardingComplete: state.isOnboardingComplete,
      })),
      goalsStore.subscribe((state) => save(KEYS.goals, { userGoals: state.userGoals })),
      productsStore.subscribe((state) => save(KEYS.products, { products: state.products })),
      riskStore.subscribe(() => { /* risk config not persisted — uses constants */ }),
      recoStore.subscribe((state) => save(KEYS.reco, {
        recommendation: state.recommendation,
        lastGeneratedAt: state.lastGeneratedAt,
      })),
      commitmentStore.subscribe((state) => save(KEYS.commitment, { commitment: state.commitment })),
    ]
    return () => unsubs.forEach(u => u())
  }, [userStore, goalsStore, productsStore, riskStore, recoStore, commitmentStore])
}
