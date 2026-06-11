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

  // Calculate average stats
  const avgWeight = clients?.reduce((sum, c) => sum + (c.current_weight || 0), 0) / (totalClients || 1)
  const avgRecovery = clients?.reduce((sum, c) => sum + (c.recovery_score || 0), 0) / (totalClients || 1)

  return (
    <CoachDashboardClient
      clients={clients || []}
      pendingReviews={pendingReviews || []}
      stats={{
        totalClients,
        activeClients,
        pendingCheckins,
        avgWeight: avgWeight.toFixed(1),
        avgRecovery: avgRecovery.toFixed(0),
      }}
    />
  )
}
