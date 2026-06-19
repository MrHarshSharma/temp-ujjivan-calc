'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { useProductsStore } from '@/store/productsStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useCommitmentStore } from '@/store/commitmentStore'
import { useCalculations } from '@/hooks/useCalculations'
import { fv, requiredSIP } from '@/engine/financial.engine'
import { DEFAULT_RATES } from '@/constants/defaults.constants'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/utils/format.utils'
import type { GoalCommitment } from '@/types'

const RATE = DEFAULT_RATES.equityReturnPercent

/** Monthly SIP saved by deploying `lump` today over `years` at RATE. */
function sipReductionFromLump(lump: number, years: number): number {
  if (lump <= 0 || years <= 0) return 0
  return requiredSIP(fv(lump, RATE, years), RATE, years)
}

export function CommitmentPage() {
  const router = useRouter()
  const profile = useUserStore(s => s.profile)
  const userGoals = useGoalsStore(s => s.userGoals)
  const products = useProductsStore(s => s.products)
  const recommendation = useRecommendationStore(s => s.recommendation)
  const setCommitment = useCommitmentStore(s => s.setCommitment)
  const { goalAnalyses } = useCalculations()

  const [activation, setActivation] = useState<Record<string, boolean>>(
    () => Object.fromEntries((recommendation?.goalRecommendations ?? []).map(gr => [gr.goalId, true]))
  )
  const [lumpsum, setLumpsum] = useState(0)

  if (!profile || !recommendation) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
        <p className="text-slate-500">Generate the investment plan first, then return to start the commitment.</p>
        <Button onClick={() => router.push('/recommendations')}>Go to plan</Button>
      </div>
    )
  }

  const grs = recommendation.goalRecommendations
  const activatedSIP = grs
    .filter(gr => activation[gr.goalId])
    .reduce((s, gr) => s + gr.totalMonthlySIP, 0)

  // Distribute the lumpsum across activated goals proportional to their SIP,
  // then compute the per-goal SIP reduction it buys.
  function goalLumpReduction(goalId: string, goalSIP: number): number {
    if (lumpsum <= 0 || activatedSIP <= 0 || !activation[goalId]) return 0
    const share = lumpsum * (goalSIP / activatedSIP)
    const years = goalAnalyses.find(a => a.goalId === goalId)?.yearsToGoal ?? 10
    return Math.min(goalSIP, sipReductionFromLump(share, years))
  }

  const rows = grs.map(gr => {
    const goal = userGoals.find(g => g.id === gr.goalId)
    const topAlloc = [...gr.allocations].sort((a, b) => b.allocationPercent - a.allocationPercent)[0]
    const product = topAlloc ? products.find(p => p.id === topAlloc.productId) : undefined
    const reduction = goalLumpReduction(gr.goalId, gr.totalMonthlySIP)
    const committed = activation[gr.goalId] ? Math.max(0, Math.round(gr.totalMonthlySIP - reduction)) : 0
    return { gr, goal, productName: product?.name ?? '—', committed }
  })

  const totalReduction = grs.reduce((s, gr) => s + goalLumpReduction(gr.goalId, gr.totalMonthlySIP), 0)
  const effectiveSIP = Math.max(0, Math.round(activatedSIP - totalReduction))
  const anyActivated = grs.some(gr => activation[gr.goalId])

  function toggle(goalId: string) {
    setActivation(a => ({ ...a, [goalId]: !a[goalId] }))
  }

  function confirm() {
    if (!profile) return
    const goals: GoalCommitment[] = grs.map(gr => ({
      goalId: gr.goalId,
      status: activation[gr.goalId] ? 'ACTIVATED' : 'DEFERRED',
      committedMonthlySIP: rows.find(r => r.gr.goalId === gr.goalId)?.committed ?? 0,
      recommendedMonthlySIP: Math.round(gr.totalMonthlySIP),
    }))
    setCommitment({
      monthlySIPCommitment: effectiveSIP,
      lumpsum,
      goals,
      status: anyActivated ? 'COMMITTED' : 'DEFERRED_ALL',
      committedAt: new Date().toISOString(),
    })
    // F-12: log activation outcome for admin analytics (fire-and-forget).
    fetch('/api/session-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: profile.id, event: anyActivated ? 'activated' : 'deferred' }),
    }).catch(() => {})
    router.push('/recommendations')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Start your plan</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Turn {profile.personal.name}&apos;s plan into a first commitment — a monthly SIP, a lumpsum, or both.
        </p>
      </div>

      {/* RM script */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
        <span className="text-blue-400 shrink-0 text-sm mt-0.5">💬</span>
        <p className="text-xs text-blue-800">
          <span className="font-semibold">Say to client: </span>
          Based on everything we discussed, would you like to start with a monthly commitment today?
          Even a smaller amount is a great first step — we can always increase it during your next review.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            label="Monthly SIP commitment"
            type="number"
            value={effectiveSIP}
            readOnly
            prefix="₹"
            hint="Recommended total, less any lumpsum effect"
          />
        </div>
        <div>
          <Input
            label="Lumpsum to deploy today (optional)"
            type="number"
            value={lumpsum || ''}
            onChange={e => setLumpsum(Math.max(0, Number(e.target.value)))}
            prefix="₹"
            placeholder="0"
          />
        </div>
      </div>

      {lumpsum > 0 && totalReduction > 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
          A lumpsum of {formatCurrency(lumpsum, false)} today reduces your monthly SIP requirement by{' '}
          <strong>{formatCurrency(Math.round(totalReduction), false)}/month</strong>.
        </div>
      )}

      {/* Commitment summary */}
      <Card padding="none">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Commitment summary</p>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map(({ gr, goal, productName, committed }) => {
            const active = activation[gr.goalId]
            return (
              <div key={gr.goalId} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    {goal?.name ?? 'Goal'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{productName}</p>
                </div>
                <div className="text-right shrink-0 w-28">
                  <p className={`text-sm font-semibold ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                    {active ? `${formatCurrency(committed)}/mo` : 'Deferred'}
                  </p>
                  {active && committed < Math.round(gr.totalMonthlySIP) && (
                    <p className="text-[11px] text-slate-400 line-through">{formatCurrency(gr.totalMonthlySIP)}</p>
                  )}
                </div>
                <button
                  onClick={() => toggle(gr.goalId)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer transition-colors shrink-0
                    ${active
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                >
                  {active ? 'Activated' : 'Activate'}
                </button>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Total monthly commitment</span>
          <span className="text-base font-bold text-blue-600">{formatCurrency(effectiveSIP)}/mo</span>
        </div>
      </Card>

      {!anyActivated && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          All goals are deferred — this will be recorded as &quot;Plan generated, activation deferred.&quot;
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push('/recommendations')} className="flex-1 justify-center">
          ← Back to plan
        </Button>
        <Button onClick={confirm} className="flex-1 justify-center">
          {anyActivated ? 'Confirm commitment' : 'Record deferral'}
        </Button>
      </div>
    </div>
  )
}
