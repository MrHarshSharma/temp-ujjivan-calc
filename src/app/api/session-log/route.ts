import { getSupabase } from '@/lib/supabase'

// F-04 / F-12: append a session activity event (RM tool writes, fire-and-forget).
export async function POST(req: Request) {
  const db = getSupabase()
  if (!db) return Response.json({ ok: false, skipped: 'db-not-configured' })

  let body: { clientId?: string; event?: string; metadata?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (!body.event) return Response.json({ error: 'event is required.' }, { status: 400 })

  const { error } = await db.from('session_log').insert({
    client_id: body.clientId ?? null,
    event: body.event,
    metadata: body.metadata ?? null,
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
