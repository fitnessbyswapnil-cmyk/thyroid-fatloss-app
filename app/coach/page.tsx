import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CoachDashboardClient } from "./coach-dashboard-client"
import { getPendingReviews } from "@/app/actions/coach-reviews"
import { buildAlerts, sortAlerts, type CoachAlert } from "@/lib/coach/alerts"

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

  // Clients waiting for a reply — unread messages from clients (coach side).
  const { data: unreadMsgs } = await supabase
    .from("messages")
    .select("client_id")
    .eq("from_coach", false)
    .eq("read_by_coach", false)

  const unreadByClient: Record<string, number> = {}
  for (const m of unreadMsgs || []) {
    if (m.client_id) unreadByClient[m.client_id] = (unreadByClient[m.client_id] || 0) + 1
  }
  const waitingClients = Object.entries(unreadByClient)
    .map(([id, count]) => ({ id, full_name: (clients || []).find(c => c.id === id)?.full_name || "Client", count }))
    .sort((a, b) => b.count - a.count)

  // ── Data → action alerts ────────────────────────────────────────────────
  // Pull check-ins and labs for the whole roster in two queries, group by
  // client, and run the alert rules (lib/coach/alerts.ts).
  const activeIds = (clients || []).filter((c) => c.subscription_status === "active").map((c) => c.id)
  let alerts: CoachAlert[] = []
  if (activeIds.length) {
    const [{ data: alertCheckins }, { data: alertLabs }] = await Promise.all([
      supabase
        .from("weekly_checkins")
        .select("client_id, week_number, weight, energy_level, adherence_score, symptoms")
        .in("client_id", activeIds),
      supabase
        .from("lab_results")
        .select("client_id, taken_on, tsh, t3, t4, vitamin_d, b12, ferritin, extras")
        .in("client_id", activeIds),
    ])

    const byClient = <T extends { client_id: string }>(rows: T[] | null) => {
      const m: Record<string, T[]> = {}
      for (const r of rows || []) (m[r.client_id] ||= []).push(r)
      return m
    }
    const ciMap = byClient(alertCheckins as never)
    const labMap = byClient(alertLabs as never)

    alerts = sortAlerts(
      (clients || [])
        .filter((c) => c.subscription_status === "active")
        .flatMap((c) =>
          buildAlerts({
            clientId: c.id,
            clientName: c.full_name || "Client",
            checkins: (ciMap[c.id] || []) as never,
            labs: (labMap[c.id] || []) as never,
          })
        )
    )
  }

  // App errors in the last 7 days — logging them is only useful if the coach
  // can see that something is failing without a client having to report it.
  // RLS on error_logs is coach-read-only, so this returns 0 for anyone else.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recentErrorCount } = await supabase
    .from("error_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", weekAgo)

  // Calculate average stats
  const avgWeight = clients?.reduce((sum, c) => sum + (c.current_weight || 0), 0) / (totalClients || 1)

  return (
    <CoachDashboardClient
      clients={clients || []}
      pendingReviews={pendingReviews || []}
      lastCheckIns={lastCheckIns}
      quietClients={quietClients}
      waitingClients={waitingClients}
      alerts={alerts}
      recentErrorCount={recentErrorCount || 0}
      stats={{
        totalClients,
        activeClients,
        pendingCheckins,
        avgWeight: avgWeight.toFixed(1),
      }}
    />
  )
}
