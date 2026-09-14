import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { getPlansForClient } from "@/app/actions/plans"
import { buildTodayWorkout } from "@/lib/plans/today"
import { MoveToday } from "@/components/dashboard/MoveToday"
import { getClientToday } from "@/lib/client-hour"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"

/**
 * Move tab: today's walk and exercises, with a Start button that walks her
 * through them one at a time and ticks the daily log at the end.
 */
export default async function MovePage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  const today = await getClientToday()
  // Trained today = any set in exercise_logs, the one record of training.
  const [{ workout }, { count: setsToday }, sp] = await Promise.all([
    getPlansForClient(user.id),
    supabase.from("exercise_logs").select("id", { count: "exact", head: true }).eq("client_id", user.id).eq("date", today),
    searchParams,
  ])

  const items = workout?.content?.workoutItems || []
  const todays = buildTodayWorkout(items)
  const sections = (workout?.content?.sections || []).filter((s) => s.heading || s.body)

  return (
    <div
      className="min-h-screen"
      style={{ background: "#090c14", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}
    >
      <MoveToday
        hasPlan={todays.hasPlan}
        walk={todays.walk}
        exercises={todays.exercises}
        allItems={items}
        sections={sections}
        autoStart={sp.start === "1"}
        log={{ workoutDone: (setsToday ?? 0) > 0 }}
      />
      <BottomNavPill />
    </div>
  )
}
