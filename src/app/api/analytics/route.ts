import { getSupabase, DB_NOT_CONFIGURED } from '@/lib/supabase'
import { isAdmin } from '@/lib/adminAuth'
import type { PlanSnapshot } from '@/types'

// F-12: RM usage / client analytics aggregated from the DB. Admin only.
export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: 'Unauthorised.' }, { status: 401 })
  const db = getSupabase()
  if (!db) return Response.json(DB_NOT_CONFIGURED, { status: 503 })

  const { data: plans, error: pErr } = await db
    .from('plan_versions')
    .select('client_id, snapshot, generated_at')
    .order('generated_at', { ascending: false })
  if (pErr) return Response.json({ error: pErr.message }, { status: 500 })

  const { data: events, error: eErr } = await db.from('session_log').select('event')
  if (eErr) return Response.json({ error: eErr.message }, { status: 500 })

  const rows = plans ?? []
  const uniqueClients = new Set(rows.map(r => r.client_id)).size
  const plansGenerated = rows.length

  const evs = events ?? []
  const count = (e: string) => evs.filter(x => x.event === e).length
  const activated = count('activated')
  const deferred = count('deferred')
  const sessionsStarted = count('session_started')

  // Most-recommended products across all snapshots.
  const productTally = new Map<string, number>()
  const goalTally = new Map<string, number>()
  for (const r of rows) {
    const snap = r.snapshot as PlanSnapshot
    for (const g of snap.goals ?? []) {
      goalTally.set(g.category, (goalTally.get(g.category) ?? 0) + 1)
      for (const p of g.products ?? []) productTally.set(p, (productTally.get(p) ?? 0) + 1)
    }
  }
  const topN = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  return Response.json({
    plansGenerated,
    uniqueClients,
    sessionsStarted,
    activated,
    deferred,
    conversionRate: plansGenerated > 0 ? Math.round((activated / plansGenerated) * 100) : 0,
    topProducts: topN(productTally),
    topGoals: topN(goalTally),
    recentPlans: rows.slice(0, 10).map(r => ({
      clientName: (r.snapshot as PlanSnapshot).clientName,
      totalMonthlySIP: (r.snapshot as PlanSnapshot).totalMonthlySIP,
      generatedAt: r.generated_at,
    })),
  })
}
