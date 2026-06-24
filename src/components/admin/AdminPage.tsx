'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/utils/format.utils'
import type { ProductMaster } from '@/types'

type Tab = 'analytics' | 'products'

interface Analytics {
  plansGenerated: number; uniqueClients: number; sessionsStarted: number
  activated: number; deferred: number; conversionRate: number
  topProducts: { name: string; count: number }[]
  topGoals: { name: string; count: number }[]
  recentPlans: { clientName: string; totalMonthlySIP: number; generatedAt: string }[]
}

export function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [tab, setTab] = useState<Tab>('analytics')

  async function login() {
    setLoginError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok && data.ok) setToken(password)
      else setLoginError(data.error ?? 'Incorrect password.')
    } catch {
      setLoginError('Could not reach the server.')
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 w-full max-w-sm">
          <h1 className="text-lg font-bold text-slate-900 mb-1">Admin Console</h1>
          <p className="text-sm text-slate-500 mb-4">Ujjivan product team access</p>
          <form onSubmit={e => { e.preventDefault(); login() }} className="flex flex-col gap-3">
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} error={loginError} />
            <Button onClick={login}>Sign in</Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center text-white text-sm font-bold">U</div>
          <span className="font-semibold text-slate-900 text-sm">Ujjivan Admin Console</span>
        </div>
        <a href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">Exit to RM tool →</a>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-1 mb-5 border-b border-slate-200">
          {([['analytics', 'Analytics'], ['products', 'Product Master']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
                ${tab === t ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'analytics' && <AnalyticsTab token={token} />}
        {tab === 'products' && <ProductsTab token={token} />}
      </div>
    </div>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">{children}</div>
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

function AnalyticsTab({ token }: { token: string }) {
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/analytics', { headers: { 'x-admin-token': token } })
      .then(async res => { const d = await res.json(); if (res.ok) setData(d); else setError(d.error) })
      .catch(() => setError('Could not load analytics.'))
  }, [token])

  if (error) return <Notice>{error}</Notice>
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Plans generated" value={data.plansGenerated} />
        <Stat label="Unique clients" value={data.uniqueClients} />
        <Stat label="Activations" value={data.activated} />
        <Stat label="Conversion" value={`${data.conversionRate}%`} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-2">Most recommended products</p>
          {data.topProducts.length === 0 ? <p className="text-xs text-slate-400">No data yet.</p> :
            data.topProducts.map(p => (
              <div key={p.name} className="flex justify-between text-sm py-1 border-b border-slate-50">
                <span className="text-slate-700">{p.name}</span><span className="text-slate-400">{p.count}</span>
              </div>
            ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-2">Recent plans</p>
          {data.recentPlans.length === 0 ? <p className="text-xs text-slate-400">No plans yet.</p> :
            data.recentPlans.map((p, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-50">
                <span className="text-slate-700">{p.clientName}</span>
                <span className="text-slate-400">{formatCurrency(p.totalMonthlySIP)}/mo</span>
              </div>
            ))}
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Analytics reflect plans and sessions recorded in the central database. Client personal data (phone, etc.)
        is never shown here — only anonymised plan metadata.
      </p>
    </div>
  )
}

function ProductsTab({ token }: { token: string }) {
  const [products, setProducts] = useState<ProductMaster[]>([])
  const [baseline, setBaseline] = useState<Record<string, ProductMaster>>({})
  const [error, setError] = useState('')
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const load = useCallback(() => {
    fetch('/api/products')
      .then(async res => {
        const d = await res.json()
        if (res.ok) {
          setProducts(d.products)
          setBaseline(Object.fromEntries((d.products as ProductMaster[]).map(p => [p.id, p])))
          setDirtyIds(new Set())
        } else setError(d.error)
      })
      .catch(() => setError('Could not load products.'))
  }, [])
  useEffect(load, [load])

  // A row is "dirty" only if an editable field differs from the last-saved baseline.
  function isDirty(p: ProductMaster) {
    const base = baseline[p.id]
    return !base || base.isUjjivanProduct !== p.isUjjivanProduct
      || base.priorityRank !== p.priorityRank || base.isActive !== p.isActive
  }

  function patch(id: string, p: Partial<ProductMaster>) {
    setSavedAt(null)
    setProducts(prev => {
      const next = prev.map(x => x.id === id ? { ...x, ...p } : x)
      const updated = next.find(x => x.id === id)!
      setDirtyIds(d => {
        const s = new Set(d)
        if (isDirty(updated)) s.add(id); else s.delete(id)
        return s
      })
      return next
    })
  }

  async function saveAll() {
    const changed = products.filter(p => dirtyIds.has(p.id))
    if (changed.length === 0) return
    setSaving(true)
    setError('')
    try {
      const results = await Promise.all(changed.map(product =>
        fetch('/api/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
          body: JSON.stringify({ product }),
        })
      ))
      const failed = results.find(r => !r.ok)
      if (failed) { const d = await failed.json().catch(() => ({})); setError(d.error ?? 'Some changes could not be saved.'); return }
      setBaseline(Object.fromEntries(products.map(p => [p.id, p])))
      setDirtyIds(new Set())
      setSavedAt(Date.now())
    } catch {
      setError('Could not reach the server.')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <Notice>{error}</Notice>

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <p className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">
        Edit scheme priority and coverage; changes reflect in the RM tool without a deployment.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-xs text-slate-500">
            <th className="px-4 py-2">Product</th><th>Coverage</th><th>Priority</th><th>Active</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className={`border-b border-slate-100 ${dirtyIds.has(p.id) ? 'bg-amber-50' : ''}`}>
              <td className="px-4 py-2 font-medium text-slate-800">{p.name}</td>
              <td>
                <select
                  value={String(p.isUjjivanProduct)}
                  onChange={e => patch(p.id, { isUjjivanProduct: e.target.value === 'true' })}
                  className="text-xs border border-slate-300 rounded px-1.5 py-1"
                >
                  <option value="true">Ujjivan</option>
                  <option value="false">Third-party</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={p.priorityRank}
                  onChange={e => patch(p.id, { priorityRank: Number(e.target.value) })}
                  className="w-16 text-xs border border-slate-300 rounded px-1.5 py-1"
                />
              </td>
              <td>
                <input type="checkbox" checked={p.isActive} onChange={e => patch(p.id, { isActive: e.target.checked })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50">
        <span className="text-xs text-slate-500">
          {dirtyIds.size > 0
            ? `${dirtyIds.size} unsaved change${dirtyIds.size > 1 ? 's' : ''}`
            : savedAt ? 'All changes saved.' : 'No unsaved changes.'}
        </span>
        <Button onClick={saveAll} disabled={saving || dirtyIds.size === 0}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
