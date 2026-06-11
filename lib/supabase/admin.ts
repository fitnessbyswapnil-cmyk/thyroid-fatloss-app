import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client — BYPASSES RLS. Use ONLY in trusted server code (server
 * actions / route handlers) AFTER verifying the caller is authorized. Never
 * import this into client components.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
