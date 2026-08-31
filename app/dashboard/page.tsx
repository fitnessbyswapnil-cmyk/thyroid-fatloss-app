import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"
import { EmptyCheckInState } from "./empty-checkin-state"
import { nextLesson } from "@/app/actions/lessons"
import { getPlansForClient } from "@/app/actions/plans"
import { scheduledDays, sessionFor, todayDayOfWeek } from "@/lib/plans/schedule"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const user = await getAuthUser(supabase)
  
  if (!user) {
    redirect("/auth/login")
  }

  // meal_logs / exercise_logs hold many rows per day, so they are bounded by date
  // rather than by row count the way daily_logs is — 180 days matches the streak
  // window below. They are also read newest-first: exercise_logs is one row per
  // SET, so six months of it can cross PostgREST's max-rows cap, and an unordered
  // read would then truncate arbitrarily — possibly dropping THIS week and zeroing
  // the streak, which is the exact bug the union below exists to fix. Ordered, a
  // truncation can only ever cost her the oldest days.
  const streakWindowStart = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA")

  // Everything that only needs user.id goes out at once. These used to run one
  // after another, and the database is in Singapore while this function runs in
  // Mumbai — so each sequential query cost a fresh round trip and the page spent
  // most of its time waiting rather than working.
  const [
    { data: client },
    { data: allCheckins },
    { data: latestInsight },
    { data: logs },
    { data: mealLogDays },
    { data: exerciseLogDays },
    { data: healthProfile },
    { data: feedbackRows, error: feedbackError },
    upNextLesson,
    plansForClient,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", user.id).single(),
    supabase.from("weekly_checkins").select("*").eq("client_id", user.id).order("submitted_at", { ascending: false }),
    supabase.from("coach_insights").select("*").eq("client_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("daily_logs").select("date, workout_done, walk_done, meals_followed, steps").eq("client_id", user.id).order("date", { ascending: false }).limit(180),
    supabase.from("meal_logs").select("date, done").eq("client_id", user.id).gte("date", streakWindowStart).order("date", { ascending: false }),
    supabase.from("exercise_logs").select("date").eq("client_id", user.id).gte("date", streakWindowStart).order("date", { ascending: false }),
    supabase.from("health_profiles").select("medication, medication_dose, medication_timing").eq("client_id", user.id).maybeSingle(),
    // The coach's notes on her check-ins. checkin_feedback has no client_id of
    // its own, only checkin_id, so this used to wait for the check-in ids and
    // cost a SECOND Mumbai→Singapore round trip after this whole batch had
    // already landed — on the screen she opens most. Filtering through an inner
    // join on the parent check-in asks the same question ("feedback on rows that
    // are mine") in this trip instead, and keeps the client_id filter explicit
    // rather than leaning on RLS alone to scope it.
    supabase
      .from("checkin_feedback")
      .select("id, checkin_id, body, created_at, weekly_checkins!inner(client_id)")
      .eq("weekly_checkins.client_id", user.id)
      .order("created_at", { ascending: false }),
    nextLesson(),
    getPlansForClient(user.id),
  ])

  // If no profile or not onboarded, redirect to onboarding
  if (!client || !client.onboarding_completed) {
    redirect("/onboarding")
  }

  // If no check-ins exist, show empty state
  if (!allCheckins || allCheckins.length === 0) {
    // Week 0: give her real things to do while the coach builds her plan, and
    // reflect what she's already completed instead of a static wall.
    const [
      { data: w0Plan },
      { data: w0Profile },
      { data: w0Labs },
      { data: w0Msgs },
      { data: w0Reads },
      { data: w0Photos },
      { data: w0FirstLesson },
    ] = await Promise.all([
      supabase.from("plans").select("id").eq("client_id", user.id).limit(1),
      supabase.from("health_profiles").select("medication").eq("client_id", user.id).maybeSingle(),
      supabase.from("lab_results").select("id").eq("client_id", user.id).limit(1),
      supabase.from("messages").select("id").eq("client_id", user.id).eq("from_coach", false).limit(1),
      supabase.from("lesson_reads").select("id").eq("client_id", user.id).limit(1),
      supabase.from("progress_photos").select("id").eq("client_id", user.id).limit(1),
      supabase.from("lessons").select("slug").eq("published", true).order("week_number").limit(1).maybeSingle(),
    ])

    return (
      <EmptyCheckInState
        name={client.full_name?.split(" ")[0] || "Friend"}
        status={{
          hasPlan: (w0Plan?.length ?? 0) > 0,
          hasMedication: Boolean(w0Profile?.medication),
          hasLabs: (w0Labs?.length ?? 0) > 0,
          hasMessaged: (w0Msgs?.length ?? 0) > 0,
          hasReadLesson: (w0Reads?.length ?? 0) > 0,
          hasBaselinePhotos: (w0Photos?.length ?? 0) > 0,
          firstLessonSlug: w0FirstLesson?.slug ?? null,
        }}
      />
    )
  }

  const latestCheckin = allCheckins[0]

  // Feedback came back with the batch above. RLS policy feedback_select_own_client
  // (migration 006) scopes it to her own check-ins as well; the join filter is
  // belt and braces. Read-only.
  const checkinIdToWeek = new Map(allCheckins.map((c) => [c.id, c.week_number]))

  // The note from her coach is the single thing a 1:1 client is paying for, so
  // it does not get to disappear quietly if the join above ever stops resolving
  // — a schema change, a renamed relationship. Falling back costs a round trip
  // that the normal path no longer pays at all.
  const feedback = feedbackError
    ? (
        await supabase
          .from("checkin_feedback")
          .select("id, checkin_id, body, created_at")
          .in("checkin_id", allCheckins.map((c) => c.id))
          .order("created_at", { ascending: false })
      ).data
    : feedbackRows

  const coachFeedback = (feedback || []).map((f) => ({
    id: f.id as string,
    weekNumber: (checkinIdToWeek.get(f.checkin_id) ?? null) as number | null,
    body: f.body as string,
    createdAt: f.created_at as string,
  }))

  // Daily adherence logs → REAL streaks (last 180 days). Degrades to zeros if
  // the tables aren't provisioned yet (migrations 008 and 019).
  const dayStr = (d: Date) => d.toLocaleDateString("en-CA")
  // A day counts if she showed up on ANY surface. Ticking a meal or logging a
  // set writes to meal_logs / exercise_logs, never to daily_logs — so a client
  // who did all her logging on the plan screen used to be told her streak was
  // zero. The app asked for the work and then denied it happened.
  const activeDays = new Set<string>([
    ...(logs || [])
      .filter((l) => l.workout_done || l.walk_done || (l.meals_followed || 0) > 0 || l.steps != null)
      .map((l) => l.date as string),
    ...(mealLogDays || []).filter((m) => m.done).map((m) => m.date as string),
    ...(exerciseLogDays || []).map((e) => e.date as string),
  ])

  // Current streak: walk back from today (grace for a not-yet-logged today).
  let streakCurrent = 0
  {
    const d = new Date()
    if (!activeDays.has(dayStr(d))) d.setDate(d.getDate() - 1)
    while (activeDays.has(dayStr(d))) {
      streakCurrent++
      d.setDate(d.getDate() - 1)
    }
  }
  // Best streak within the window.
  let streakBest = 0
  {
    let run = 0
    let prev: string | null = null
    for (const ds of [...activeDays].sort()) {
      run = prev && (new Date(ds).getTime() - new Date(prev).getTime()) === 86400000 ? run + 1 : 1
      streakBest = Math.max(streakBest, run)
      prev = ds
    }
  }
  const monthPrefix = dayStr(new Date()).slice(0, 7)
  const monthlyCount = [...activeDays].filter((d) => d.startsWith(monthPrefix)).length
  const todayLog = (logs || []).find((l) => l.date === dayStr(new Date())) || null

  // Calculate program week
  const startDate = client.start_date ? new Date(client.start_date) : new Date()
  const programWeek = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
  const dayOfReset = client.start_date
    ? Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1)
    : null

  // Calculate weight lost
  const weightLost = client.start_weight && client.current_weight 
    ? (client.start_weight - client.current_weight).toFixed(1)
    : "0"

  // Calculate TSH improvement
  const tshImprovement = client.tsh_before && client.tsh_current
    ? Math.round(((client.tsh_before - client.tsh_current) / client.tsh_before) * 100)
    : 0

  // Calculate subscores from latest check-in data (1-10 scale, convert to 0-100)
  const energyScore = (latestCheckin.energy_level || 7) * 10
  const sleepScore = (latestCheckin.sleep_quality || latestCheckin.sleep_score || 7) * 10
  const stressScore = 100 - ((latestCheckin.stress_level || 5) * 10) // Inverse: low stress = high score
  const digestionScore = latestCheckin.digestion_score ? (latestCheckin.digestion_score * 10) : 70

  // Calculate wellness score from latest check-in
  const wellnessScoreCurrent = Math.round((energyScore + sleepScore + stressScore + digestionScore) / 4)
  
  // Get previous week's data for delta calculation
  const previousCheckin = allCheckins.length > 1 ? allCheckins[1] : null
  const prevEnergyScore = previousCheckin ? ((previousCheckin.energy_level || 7) * 10) : energyScore
  const wellnessScorePrevious = previousCheckin 
    ? Math.round((
        ((previousCheckin.energy_level || 7) * 10) +
        ((previousCheckin.sleep_quality || previousCheckin.sleep_score || 7) * 10) +
        (100 - ((previousCheckin.stress_level || 5) * 10)) +
        (previousCheckin.digestion_score ? (previousCheckin.digestion_score * 10) : 70)
      ) / 4)
    : wellnessScoreCurrent

  const wellnessScoreDelta = wellnessScoreCurrent - wellnessScorePrevious

  // Prepare dashboard data
  // Today's session, so home answers "what do I do today" rather than just
  // linking to the plan and making her work it out.
  const { workout: workoutPlan } = plansForClient
  const workoutItems = workoutPlan?.content?.workoutItems || []
  const todayDow = todayDayOfWeek()
  const hasSchedule = scheduledDays(workoutItems).size > 0
  const todaysSession = sessionFor(workoutItems, todayDow)
  const todayFocus = {
    hasPlan: workoutItems.length > 0,
    hasSchedule,
    count: todaysSession.length,
    // Only call it a rest day when the coach actually scheduled a week.
    isRestDay: hasSchedule && todaysSession.length === 0,
  }

  const dashboardData = {
    name: client.full_name?.split(" ")[0] || "Friend",
    programWeek,
    dayOfReset,
    nextLesson: upNextLesson
      ? { slug: upNextLesson.slug, title: upNextLesson.title, summary: upNextLesson.summary, minutes: upNextLesson.read_minutes, category: upNextLesson.category }
      : null,
    todayFocus,
    medication: healthProfile
      ? { name: healthProfile.medication, dose: healthProfile.medication_dose, timing: healthProfile.medication_timing }
      : null,
    recoveryPercent: Math.min(0.95, (client.recovery_score || 0) / 100),
    wellnessScore: { 
      current: wellnessScoreCurrent, 
      previous: wellnessScorePrevious, 
      delta: wellnessScoreDelta 
    },
    subscores: {
      // Real, per-check-in metrics only. (TSH is a self-entered lab value on the
      // clients row, not a per-check-in 0–100 score — so it is shown as the
      // client's own reading elsewhere, not fabricated into a wellness subscore.)
      mood: (latestCheckin.mood || 7) * 10,
      energyLevels: energyScore,
      sleepQuality: sleepScore,
      mentalClarity: stressScore,
    },
    // Real streaks computed from what she actually logged (not the never-written
    // clients columns)
    streak: {
      current: streakCurrent,
      best: Math.max(streakBest, streakCurrent),
    },
    monthlyGoal: { current: monthlyCount, target: 30 },
    todayLog: {
      workoutDone: Boolean(todayLog?.workout_done),
      walkDone: Boolean(todayLog?.walk_done),
      mealsFollowed: todayLog?.meals_followed || 0,
      steps: typeof todayLog?.steps === "number" ? todayLog.steps : null,
    },
    weight: { 
      current: client.current_weight || 0, 
      start: client.start_weight || 0, 
      goal: client.target_weight || 0, 
      lost: parseFloat(weightLost)
    },
    tsh: { 
      before: client.tsh_before || 0, 
      current: client.tsh_current || 0 
    },
    tshImprovement,
    energy: latestCheckin.energy_level || 7,
    sleep: latestCheckin.sleep_quality || latestCheckin.sleep_score || 7,
    // No fallback text. The card is hidden when there is no insight rather than
    // filled with something the coach never said — a placeholder under a header
    // claiming he is reviewing her progress, timestamped Today, is the fastest
    // way to make the genuine parts of this screen read as theatre.
    coachInsight: latestInsight?.insight ?? null,
    insightTimestamp: latestInsight?.created_at 
      ? new Date(latestInsight.created_at).toLocaleDateString("en-IN", { 
          weekday: "long", 
          hour: "numeric", 
          minute: "2-digit" 
        })
      : "Today",
    isNewInsight: latestInsight ? !latestInsight.is_read : false,
    dailyIntention: "Small, consistent steps add up. Be kind to yourself today.",
    chartData: allCheckins.map(c => ({
      week_number: c.week_number,
      weight: c.weight || 0,
      energy_level: c.energy_level || 0,
      sleep_score: c.sleep_quality || c.sleep_score || 0
    })) || [],
    coachFeedback,
  }

  return <DashboardClient data={dashboardData} />
}
