import { getSupabase, DB_NOT_CONFIGURED } from '@/lib/supabase'
import type { PlanSnapshot } from '@/types'

// F-11: plan version history, backed by Supabase.
//   GET  /api/plans?clientId=…  → versions for a client (newest first)
//   POST /api/plans { snapshot } → save the next version, returns it

export async function GET(req: Request) {
  const db = getSupabase()
  if (!db) return Response.json(DB_NOT_CONFIGURED, { status: 503 })

  const clientId = new URL(req.url).searchParams.get('clientId')
  if (!clientId) return Response.json({ error: 'clientId is required.' }, { status: 400 })

  const { data, error } = await db
    .from('plan_versions')
    .select('version, snapshot, generated_at')
    .eq('client_id', clientId)
    .order('version', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ versions: data ?? [] })
}

export async function POST(req: Request) {
  const db = getSupabase()
  if (!db) return Response.json(DB_NOT_CONFIGURED, { status: 503 })

  let body: { snapshot?: PlanSnapshot }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const snapshot = body.snapshot
  if (!snapshot?.clientId) return Response.json({ error: 'snapshot.clientId is required.' }, { status: 400 })

  // Next version number = current max + 1 (per client).
  const { data: last, error: maxErr } = await db
    .from('plan_versions')
    .select('version')
    .eq('client_id', snapshot.clientId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (maxErr) return Response.json({ error: maxErr.message }, { status: 500 })

  const version = (last?.version ?? 0) + 1

  const { error: insertErr } = await db.from('plan_versions').insert({
    client_id: snapshot.clientId,
    client_name: snapshot.clientName,
    version,
    snapshot,
    generated_at: snapshot.generatedAt,
  })
  if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

  return Response.json({ version, snapshot })
}
