import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { PhotoCompare, type PhotoSet } from "@/components/progress/PhotoCompare"

export const metadata = {
  title: "Before & After | ThyroWell",
  description: "Compare your progress photos side by side over time.",
}

export default async function ComparePhotosPage() {
  const supabase = await createClient()
  // Locally verified token, not an Auth-server round trip in front of the batch.
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  const [{ data: photos }, { data: checkins }] = await Promise.all([
    supabase
      .from("progress_photos")
      .select("id, week_number, upload_date, front_photo, side_photo, back_photo")
      .eq("client_id", user.id)
      .order("upload_date", { ascending: true }),
    supabase
      .from("weekly_checkins")
      .select("week_number, weight")
      .eq("client_id", user.id),
  ])

  // Attach the weight from the matching week so the comparison can show both
  // what changed visually and what the scale said at the time.
  const weightByWeek = new Map<number, number>()
  for (const c of checkins || []) {
    if (c.week_number != null && typeof c.weight === "number") weightByWeek.set(c.week_number, c.weight)
  }

  const sets: PhotoSet[] = (photos || []).map((p) => ({
    ...p,
    weight: p.week_number != null ? weightByWeek.get(p.week_number) ?? null : null,
  }))

  return <PhotoCompare sets={sets} />
}
