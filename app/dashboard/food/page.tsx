import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { getPlansForClient } from "@/app/actions/plans"
import { buildTodayMeals, dayNumberFrom } from "@/lib/plans/today"
import { FoodToday } from "@/components/dashboard/FoodToday"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"

/**
 * Food tab: today's meals first, every other option one tap away.
 *
 * The old Plans page listed all 21 options in one column and left her to work
 * out which to eat. Here the day's suggestion leads, Swap opens the rest of
 * that slot only, and the coach's written guidance sits underneath.
 */
export default async function FoodPage() {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  const [{ meal }, { data: client }] = await Promise.all([
    getPlansForClient(user.id),
    supabase.from("clients").select("start_date").eq("id", user.id).maybeSingle(),
  ])

  const dayNumber = dayNumberFrom(client?.start_date)
  const meals = buildTodayMeals(meal?.content?.mealItems, dayNumber)
  const sections = (meal?.content?.sections || []).filter((s) => s.heading || s.body)

  return (
    <div
      className="min-h-screen"
      style={{ background: "#090c14", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}
    >
      <FoodToday
        title={meal?.title || "Your food"}
        updatedAt={meal?.updated_at ?? null}
        meals={meals}
        sections={sections}
        filePath={meal?.file_path ?? null}
        hasPlan={Boolean(meal)}
      />
      <BottomNavPill />
    </div>
  )
}
