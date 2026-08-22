'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { guard, failed } from '@/lib/errors'

export interface ExerciseSet {
  exercise_name: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  date: string
}

export interface MealLog {
  meal: string
  done: boolean
  date: string
}

/** Local date (YYYY-MM-DD) comes from the browser so a late-evening log lands on the right day in IST. */
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

/** Upsert one set. Re-saving the same set number corrects it rather than duplicating. */
export async function logExerciseSet(input: {
  date: string
  exerciseName: string
  exerciseId?: string | null
  setNumber: number
  weightKg?: number | null
  reps?: number | null
}) {
  return guard('logs.logExerciseSet', failed('Could not save that set.'), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!isDate(input.date)) return { success: false, error: 'Invalid date' }
    if (!input.exerciseName?.trim()) return { success: false, error: 'Missing exercise' }
    if (!(input.setNumber >= 1 && input.setNumber <= 20)) return { success: false, error: 'Invalid set number' }

    const num = (v: unknown, max: number) => {
      const n = Number(v)
      return v === null || v === undefined || v === '' || !Number.isFinite(n) || n < 0 || n > max ? null : n
    }

    const { error } = await supabase.from('exercise_logs').upsert(
      {
        client_id: user.id,
        date: input.date,
        exercise_name: input.exerciseName.trim().slice(0, 120),
        exercise_id: input.exerciseId ?? null,
        set_number: input.setNumber,
        weight_kg: num(input.weightKg, 999),
        reps: num(input.reps, 200) },
      { onConflict: 'client_id,date,exercise_name,set_number' }
    )
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/plans')
    return { success: true }
  })
}

export async function deleteExerciseSet(date: string, exerciseName: string, setNumber: number) {
  return guard('logs.deleteExerciseSet', failed('Could not remove that set.'), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    const { error } = await supabase
      .from('exercise_logs')
      .delete()
      .eq('client_id', user.id).eq('date', date)
      .eq('exercise_name', exerciseName).eq('set_number', setNumber)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/plans')
    return { success: true }
  })
}

/** Every set logged for one exercise today. */
export async function getSetsForExercise(date: string, exerciseName: string): Promise<ExerciseSet[]> {
  return guard('logs.getSetsForExercise', [], async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from('exercise_logs')
      .select('exercise_name, set_number, weight_kg, reps, date')
      .eq('client_id', user.id).eq('date', date).eq('exercise_name', exerciseName)
      .order('set_number')
    return (data || []) as ExerciseSet[]
  })
}

/**
 * The most recent PREVIOUS session for this exercise — the reference a client
 * needs to beat. Without "last time: 3 × 10 @ 12 kg" on screen, progressive
 * overload is guesswork.
 */
export async function getLastPerformance(date: string, exerciseName: string): Promise<ExerciseSet[]> {
  return guard('logs.getLastPerformance', [], async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    // Most recent date strictly before today that has sets for this exercise.
    const { data: prior } = await supabase
      .from('exercise_logs')
      .select('date')
      .eq('client_id', user.id).eq('exercise_name', exerciseName).lt('date', date)
      .order('date', { ascending: false })
      .limit(1)
    const lastDate = prior?.[0]?.date
    if (!lastDate) return []
    const { data } = await supabase
      .from('exercise_logs')
      .select('exercise_name, set_number, weight_kg, reps, date')
      .eq('client_id', user.id).eq('exercise_name', exerciseName).eq('date', lastDate)
      .order('set_number')
    return (data || []) as ExerciseSet[]
  })
}

/** Tick a meal as eaten-as-planned, or untick it. */
export async function toggleMealLog(date: string, meal: string, done: boolean) {
  return guard('logs.toggleMealLog', failed('Could not update that meal.'), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    if (!isDate(date)) return { success: false, error: 'Invalid date' }
    const name = meal.trim().slice(0, 60) || 'Meal'

    if (!done) {
      const { error } = await supabase
        .from('meal_logs').delete()
        .eq('client_id', user.id).eq('date', date).eq('meal', name)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await supabase.from('meal_logs').upsert(
        { client_id: user.id, date, meal: name, done: true },
        { onConflict: 'client_id,date,meal' }
      )
      if (error) return { success: false, error: error.message }
    }
    revalidatePath('/dashboard/plans')
    revalidatePath('/dashboard')
    return { success: true }
  })
}

export async function getMealLogs(date: string): Promise<MealLog[]> {
  return guard('logs.getMealLogs', [], async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from('meal_logs')
      .select('meal, done, date')
      .eq('client_id', user.id).eq('date', date)
    return (data || []) as MealLog[]
  })
}
