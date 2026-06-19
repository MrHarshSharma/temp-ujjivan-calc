import { getSupabase, DB_NOT_CONFIGURED } from '@/lib/supabase'
import { isAdmin } from '@/lib/adminAuth'

// F-06 / F-12: material events (fund manager change, merger, underperformance)
// that feed the AI portfolio analysis. Admin managed.
export async function GET(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: 'Unauthorised.' }, { status: 401 })
  const db = getSupabase()
  if (!db) return Response.json(DB_NOT_CONFIGURED, { status: 503 })

  const { data, error } = await db
    .from('material_events')
    .select('id, product_id, event_type, description, event_date, created_at')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ events: data ?? [] })
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: 'Unauthorised.' }, { status: 401 })
  const db = getSupabase()
  if (!db) return Response.json(DB_NOT_CONFIGURED, { status: 503 })

  let body: { productId?: string; eventType?: string; description?: string; eventDate?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (!body.productId || !body.eventType) {
    return Response.json({ error: 'productId and eventType are required.' }, { status: 400 })
  }

  const { error } = await db.from('material_events').insert({
    product_id: body.productId,
    event_type: body.eventType,
    description: body.description ?? null,
    event_date: body.eventDate || null,
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
