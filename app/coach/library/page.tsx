import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { listExercises, listFoods } from "@/app/actions/library"
import { LibraryManager } from "@/components/coach/LibraryManager"

// Coach-only library (role gate mirrors coach/layout.tsx; RLS enforces too).
export default async function LibraryPage() {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  // The role check used to block the two library reads, which made this page
  // three sequential Mumbai→Singapore round trips for work that has no ordering
  // between its parts. The library tables are coach-only under RLS and the
  // redirect throws before anything renders, so fetching alongside the gate
  // cannot show a non-coach anything.
  const [{ data: me }, exercises, foods] = await Promise.all([
    supabase.from("clients").select("role").eq("id", user.id).single(),
    listExercises(),
    listFoods(),
  ])
  if (!me || !["coach", "admin"].includes(me.role)) redirect("/dashboard")

  return <LibraryManager initialExercises={exercises} initialFoods={foods} />
}
