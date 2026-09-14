import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

export const MAIN_MEALS = ["Breakfast", "Lunch", "Dinner"] as const

/** Local-date guard for anything the browser sends. */
export const isLocalDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

/**
 * Recompute one day's daily_logs row from the tables that actually hold the facts.
 *
 * meal_logs is the only record of which meals she ate and exercise_logs the only
 * record of training; daily_logs.meals_followed and workout_done are copies kept
 * for the coach's 14-day strip and the reminder cron. Every write to either
 * source table ends here, so the copy can never disagree with the source — the
 * bug this replaces was the same day logged "2 of 3 meals" on Today and "3" in
 * meal detail.
 *
 * Steps have no other source, so the existing value is carried over untouched.
 */
export async function syncDailyLog(supabase: SupabaseClient, clientId: string, date: string) {
  const [{ data: meals }, { count: sets }, { data: existing }] = await Promise.all([
    supabase.from("meal_logs").select("meal").eq("client_id", clientId).eq("date", date).eq("done", true),
    supabase.from("exercise_logs").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("date", date),
    supabase.from("daily_logs").select("steps").eq("client_id", clientId).eq("date", date).maybeSingle(),
  ])
  const eaten = new Set((meals || []).map((m) => m.meal)).size
  const steps = typeof existing?.steps === "number" ? existing.steps : null
  const { error } = await supabase.from("daily_logs").upsert(
    {
      client_id: clientId,
      date,
      meals_followed: Math.min(10, eaten),
      workout_done: (sets ?? 0) > 0,
      walk_done: (steps ?? 0) >= 3000,
      steps,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "client_id,date" }
  )
  return error
}
