'use client'

import { useState } from 'react'
import { useProductsStore } from '@/store/productsStore'
import { Button } from '@/components/ui/Button'
import { RiskBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProductForm } from './ProductForm'
import type { ProductCategory, ProductMaster } from '@/types'
import { formatPercent } from '@/utils/format.utils'

const CATEGORY_CONFIG: Record<ProductCategory, { label: string; color: string }> = {
  MUTUAL_FUND:   { label: 'Mutual Fund',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  SIP:           { label: 'SIP',          color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PPF:           { label: 'PPF',          color: 'bg-teal-50 text-teal-700 border-teal-200' },
  NPS:           { label: 'NPS',          color: 'bg-purple-50 text-purple-700 border-purple-200' },
  FIXED_DEPOSIT: { label: 'Fixed Dep.',   color: 'bg-slate-100 text-slate-700 border-slate-200' },
  GOLD:          { label: 'Gold',         color: 'bg-amber-50 text-amber-700 border-amber-200' },
  INSURANCE:     { label: 'Insurance',    color: 'bg-rose-50 text-rose-700 border-rose-200' },
  EQUITY:        { label: 'Equity',       color: 'bg-orange-50 text-orange-700 border-orange-200' },
  BONDS:         { label: 'Bonds',        color: 'bg-green-50 text-green-700 border-green-200' },
  REAL_ESTATE:   { label: 'Real Estate',  color: 'bg-stone-100 text-stone-700 border-stone-200' },
  CUSTOM:        { label: 'Custom',       color: 'bg-slate-50 text-slate-500 border-slate-200' },
}

function ReturnCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-slate-400 text-sm">—</span>
  const color = value >= 10 ? 'text-green-600' : value >= 7 ? 'text-amber-600' : 'text-slate-600'
  return <span className={`text-sm font-semibold ${color}`}>{formatPercent(value)}</span>
}

function LiquidityDots({ score }: { score: number }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${i < score ? 'bg-blue-500' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  )
}

function ProductRow({
  product,
  onEdit,
  onDelete,
  onToggle,
  confirmDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  product: ProductMaster
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  confirmDelete: boolean
  onConfirmDelete: () => void
  onCancelDelete: () => void
}) {
  const cat = CATEGORY_CONFIG[product.category] ?? CATEGORY_CONFIG.CUSTOM

  return (
    <tr className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${!product.isActive ? 'opacity-40' : ''}`}>
      {/* Product */}
      <td className="px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{product.name}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[260px]">{product.description}</p>
      </td>

      {/* Category */}
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${cat.color}`}>
          {cat.label}
        </span>
      </td>

      {/* Risk */}
      <td className="px-4 py-3.5">
        <RiskBadge tier={product.riskTier} />
      </td>

      {/* Return */}
      <td className="px-4 py-3.5 text-right">
        <ReturnCell value={product.expectedReturnPercent} />
      </td>

      {/* Liquidity */}
      <td className="px-4 py-3.5">
        <LiquidityDots score={product.liquidityScore} />
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <button
          onClick={onToggle}
          className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-colors
            ${product.isActive
              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
        >
          {product.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onConfirmDelete}
              className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={onCancelDelete}
              className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1 rounded-md transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

export function ProductsPage() {
  const { products, toggleProductActive, removeProduct } = useProductsStore()
  const [editingProduct, setEditingProduct] = useState<ProductMaster | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const activeCount = products.filter(p => p.isActive).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Master</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeCount} active · {products.length - activeCount} inactive
          </p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setShowForm(true) }}>+ Add Product</Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Return</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Liquidity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onEdit={() => { setEditingProduct(p); setShowForm(true) }}
                  onDelete={() => setConfirmDeleteId(p.id)}
                  onToggle={() => toggleProductActive(p.id)}
                  confirmDelete={confirmDeleteId === p.id}
                  onConfirmDelete={() => { removeProduct(p.id); setConfirmDeleteId(null) }}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null) }}
        />
      )}
    </div>
  )
}
