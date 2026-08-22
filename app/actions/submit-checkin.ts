'use server'

import { createClient } from '@/lib/supabase/server'
import { getWeekNumber } from '@/lib/utils'
import { toScore, DIGESTION, BLOATING, CRAVINGS, ADHERENCE } from '@/lib/health/checkin-scales'

export interface CheckInSubmissionData {
  energy: number
  mood: number
  sleepQuality: number
  stress: number
  digestion: string
  bloating: string
  cravings: string
  nutritionAdherence: string
  workoutsCompleted: number
  workoutsTarget: number
  medsTaken: number
  medsTarget: number
  weight?: number
  /** Average daily steps for the week; optional. */
  steps?: number
  /** Body sites in cm; any subset (the measurements step is skippable). */
  measurements?: Record<string, number | null>
  /** Thyroid symptom cluster scored 0 (none) – 3 (severe). */
  symptoms: Record<string, number>
  reflectionText: string
}

interface SubmissionResult {
  success: boolean
  error?: string
  data?: {
    weekScore: number
    energyDelta: number
    sleepDelta: number
    weightDelta: number | null
    prevEnergy: number | null
    prevSleep: number | null
    prevWeight: number | null
  }
}

// Convert text values to numeric scales for database
// Scales live in lib/health/checkin-scales.ts so the reopen path reads the
// same maps this writes. Thin wrappers keep the call sites below unchanged.
const convertDigestion = (v: string) => toScore(DIGESTION, v, 5)
const convertBloating = (v: string) => toScore(BLOATING, v, 5)
const convertCravings = (v: string) => toScore(CRAVINGS, v, 5)
const convertNutritionAdherence = (v: string) => toScore(ADHERENCE, v, 50)

export async function submitWeeklyCheckIn(
  formData: CheckInSubmissionData
): Promise<SubmissionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Authentication failed. Please log in again.' }
    }

    // Get current week number
    const weekNumber = getWeekNumber(new Date())

    // Check if check-in already exists for this week
    const { data: existingCheckin, error: fetchError } = await supabase
      .from('weekly_checkins')
      .select('id, week_number')
      .eq('client_id', user.id)
      .eq('week_number', weekNumber)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected)
      return { success: false, error: 'Failed to fetch existing check-in.' }
    }

    // Prepare data for insert/update
    const checkinData = {
      client_id: user.id,
      week_number: weekNumber,
      energy_level: formData.energy,
      mood: formData.mood,
      sleep_quality: formData.sleepQuality,
      stress_level: formData.stress,
      digestion_score: convertDigestion(formData.digestion),
      bloating: convertBloating(formData.bloating),
      cravings: convertCravings(formData.cravings),
      adherence_score: convertNutritionAdherence(formData.nutritionAdherence),
      workouts_completed: formData.workoutsCompleted,
      workouts_target: formData.workoutsTarget,
      meds_taken: formData.medsTaken,
      meds_target: formData.medsTarget,
      weight: formData.weight || null,
      steps: typeof formData.steps === 'number' && Number.isFinite(formData.steps) ? formData.steps : null,
      // Body sites: persisted to their own columns so they chart like weight.
      // Only finite numbers are written — an untouched field stays null rather
      // than becoming 0, which would read as a real (and alarming) measurement.
      ...(() => {
        const m = formData.measurements || {}
        const out: Record<string, number | null> = {}
        for (const site of ['neck', 'chest', 'waist', 'hips', 'arm', 'thigh', 'calf']) {
          const v = m[site]
          out[site] = typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null
        }
        return out
      })(),
      symptoms: Object.keys(formData.symptoms || {}).length > 0 ? formData.symptoms : null,
      reflection_text: formData.reflectionText || null,
      status: 'submitted',
      submitted_at: new Date().toISOString() }

    let upsertError
    if (existingCheckin) {
      // Update existing
      const { error } = await supabase
        .from('weekly_checkins')
        .update(checkinData)
        .eq('id', existingCheckin.id)
      upsertError = error
    } else {
      // Insert new
      const { error } = await supabase.from('weekly_checkins').insert([checkinData])
      upsertError = error
    }

    if (upsertError) {
      return { success: false, error: `Failed to save check-in: ${upsertError.message}` }
    }

    // Fetch previous week's data for deltas
    const previousWeek = weekNumber - 1
    const { data: prevCheckin, error: prevError } = await supabase
      .from('weekly_checkins')
      .select('energy_level, sleep_quality, weight')
      .eq('client_id', user.id)
      .eq('week_number', previousWeek)
      .single()

    const prevEnergy = prevCheckin?.energy_level || null
    const prevSleep = prevCheckin?.sleep_quality || null
    const prevWeight = prevCheckin?.weight || null

    // Calculate week score
    const weekScore = Math.round((formData.energy + formData.sleepQuality + (10 - formData.stress)) / 3)

    // Calculate deltas
    const energyDelta = prevEnergy !== null ? formData.energy - prevEnergy : 0
    const sleepDelta = prevSleep !== null ? formData.sleepQuality - prevSleep : 0
    const weightDelta =
      prevWeight !== null && formData.weight !== undefined ? prevWeight - formData.weight : null

    return {
      success: true,
      data: {
        weekScore,
        energyDelta,
        sleepDelta,
        weightDelta,
        prevEnergy,
        prevSleep,
        prevWeight } }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: message }
  }
}
