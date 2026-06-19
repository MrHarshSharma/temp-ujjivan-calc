'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useGoalsStore } from '@/store/goalsStore'
import { useProductsStore } from '@/store/productsStore'
import { useRecommendationStore } from '@/store/recommendationStore'
import { useCommitmentStore } from '@/store/commitmentStore'
import { useCalculations } from '@/hooks/useCalculations'
import { buildSnapshot, diffSnapshots } from '@/engine/planVersion.engine'
import { getAgeGroup } from '@/engine/recommendation.engine'
import { hasXirr } from '@/engine/product.engine'
import { formatCurrency } from '@/utils/format.utils'
import { Button } from '@/components/ui/Button'
import type { PlanChange, PlanSnapshot } from '@/types'

interface VersionRow { version: number; snapshot: PlanSnapshot; generated_at: string }

const AGE_GROUP_LABEL: Record<string, string> = {
  '20_30': '20–30 (wealth accumulation)',
  '30_40': '30–40 (growth)',
  '40_50': '40–50 (consolidation)',
  '50_PLUS': '50+ (preservation)',
}

export function ReportPage() {
  const router = useRouter()
  const profile = useUserStore(s => s.profile)
  const goals = useGoalsStore(s => s.userGoals)
  const products = useProductsStore(s => s.products)
  const recommendation = useRecommendationStore(s => s.recommendation)
  const commitment = useCommitmentStore(s => s.commitment)
  const { goalAnalyses, cashflow } = useCalculations()

  const [versions, setVersions] = useState<VersionRow[]>([])
  const [changes, setChanges] = useState<PlanChange[] | null>(null)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [savedVersion, setSavedVersion] = useState<number | null>(null)
  const fetchedRef = useRef(false)

  // Load existing versions for this client on mount.
  useEffect(() => {
    if (!profile || fetchedRef.current) return
    fetchedRef.current = true
    fetch(`/api/plans?clientId=${encodeURIComponent(profile.id)}`)
      .then(async res => {
        const data = await res.json()
        if (res.status === 503) { setDbError(data.error); return }
        if (res.ok) setVersions(data.versions ?? [])
      })
      .catch(() => setDbError('Could not reach the database.'))
  }, [profile])

  if (!profile || !recommendation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <p className="text-slate-500">Generate the plan before producing a report.</p>
        <Button onClick={() => router.push('/recommendations')}>Go to plan</Button>
      </div>
    )
  }

  async function generate() {
    if (!profile) return
    setBusy(true)
    try {
      const snapshot = buildSnapshot(profile, goals, goalAnalyses, recommendation, products, commitment)
      const prevSnapshot = versions[0]?.snapshot ?? null

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot }),
      })
      const data = await res.json()
      if (res.status === 503) { setDbError(data.error); setBusy(false); return }
      if (!res.ok) { setDbError(data.error ?? 'Save failed.'); setBusy(false); return }

      setSavedVersion(data.version)
      // F-12: log plan generation for admin analytics (fire-and-forget).
      fetch('/api/session-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: profile.id, event: 'plan_generated' }),
      }).catch(() => {})
      const diff = prevSnapshot ? diffSnapshots(prevSnapshot, snapshot) : []
      setChanges(diff)

      if (prevSnapshot) {
        const sumRes = await fetch('/api/changelog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: diff, clientName: profile.personal.name }),
        })
        const sumData = await sumRes.json()
        setAiSummary(sumData.summary ?? '')
      }

      // Refresh version list.
      const listRes = await fetch(`/api/plans?clientId=${encodeURIComponent(profile.id)}`)
      const listData = await listRes.json()
      if (listRes.ok) setVersions(listData.versions ?? [])
    } catch {
      setDbError('Could not reach the database.')
    } finally {
      setBusy(false)
    }
  }

  const ageGroup = getAgeGroup(profile.personal.age)
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Action bar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <button onClick={() => router.push('/recommendations')} className="text-sm text-slate-600 hover:text-slate-900">← Back to plan</button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={generate} disabled={busy}>
            {busy ? 'Saving…' : savedVersion ? 'Re-save version' : 'Generate & save version'}
          </Button>
          <Button size="sm" onClick={() => window.print()}>Download PDF</Button>
        </div>
      </div>

      {dbError && (
        <div className="print:hidden max-w-3xl mx-auto mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          {dbError} The report still prints; version history needs the database.
        </div>
      )}

      {/* Printable sheet */}
      <div className="max-w-3xl mx-auto bg-white my-6 print:my-0 shadow-sm print:shadow-none p-8 text-slate-800">
        {/* Branding header */}
        <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-emerald-800">Ujjivan Small Finance Bank</h1>
            <p className="text-xs text-slate-500">Financial Plan · {today}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Plan v{savedVersion ?? (versions[0]?.version ?? 1)}</p>
            <p>Confidential</p>
          </div>
        </div>

        {/* Client details */}
        <section className="mb-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Client</h2>
          <div className="grid grid-cols-2 gap-y-1 text-sm">
            <span className="text-slate-500">Name</span><span className="font-medium">{profile.personal.name}</span>
            <span className="text-slate-500">Age</span><span>{profile.personal.age} · {AGE_GROUP_LABEL[ageGroup]}</span>
            <span className="text-slate-500">Risk profile</span><span>{recommendation.riskTier}</span>
            <span className="text-slate-500">Dependents</span><span>{profile.personal.dependents}</span>
          </div>
        </section>

        {/* Cashflow summary */}
        {cashflow && (
          <section className="mb-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Cashflow</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-slate-500 text-xs">Monthly income</p><p className="font-semibold">{formatCurrency(cashflow.monthlyIncome, false)}</p></div>
              <div><p className="text-slate-500 text-xs">Monthly expenses</p><p className="font-semibold">{formatCurrency(cashflow.monthlyExpenses, false)}</p></div>
              <div><p className="text-slate-500 text-xs">Investable surplus</p><p className="font-semibold">{formatCurrency(cashflow.monthlySurplus, false)}</p></div>
            </div>
          </section>
        )}

        {/* Goal-by-goal plan */}
        <section className="mb-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Goal plan</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs text-slate-500">
                <th className="py-1.5">Goal</th><th>Target</th><th>By</th><th className="text-right">Monthly SIP</th>
              </tr>
            </thead>
            <tbody>
              {recommendation.goalRecommendations.map(gr => {
                const goal = goals.find(g => g.id === gr.goalId)
                const analysis = goalAnalyses.find(a => a.goalId === gr.goalId)
                if (!goal) return null
                return (
                  <tr key={gr.goalId} className="border-b border-slate-100 align-top">
                    <td className="py-2">
                      <p className="font-medium">{goal.name}</p>
                      <div className="text-xs text-slate-500">
                        {gr.allocations.map(al => {
                          const p = products.find(pr => pr.id === al.productId)
                          if (!p) return null
                          const xirr = hasXirr(p.returnHistory) ? ` · 5yr ${p.returnHistory.xirr5yr ?? '—'}%` : ''
                          return <span key={al.productId} className="block">{p.name}{xirr}</span>
                        })}
                      </div>
                    </td>
                    <td>{formatCurrency(analysis?.inflationAdjustedTarget ?? goal.targetAmount)}</td>
                    <td>{goal.targetYear}</td>
                    <td className="text-right font-semibold">{formatCurrency(gr.totalMonthlySIP)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="py-2" colSpan={3}>Total monthly SIP</td>
                <td className="text-right">{formatCurrency(recommendation.totalMonthlyRequired)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Commitment */}
        {commitment && commitment.status !== 'PENDING' && (
          <section className="mb-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Commitment</h2>
            <div className="text-sm">
              {commitment.status === 'DEFERRED_ALL'
                ? <p>Plan generated — activation deferred.</p>
                : <p>Committed <strong>{formatCurrency(commitment.monthlySIPCommitment)}/mo</strong>
                    {commitment.lumpsum > 0 && <> plus a lumpsum of {formatCurrency(commitment.lumpsum)}</>}
                    {' '}(recommended {formatCurrency(recommendation.totalMonthlyRequired)}/mo).</p>}
            </div>
          </section>
        )}

        {/* What changed */}
        {savedVersion && (
          <section className="mb-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">What changed since last visit</h2>
            {changes && changes.length > 0 ? (
              <>
                {aiSummary && <p className="text-sm text-slate-700 mb-2">{aiSummary}</p>}
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    {changes.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-1.5 text-slate-600 w-1/2">{c.label}</td>
                        <td className="text-slate-400">{c.oldValue}</td>
                        <td className="text-slate-400 px-1">→</td>
                        <td className="font-medium">{c.newValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-sm text-slate-500">{versions.length > 1 ? 'No material changes since the last plan.' : 'First plan for this client.'}</p>
            )}
          </section>
        )}

        {/* Disclaimer footer */}
        <footer className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
          This plan is based on the parameters entered during the planning session and is for guidance only.
          It does not constitute investment advice under SEBI regulations. Past performance is not indicative of
          future returns. Please consult a SEBI-registered investment advisor before acting.
          Ujjivan Small Finance Bank · Confidential.
        </footer>
      </div>

      {/* Version history — hidden on print */}
      {versions.length > 0 && (
        <div className="print:hidden max-w-3xl mx-auto mb-10 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-2">Past plans</p>
          <div className="divide-y divide-slate-100">
            {versions.map(v => (
              <div key={v.version} className="flex items-center justify-between py-2 text-sm">
                <span>Version {v.version}</span>
                <span className="text-slate-400 text-xs">
                  {new Date(v.generated_at).toLocaleString('en-IN')} · {formatCurrency(v.snapshot.totalMonthlySIP)}/mo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
