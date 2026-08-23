import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect, notFound } from "next/navigation"
import { ClientDetailView } from "./client-detail-view"
import { getPlansForClient } from "@/app/actions/plans"
import { buildEngagement } from "@/lib/coach/engagement"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const user = await getAuthUser(supabase)
  
  if (!user) {
    redirect("/auth/login")
  }

  // One batch: all of these need only the client id, and the database sits in
  // a different region from this function, so each extra sequential query was a
  // full round trip of pure waiting.
  const [
    { data: client, error },
    { data: checkins },
    { data: photos },
    { data: insights },
    plans,
    mealLogs,
    exerciseLogs,
    lessonReads,
    labs,
    profile,
    pushSubs,
    lessonCount,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("weekly_checkins").select("*").eq("client_id", id).order("submitted_at", { ascending: false }),
    supabase.from("progress_photos").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("coach_insights").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    getPlansForClient(id),
    supabase.from("meal_logs").select("created_at").eq("client_id", id),
    supabase.from("exercise_logs").select("created_at").eq("client_id", id),
    supabase.from("lesson_reads").select("read_at, lesson_id").eq("client_id", id),
    supabase.from("lab_results").select("taken_on").eq("client_id", id),
    supabase.from("health_profiles").select("client_id").eq("client_id", id).maybeSingle(),
    supabase.from("push_subscriptions").select("*", { count: "exact", head: true }).eq("client_id", id),
    supabase.from("lessons").select("*", { count: "exact", head: true }).eq("published", true),
  ])

  if (error || !client) {
    notFound()
  }

  const { meal: mealPlan, workout: workoutPlan } = plans

  const engagement = buildEngagement({
    mealLogDates: (mealLogs.data || []).map((r) => r.created_at),
    exerciseLogDates: (exerciseLogs.data || []).map((r) => r.created_at),
    lessonReadDates: (lessonReads.data || []).map((r) => r.read_at),
    labResultDates: (labs.data || []).map((r) => r.taken_on),
    photoDates: (photos || []).map((p) => p.created_at),
    checkinDates: (checkins || []).map((c) => c.submitted_at).filter(Boolean),
    hasHealthProfile: !!profile.data,
    pushSubscriptions: pushSubs.count ?? 0,
    lessonsAvailable: lessonCount.count ?? 0,
    lessonsRead: new Set((lessonReads.data || []).map((r) => r.lesson_id)).size,
  })

  return (
    <ClientDetailView
      client={client}
      checkins={checkins || []}
      photos={photos || []}
      insights={insights || []}
      mealPlan={mealPlan}
      workoutPlan={workoutPlan}
      coachId={user.id}
      engagement={engagement}
    />
  )
}
