import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect, notFound } from "next/navigation"
import { getLesson } from "@/app/actions/lessons"
import { LessonReader } from "@/components/learn/LessonReader"

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  // Locally verified token. getLesson still does its own auth work internally,
  // so this gate should not also be paying an Auth-server round trip for it.
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  const lesson = await getLesson(slug)
  if (!lesson) notFound()
  // Don't let a shared link jump the queue on a not-yet-unlocked lesson.
  if (lesson.locked) redirect("/dashboard/learn")

  return <LessonReader lesson={lesson} />
}
