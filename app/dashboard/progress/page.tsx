import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { ProgressView, type CheckinPoint } from "@/components/progress/ProgressView"

export default async function ProgressPage() {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  // start_date is what turns a stored ISO week into "Week 6 of your programme",
  // which is the only week number that means anything to her.
  const [{ data }, { data: client }] = await Promise.all([
    supabase
      .from("weekly_checkins")
      .select("week_number, submitted_at, weight, waist, hips, neck, chest, arm, thigh, calf, energy_level, sleep_quality, sleep_score, mood, digestion_score, adherence_score, steps, symptoms")
      .eq("client_id", user.id)
      .order("submitted_at", { ascending: true }),
    supabase.from("clients").select("start_date").eq("id", user.id).maybeSingle(),
  ])

  return <ProgressView checkins={(data || []) as CheckinPoint[]} startDate={client?.start_date ?? null} />
}
