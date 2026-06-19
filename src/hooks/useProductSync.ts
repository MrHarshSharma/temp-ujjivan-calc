'use client'

import { useEffect } from 'react'
import { useProductsStore } from '@/store/productsStore'
import type { ProductMaster } from '@/types'

/**
 * F-02 / F-12: hydrate the product master from the central DB so admin edits
 * reflect in the RM tool without a deployment. Falls back silently to the
 * built-in seed when the DB isn't configured (the route returns source: 'seed').
 */
export function useProductSync() {
  useEffect(() => {
    let cancelled = false
    fetch('/api/products')
      .then(res => res.ok ? res.json() : null)
      .then((data: { products?: ProductMaster[]; source?: string } | null) => {
        if (cancelled || !data?.products) return
        // Only override local state when the DB is the source of truth.
        if (data.source === 'db' || data.source === 'seeded') {
          useProductsStore.setState(prev => ({ ...prev, products: data.products! }))
        }
      })
      .catch(() => { /* offline / not configured — keep seed */ })
    return () => { cancelled = true }
  }, [])
}
