'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/utils/format.utils'
import type { ProductMaster } from '@/types'

type Tab = 'analytics' | 'products' | 'events'

interface Analytics {
  plansGenerated: number; uniqueClients: number; sessionsStarted: number
  activated: number; deferred: number; conversionRate: number
  topProducts: { name: string; count: number }[]
  topGoals: { name: string; count: number }[]
  recentPlans: { clientName: string; totalMonthlySIP: number; generatedAt: string }[]
}

interface MaterialEvent {
  id: string; product_id: string; event_type: string; description: string | null; event_date: string | null; created_at: string
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
          {([['analytics', 'Analytics'], ['products', 'Product Master'], ['events', 'Material Events']] as [Tab, string][]).map(([t, label]) => (
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
        {tab === 'events' && <EventsTab token={token} />}
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
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/products')
      .then(async res => { const d = await res.json(); if (res.ok) setProducts(d.products); else setError(d.error) })
      .catch(() => setError('Could not load products.'))
  }, [])
  useEffect(load, [load])

  function patch(id: string, p: Partial<ProductMaster>) {
    setProducts(prev => prev.map(x => x.id === id ? { ...x, ...p } : x))
  }

  async function save(product: ProductMaster) {
    setSavingId(product.id)
    try {
      const res = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ product }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Save failed.') }
    } finally {
      setSavingId(null)
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
            <th className="px-4 py-2">Product</th><th>Coverage</th><th>Priority</th><th>Active</th><th></th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b border-slate-100">
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
              <td className="px-2">
                <button onClick={() => save(p)} disabled={savingId === p.id}
                  className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50">
                  {savingId === p.id ? 'Saving…' : 'Save'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventsTab({ token }: { token: string }) {
  const [events, setEvents] = useState<MaterialEvent[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ productId: '', eventType: 'manager_change', description: '', eventDate: '' })

  const load = useCallback(() => {
    fetch('/api/material-events', { headers: { 'x-admin-token': token } })
      .then(async res => { const d = await res.json(); if (res.ok) setEvents(d.events); else setError(d.error) })
      .catch(() => setError('Could not load events.'))
  }, [token])
  useEffect(load, [load])

  async function add() {
    if (!form.productId) { setError('Product ID is required.'); return }
    setError('')
    const res = await fetch('/api/material-events', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(form),
    })
    if (res.ok) { setForm({ productId: '', eventType: 'manager_change', description: '', eventDate: '' }); load() }
    else { const d = await res.json(); setError(d.error ?? 'Add failed.') }
  }

  return (
    <div className="space-y-4">
      {error && <Notice>{error}</Notice>}
      <div className="bg-white rounded-xl border border-slate-200 p-4 grid md:grid-cols-4 gap-3">
        <Input label="Product ID" value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} placeholder="prod_equity_mf" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Event type</label>
          <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="manager_change">Fund manager change</option>
            <option value="merger">Scheme merger</option>
            <option value="underperformance">Underperformance alert</option>
          </select>
        </div>
        <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <div className="flex items-end"><Button onClick={add} className="w-full justify-center">Add event</Button></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {events.length === 0 ? <p className="p-4 text-sm text-slate-400">No material events flagged.</p> :
          events.map(ev => (
            <div key={ev.id} className="p-3 text-sm flex justify-between">
              <span><span className="font-medium">{ev.product_id}</span> — {ev.event_type.replace('_', ' ')}{ev.description ? `: ${ev.description}` : ''}</span>
              <span className="text-xs text-slate-400">{new Date(ev.created_at).toLocaleDateString('en-IN')}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
