'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { guard, failed } from '@/lib/errors'

export interface DailyLog {
  date: string
  workout_done: boolean
  walk_done: boolean
  meals_followed: number
}

/**
 * Upsert the client's own adherence log for a given local date (YYYY-MM-DD,
 * passed from the browser so late-evening logs land on the right day in IST).
 * RLS: logs_insert_own / logs_update_own scope writes to auth.uid().
 */
export async function saveDailyLog(input: { date: string; workoutDone: boolean; walkDone: boolean; mealsFollowed: number }) {
  return guard('dailyLog.saveDailyLog', failed("Couldn't save today's log."), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      return { success: false, error: 'Invalid date' }
    }
    const meals = Math.max(0, Math.min(10, Math.round(input.mealsFollowed)))

    // Single upsert on (client_id, date). The previous select-then-branch let
    // two quick taps both miss the SELECT and both INSERT, splitting one day
    // across two rows — each holding half of what she actually ticked.
    const { error } = await supabase.from('daily_logs').upsert({
      client_id: user.id,
      date: input.date,
      workout_done: input.workoutDone,
      walk_done: input.walkDone,
      meals_followed: meals,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id,date' })

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard')
    return { success: true }
  })
}
