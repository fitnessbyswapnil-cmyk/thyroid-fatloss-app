import { WeeklyCheckInFlow } from '@/components/dashboard/WeeklyCheckInFlow'
import { createClient } from '@/lib/supabase/server'
import { getWeekNumber } from '@/lib/utils'

export const metadata = {
  title: 'Weekly Check-In | ThyroWell',
  description: 'Complete your weekly health check-in to track your progress.',
}

/**
 * Submitting twice in one week updates that week's row rather than adding a
 * second, so the form has to open with what is already saved. Without this,
 * coming back to add a measurement would rewrite the whole week from blank
 * defaults and quietly erase the original answers.
 */
export default async function CheckInPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let existing = null
  if (user) {
    const { data } = await supabase
      .from('weekly_checkins')
      .select(
        'energy_level, mood, sleep_quality, stress_level, digestion_score, bloating, cravings, adherence_score, workouts_completed, workouts_target, meds_taken, meds_target, weight, steps, neck, chest, waist, hips, arm, thigh, calf, symptoms, reflection_text'
      )
      .eq('client_id', user.id)
      .eq('week_number', getWeekNumber(new Date()))
      .maybeSingle()
    existing = data ?? null
  }

  return <WeeklyCheckInFlow existing={existing} />
}
