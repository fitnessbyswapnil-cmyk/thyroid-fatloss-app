import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Server-side error capture and action guarding.
 *
 * Before this, an unhandled throw inside a server action surfaced as a blank
 * 500 and vanished — no record anywhere. Now every unexpected failure is
 * written to console (visible in Vercel logs) and to error_logs (queryable,
 * survives log retention, and drives the coach dashboard indicator).
 */

/** Fire-and-forget: logging must never be the reason a request fails. */
export async function logError(context: string, err: unknown, userId?: string | null) {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack ?? null : null
  console.error(`[${context}]`, message, stack ?? '')
  try {
    await createAdminClient()
      .from('error_logs')
      .insert({ context, message: message.slice(0, 1000), stack: stack?.slice(0, 4000) ?? null, user_id: userId ?? null })
  } catch {
    // Swallow — if the log write itself fails we've already hit console.
  }
}

/**
 * Run an action, and on an unexpected throw log it and return `fallback`
 * instead of propagating a blank 500.
 *
 * The generic keeps each call site's return type exactly as it was, so read
 * functions can fall back to `[]` / `null` while mutations fall back to
 * `{ success: false, error }` — no contract changes for callers.
 */
export async function guard<T>(context: string, fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    await logError(context, err)
    return fallback
  }
}

/** Convenience fallback for mutation-style actions. */
export function failed(error = 'Something went wrong. Please try again.') {
  return { success: false as const, error }
}
