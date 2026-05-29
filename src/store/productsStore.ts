'use client'

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuid } from 'uuid'
import type { ProductMaster } from '@/types'
import { DEFAULT_PRODUCTS } from '@/constants/products.constants'

interface ProductsStore {
  products: ProductMaster[]
  addProduct: (p: Omit<ProductMaster, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProduct: (id: string, patch: Partial<ProductMaster>) => void
  toggleProductActive: (id: string) => void
  removeProduct: (id: string) => void
}

export const useProductsStore = create<ProductsStore>()(
  immer((set) => ({
    products: DEFAULT_PRODUCTS,

    addProduct: (p) =>
      set((state) => {
        const now = new Date().toISOString()
        state.products.push({ ...p, id: uuid(), createdAt: now, updatedAt: now })
      }),

    updateProduct: (id, patch) =>
      set((state) => {
        const idx = state.products.findIndex(p => p.id === id)
        if (idx !== -1) {
          Object.assign(state.products[idx], patch)
          state.products[idx].updatedAt = new Date().toISOString()
        }
      }),

    toggleProductActive: (id) =>
      set((state) => {
        const idx = state.products.findIndex(p => p.id === id)
        if (idx !== -1) {
          state.products[idx].isActive = !state.products[idx].isActive
          state.products[idx].updatedAt = new Date().toISOString()
        }
      }),

    removeProduct: (id) =>
      set((state) => {
        state.products = state.products.filter(p => p.id !== id)
      }),
  }))
)
