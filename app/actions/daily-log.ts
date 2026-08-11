'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { guard, failed } from '@/lib/errors'

export interface DailyLog {
  date: string
  workout_done: boolean
  meals_followed: number
}

/**
 * Upsert the client's own adherence log for a given local date (YYYY-MM-DD,
 * passed from the browser so late-evening logs land on the right day in IST).
 * RLS: logs_insert_own / logs_update_own scope writes to auth.uid().
 */
export async function saveDailyLog(input: { date: string; workoutDone: boolean; mealsFollowed: number }) {
  return guard('dailyLog.saveDailyLog', failed("Couldn't save today's log."), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      return { success: false, error: 'Invalid date' }
    }
    const meals = Math.max(0, Math.min(10, Math.round(input.mealsFollowed)))

    const { data: existing } = await supabase
      .from('daily_logs')
      .select('id')
      .eq('client_id', user.id)
      .eq('date', input.date)
      .maybeSingle()

    const row = { workout_done: input.workoutDone, meals_followed: meals, updated_at: new Date().toISOString() }
    const { error } = existing
      ? await supabase.from('daily_logs').update(row).eq('id', existing.id)
      : await supabase.from('daily_logs').insert({ client_id: user.id, date: input.date, ...row })

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard')
    return { success: true }
  })
}
