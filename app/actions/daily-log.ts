'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { revalidatePath } from 'next/cache'
import { guard, failed } from '@/lib/errors'
import { MAIN_MEALS, isLocalDate, syncDailyLog } from '@/lib/logging/daily-sync'
import { getPlansForClient } from '@/app/actions/plans'
import { buildTodayWorkout } from '@/lib/plans/today'

/**
 * The three taps on Today, each writing to the table that owns the fact.
 *
 *   meals     → meal_logs      (one row per eaten meal)
 *   exercises → exercise_logs  (one row per set)
 *   steps     → daily_logs.steps, the only place steps live
 *
 * daily_logs.meals_followed / workout_done are then recomputed from the source
 * tables by syncDailyLog, never written directly. Dates are her local date,
 * sent by the browser.
 */

function revalidate() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/food')
  revalidatePath('/dashboard/move')
}

/** Tick or untick one of the three meals for a day. */
export async function setMealEaten(date: string, meal: string, eaten: boolean) {
  return guard('dailyLog.setMealEaten', failed("Couldn't save that meal."), async () => {
    const supabase = await createClient()
    const user = await getAuthUser(supabase)
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!isLocalDate(date)) return { success: false, error: 'Invalid date' }
    if (!(MAIN_MEALS as readonly string[]).includes(meal)) return { success: false, error: 'Unknown meal' }

    const { error } = eaten
      ? await supabase.from('meal_logs').upsert({ client_id: user.id, date, meal, done: true }, { onConflict: 'client_id,date,meal' })
      : await supabase.from('meal_logs').delete().eq('client_id', user.id).eq('date', date).eq('meal', meal)
    if (error) return { success: false, error: error.message }

    const syncError = await syncDailyLog(supabase, user.id, date)
    if (syncError) return { success: false, error: syncError.message }
    revalidate()
    return { success: true }
  })
}

/**
 * The fast path for "did today's exercises".
 *
 * Ticking records one set for each of that day's scheduled exercises — without
 * overwriting any set she already logged in detail. Unticking removes the day's
 * sets, because an untick means she did not train and the record should say so.
 * The day's exercises come from her plan on the server, not from the browser.
 */
export async function setExercisesDone(date: string, done: boolean) {
  return guard('dailyLog.setExercisesDone', failed("Couldn't save that."), async () => {
    const supabase = await createClient()
    const user = await getAuthUser(supabase)
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!isLocalDate(date)) return { success: false, error: 'Invalid date' }

    if (done) {
      const { workout } = await getPlansForClient(user.id)
      const { exercises } = buildTodayWorkout(workout?.content?.workoutItems, new Date(`${date}T12:00:00`))
      if (exercises.length === 0) return { success: false, error: 'Nothing is scheduled today — the walk is enough.' }
      const rows = exercises.map((ex) => ({
        client_id: user.id,
        date,
        exercise_name: ex.name.trim().slice(0, 120),
        exercise_id: ex.exerciseId ?? null,
        set_number: 1,
      }))
      const { error } = await supabase
        .from('exercise_logs')
        .upsert(rows, { onConflict: 'client_id,date,exercise_name,set_number', ignoreDuplicates: true })
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await supabase.from('exercise_logs').delete().eq('client_id', user.id).eq('date', date)
      if (error) return { success: false, error: error.message }
    }

    const syncError = await syncDailyLog(supabase, user.id, date)
    if (syncError) return { success: false, error: syncError.message }
    revalidate()
    return { success: true }
  })
}

/** Steps band for a day. null clears it ("not logged"). */
export async function setSteps(date: string, steps: number | null) {
  return guard('dailyLog.setSteps', failed("Couldn't save your steps."), async () => {
    const supabase = await createClient()
    const user = await getAuthUser(supabase)
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!isLocalDate(date)) return { success: false, error: 'Invalid date' }
    const value = steps === null ? null : Math.max(0, Math.min(100000, Math.round(steps)))

    const { error } = await supabase
      .from('daily_logs')
      .upsert({ client_id: user.id, date, steps: value, walk_done: (value ?? 0) >= 3000, updated_at: new Date().toISOString() }, { onConflict: 'client_id,date' })
    if (error) return { success: false, error: error.message }

    const syncError = await syncDailyLog(supabase, user.id, date)
    if (syncError) return { success: false, error: syncError.message }
    revalidate()
    return { success: true }
  })
}
