'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Record a fault that happened in the client's browser.
 *
 * A screen that "does nothing" leaves no trace on the server: the request
 * succeeded, the HTML shipped, and whatever broke did so afterwards in her
 * browser. Without this the only diagnosis available is asking her to describe
 * it, which is how a bug survives three rounds of fixes.
 *
 * Writes under her own session, so RLS scopes the row to her. Deliberately
 * never throws — a reporter that can fail loudly would turn one broken screen
 * into two.
 */
export async function reportClientError(input: {
  context: string
  message: string
  stack?: string
}) {
  try {
    const supabase = await createClient()
    const { data: claims } = await supabase.auth.getClaims()
    const uid = claims?.claims?.sub as string | undefined
    if (!uid) return { ok: false }

    await supabase.from('error_logs').insert({
      user_id: uid,
      context: input.context.slice(0, 200),
      message: input.message.slice(0, 2000),
      stack: (input.stack || '').slice(0, 6000),
    })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
