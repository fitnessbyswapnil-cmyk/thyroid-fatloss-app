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
      error: userError,
    } = await supabase.auth.getUser()

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
      submitted_at: new Date().toISOString(),
    }

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

    // Carry the new weight onto the client record.
    //
    // current_weight was written once at onboarding and never again, while six
    // places read it: her "kg lost" figure, the coach roster, and — worst — the
    // calorie target calculator, which was sizing her plan from her day-one body.
    // A client who had genuinely lost 11kg still showed 0.0 lost, and her macros
    // were computed for someone 11kg heavier.
    //
    // Deliberately not fatal: the check-in itself is already saved, and losing
    // this sync is far better than telling her the check-in failed.
    if (typeof formData.weight === 'number' && Number.isFinite(formData.weight) && formData.weight > 0) {
      const { error: weightError } = await supabase
        .from('clients')
        .update({ current_weight: formData.weight })
        .eq('id', user.id)
      if (weightError) console.error('[submitWeeklyCheckIn] current_weight sync failed:', weightError)
    }

    // Deltas compare against her PREVIOUS check-in, not against "this week
    // minus one". Assuming week-1 meant a client who missed a single week saw
    // no deltas at all — and the week-over-week panel is the payoff of the whole
    // flow. It also broke across a new year, where week 1 minus 1 is week 0.
    const { data: prevCheckin } = await supabase
      .from('weekly_checkins')
      .select('energy_level, sleep_quality, weight, submitted_at')
      .eq('client_id', user.id)
      .neq('week_number', weekNumber)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

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
        prevWeight,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { success: false, error: message }
  }
}
