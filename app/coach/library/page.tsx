import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { listExercises, listFoods } from "@/app/actions/library"
import { LibraryManager } from "@/components/coach/LibraryManager"

// Coach-only library (role gate mirrors coach/layout.tsx; RLS enforces too).
export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: me } = await supabase.from("clients").select("role").eq("id", user.id).single()
  if (!me || !["coach", "admin"].includes(me.role)) redirect("/dashboard")

  const [exercises, foods] = await Promise.all([listExercises(), listFoods()])

  return <LibraryManager initialExercises={exercises} initialFoods={foods} />
}
