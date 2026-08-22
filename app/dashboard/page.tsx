import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"
import { EmptyCheckInState } from "./empty-checkin-state"
import { nextLesson } from "@/app/actions/lessons"
import { getPlansForClient } from "@/app/actions/plans"
import { scheduledDays, sessionFor, todayDayOfWeek } from "@/lib/plans/schedule"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch client profile
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", user.id)
    .single()

  // If no profile or not onboarded, redirect to onboarding
  if (!client || !client.onboarding_completed) {
    redirect("/onboarding")
  }

  // Fetch all weekly checkins ordered by week_number DESC
  const { data: allCheckins } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("client_id", user.id)
    .order("week_number", { ascending: false })

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
      { data: w0FirstLesson },
    ] = await Promise.all([
      supabase.from("plans").select("id").eq("client_id", user.id).limit(1),
      supabase.from("health_profiles").select("medication").eq("client_id", user.id).maybeSingle(),
      supabase.from("lab_results").select("id").eq("client_id", user.id).limit(1),
      supabase.from("messages").select("id").eq("client_id", user.id).eq("from_coach", false).limit(1),
      supabase.from("lesson_reads").select("id").eq("client_id", user.id).limit(1),
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
          firstLessonSlug: w0FirstLesson?.slug ?? null,
        }}
      />
    )
  }

  const latestCheckin = allCheckins[0]

  // Fetch latest coach insight
  const { data: latestInsight } = await supabase
    .from("coach_insights")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Fetch the coach's feedback on this client's check-ins. RLS policy
  // feedback_select_own_client (migration 006) lets a client read feedback on
  // their own check-ins, so this authed read is safe + scoped. Read-only.
  const checkinIdToWeek = new Map(allCheckins.map((c) => [c.id, c.week_number]))
  const { data: feedbackRows } = await supabase
    .from("checkin_feedback")
    .select("id, checkin_id, body, created_at")
    .in("checkin_id", allCheckins.map((c) => c.id))
    .order("created_at", { ascending: false })

  const coachFeedback = (feedbackRows || []).map((f) => ({
    id: f.id as string,
    weekNumber: (checkinIdToWeek.get(f.checkin_id) ?? null) as number | null,
    body: f.body as string,
    createdAt: f.created_at as string,
  }))

  // Daily adherence logs → REAL streaks (last 180 days). Degrades to zeros if
  // the daily_logs table isn't provisioned yet (migration 008) — the query
  // errors softly and `logs` is null.
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("date, workout_done, meals_followed")
    .eq("client_id", user.id)
    .order("date", { ascending: false })
    .limit(180)

  const dayStr = (d: Date) => d.toLocaleDateString("en-CA")
  const activeDays = new Set(
    (logs || [])
      .filter((l) => l.workout_done || (l.meals_followed || 0) > 0)
      .map((l) => l.date as string)
  )

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

  // Thyroid medication for the home reminder card (from the health profile).
  const { data: healthProfile } = await supabase
    .from("health_profiles")
    .select("medication, medication_dose, medication_timing")
    .eq("client_id", user.id)
    .maybeSingle()

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
  // Next unread, unlocked lesson — drives the home "Learn" card.
  const upNextLesson = await nextLesson()

  // Today's session, so home answers "what do I do today" rather than just
  // linking to the plan and making her work it out.
  const { workout: workoutPlan } = await getPlansForClient(user.id)
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
    // Real streaks computed from daily_logs (not the never-written clients columns)
    streak: {
      current: streakCurrent,
      best: Math.max(streakBest, streakCurrent),
    },
    monthlyGoal: { current: monthlyCount, target: 30 },
    todayLog: {
      workoutDone: Boolean(todayLog?.workout_done),
      mealsFollowed: todayLog?.meals_followed || 0,
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
    coachInsight: latestInsight?.insight || "Welcome to your dashboard! Your coach will add personalized insights here soon.",
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
