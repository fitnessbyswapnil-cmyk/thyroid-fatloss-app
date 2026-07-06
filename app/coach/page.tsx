import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CoachDashboardClient } from "./coach-dashboard-client"
import { getPendingReviews } from "@/app/actions/coach-reviews"

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Verify user is a coach
  const { data: coach } = await supabase
    .from("clients")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!coach || coach.role !== "coach") {
    redirect("/dashboard")
  }

  // Fetch all clients
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false })

  // Get pending reviews
  const { reviews: pendingReviews } = await getPendingReviews()

  // Get stats
  const activeClients = clients?.filter(c => c.subscription_status === "active").length || 0
  const totalClients = clients?.length || 0

  // Get pending checkins (clients who haven't submitted this week)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  
  const { data: recentCheckins } = await supabase
    .from("weekly_checkins")
    .select("client_id")
    .gte("submitted_at", weekStart.toISOString())

  const clientsWithCheckins = new Set(recentCheckins?.map(c => c.client_id) || [])
  const pendingCheckins = clients?.filter(c => !clientsWithCheckins.has(c.id)).length || 0

  // Last check-in per client (coach reads all check-ins via RLS). Used for the
  // roster "last check-in" column and the quiet-clients triage list.
  const { data: allClientCheckins } = await supabase
    .from("weekly_checkins")
    .select("client_id, submitted_at")
    .order("submitted_at", { ascending: false })

  const lastCheckIns: Record<string, string> = {}
  for (const row of allClientCheckins || []) {
    if (row.client_id && !lastCheckIns[row.client_id]) {
      lastCheckIns[row.client_id] = row.submitted_at
    }
  }

  // Quiet clients = active + onboarded but no check-in in the last 7 days (or ever).
  const DAY = 24 * 60 * 60 * 1000
  const now = Date.now()
  const quietClients = (clients || [])
    .filter(c => c.subscription_status === "active" && c.onboarding_completed)
    .map(c => {
      const last = lastCheckIns[c.id]
      const daysSince = last ? Math.floor((now - new Date(last).getTime()) / DAY) : null
      return { id: c.id, full_name: c.full_name, daysSince }
    })
    .filter(c => c.daysSince === null || c.daysSince >= 7)
    .sort((a, b) => (b.daysSince ?? Number.MAX_SAFE_INTEGER) - (a.daysSince ?? Number.MAX_SAFE_INTEGER))

  // Calculate average stats
  const avgWeight = clients?.reduce((sum, c) => sum + (c.current_weight || 0), 0) / (totalClients || 1)

  return (
    <CoachDashboardClient
      clients={clients || []}
      pendingReviews={pendingReviews || []}
      lastCheckIns={lastCheckIns}
      quietClients={quietClients}
      stats={{
        totalClients,
        activeClients,
        pendingCheckins,
        avgWeight: avgWeight.toFixed(1),
      }}
    />
  )
}
