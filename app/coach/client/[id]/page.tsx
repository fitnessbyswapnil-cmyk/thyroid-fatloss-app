import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect, notFound } from "next/navigation"
import { ClientDetailView } from "./client-detail-view"
import { getPlansForClient } from "@/app/actions/plans"
import { buildEngagement } from "@/lib/coach/engagement"

/**
 * Drafting a meal plan with Claude runs from this page, and a model call over a
 * 200-food library is not a sub-second request. Without this the invocation is
 * killed at the platform default mid-draft, the action never returns its
 * { ok: false }, and the coach is left on a button that says "Drafting…"
 * forever.
 *
 * 60 rather than 300 because 60 is the ceiling on Vercel's Hobby plan — a
 * larger number silently fails to apply there. The client-side timeout in
 * lib/plans/claude-draft.ts is set to fit inside this with a retry to spare.
 */
export const maxDuration = 60

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
    dailyLogs,
    mealLogs,
    exerciseLogs,
    lessonReads,
    labs,
    profile,
    foodPrefs,
    pushSubs,
    lessonCount,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("weekly_checkins").select("*").eq("client_id", id).order("submitted_at", { ascending: false }),
    supabase.from("progress_photos").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("coach_insights").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    getPlansForClient(id),
    supabase.from("daily_logs").select("date, workout_done, walk_done, meals_followed").eq("client_id", id).order("date", { ascending: false }).limit(60),
    supabase.from("meal_logs").select("created_at").eq("client_id", id),
    supabase.from("exercise_logs").select("created_at").eq("client_id", id),
    supabase.from("lesson_reads").select("read_at, lesson_id").eq("client_id", id),
    supabase.from("lab_results").select("taken_on").eq("client_id", id),
    supabase.from("health_profiles").select("client_id").eq("client_id", id).maybeSingle(),
    // maybeSingle, not single: a client who onboarded before these questions
    // shipped has no row, and that is a normal state the panel renders for, not
    // an error. select * so a column added for a new onboarding question
    // reaches the coach without a second edit here — the panel already renders
    // from PREF_QUESTIONS, so the only thing it needs is the value.
    supabase.from("food_preferences").select("*").eq("client_id", id).maybeSingle(),
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
      foodPrefs={foodPrefs.data}
      dailyLogs={dailyLogs.data || []}
    />
  )
}
