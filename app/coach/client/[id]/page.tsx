import { createClient } from "@/lib/supabase/server"
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
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch client profile
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !client) {
    notFound()
  }

  // Fetch all checkins
  const { data: checkins } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("client_id", id)
    .order("week_number", { ascending: false })

  // Fetch progress photos
  const { data: photos } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })

  // Fetch all coach insights
  const { data: insights } = await supabase
    .from("coach_insights")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })

  const { meal: mealPlan, workout: workoutPlan } = await getPlansForClient(id)

  // Engagement signals — is she actually using the app? Fetched in parallel
  // because none of these depend on each other, and this page already waits on
  // enough round trips.
  const [mealLogs, exerciseLogs, lessonReads, labs, profile, pushSubs, lessonCount] =
    await Promise.all([
      supabase.from("meal_logs").select("created_at").eq("client_id", id),
      supabase.from("exercise_logs").select("created_at").eq("client_id", id),
      supabase.from("lesson_reads").select("read_at, lesson_id").eq("client_id", id),
      supabase.from("lab_results").select("taken_on").eq("client_id", id),
      supabase.from("health_profiles").select("client_id").eq("client_id", id).maybeSingle(),
      supabase.from("push_subscriptions").select("*", { count: "exact", head: true }).eq("client_id", id),
      supabase.from("lessons").select("*", { count: "exact", head: true }).eq("published", true),
    ])

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
