import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"
import { EmptyCheckInState } from "./empty-checkin-state"

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
    return <EmptyCheckInState name={client.full_name?.split(" ")[0] || "Friend"} />
  }

  const latestCheckin = allCheckins[0]

  // Fetch today's habits
  const today = new Date().toISOString().split("T")[0]
  const { data: todayHabits } = await supabase
    .from("daily_habits")
    .select("*")
    .eq("client_id", user.id)
    .eq("date", today)
    .single()

  // Fetch latest coach insight
  const { data: latestInsight } = await supabase
    .from("coach_insights")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Calculate program week
  const startDate = client.start_date ? new Date(client.start_date) : new Date()
  const programWeek = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))

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
  const dashboardData = {
    name: client.full_name?.split(" ")[0] || "Friend",
    programWeek,
    recoveryPercent: Math.min(0.95, (client.recovery_score || 0) / 100),
    wellnessScore: { 
      current: wellnessScoreCurrent, 
      previous: wellnessScorePrevious, 
      delta: wellnessScoreDelta 
    },
    subscores: {
      tshBalance: energyScore,
      energyLevels: energyScore,
      sleepQuality: sleepScore,
      mentalClarity: stressScore,
    },
    streak: { 
      current: client.streak_current || 0, 
      best: client.streak_best || 0 
    },
    monthlyGoal: { current: client.streak_current || 0, target: 30 },
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
    dailyIntention: "Every cell in your body is working to heal. Trust the process, honor your journey.",
    todayHabits,
    chartData: allCheckins.map(c => ({
      week_number: c.week_number,
      weight: c.weight || 0,
      energy_level: c.energy_level || 0,
      sleep_score: c.sleep_quality || c.sleep_score || 0
    })) || [],
  }

  return <DashboardClient data={dashboardData} />
}
