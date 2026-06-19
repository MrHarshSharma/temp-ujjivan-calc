import { getSupabase, DB_NOT_CONFIGURED } from '@/lib/supabase'
import { isAdmin } from '@/lib/adminAuth'
import { DEFAULT_PRODUCTS } from '@/constants/products.constants'
import type { ProductMaster } from '@/types'

// F-02 / F-12: admin-editable product master, backed by Supabase.
//   GET  /api/products            → full master (seeds from constants if empty)
//   POST /api/products { product } → upsert one product (admin only)

export async function GET() {
  const db = getSupabase()
  if (!db) {
    // No DB → fall back to the built-in seed so the RM tool still works.
    return Response.json({ products: DEFAULT_PRODUCTS, source: 'seed' })
  }

  const { data, error } = await db.from('products').select('data')
  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) {
    // Seed the table once from the built-in constants.
    const rows = DEFAULT_PRODUCTS.map(p => ({ id: p.id, data: p }))
    const { error: seedErr } = await db.from('products').insert(rows)
    if (seedErr) return Response.json({ error: seedErr.message }, { status: 500 })
    return Response.json({ products: DEFAULT_PRODUCTS, source: 'seeded' })
  }

  const products = data.map(r => r.data as ProductMaster)
  return Response.json({ products, source: 'db' })
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return Response.json({ error: 'Unauthorised.' }, { status: 401 })
  const db = getSupabase()
  if (!db) return Response.json(DB_NOT_CONFIGURED, { status: 503 })

  let body: { product?: ProductMaster }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  const product = body.product
  if (!product?.id) return Response.json({ error: 'product.id is required.' }, { status: 400 })

  const { error } = await db.from('products').upsert({
    id: product.id,
    data: { ...product, updatedAt: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
