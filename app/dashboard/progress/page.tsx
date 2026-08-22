import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProgressView, type CheckinPoint } from "@/components/progress/ProgressView"

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data } = await supabase
    .from("weekly_checkins")
    .select("week_number, weight, waist, hips, neck, chest, arm, thigh, calf, energy_level, sleep_score, mood, digestion_score, adherence_score, steps, symptoms")
    .eq("client_id", user.id)
    .order("week_number", { ascending: true })

  return <ProgressView checkins={(data || []) as CheckinPoint[]} />
}
