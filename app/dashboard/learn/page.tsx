import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { listLessons } from "@/app/actions/lessons"
import { LessonsView } from "@/components/learn/LessonsView"

export const metadata = {
  title: "Learn | ThyroWell",
  description: "Short, thyroid-specific lessons that unlock as you move through your programme." }

export default async function LearnPage() {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  const lessons = await listLessons()
  return <LessonsView lessons={lessons} />
}
