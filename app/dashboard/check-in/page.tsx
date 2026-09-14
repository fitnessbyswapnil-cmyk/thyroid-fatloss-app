import { WeeklyCheckInFlow } from '@/components/dashboard/WeeklyCheckInFlow'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from "@/lib/supabase/auth"
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
  const user = await getAuthUser(supabase)

  let existing = null
  let lastWeight: number | null = null
  if (user) {
    const [{ data }, { data: client }] = await Promise.all([
      supabase
      .from('weekly_checkins')
      .select(
        'energy_level, mood, sleep_quality, stress_level, digestion_score, bloating, cravings, adherence_score, workouts_completed, workouts_target, meds_taken, meds_target, weight, steps, neck, chest, waist, hips, arm, thigh, calf, symptoms, reflection_text'
      )
      .eq('client_id', user.id)
      .eq('week_number', getWeekNumber(new Date()))
      .maybeSingle(),
      // Her weight from the last check-in (kept on clients by submitWeeklyCheckIn),
      // so the weight step starts there and needs taps, not typing.
      supabase.from('clients').select('current_weight').eq('id', user.id).maybeSingle(),
    ])
    existing = data ?? null
    lastWeight = typeof client?.current_weight === 'number' ? client.current_weight : null
  }

  return <WeeklyCheckInFlow existing={existing} lastWeight={lastWeight} />
}
