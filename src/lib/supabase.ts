import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client (service-role key). Never import this from a
 * client component — all DB access goes through Next API routes.
 * Returns null when the DB is not configured so routes can degrade gracefully.
 */
let cached: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (!cached) {
    cached = createClient(url, key, { auth: { persistSession: false } })
  }
  return cached
}

export const DB_NOT_CONFIGURED = {
  error: 'Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.',
}
