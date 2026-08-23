import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { CoachDashboardClient } from "./coach-dashboard-client"
import { getPendingReviews } from "@/app/actions/coach-reviews"
import { buildAlerts, sortAlerts, type CoachAlert } from "@/lib/coach/alerts"

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  
  const user = await getAuthUser(supabase)
  
  if (!user) {
    redirect("/auth/login")
  }

  // Verify user is a coach
  // Week boundary first — the batch below needs it.
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // One batch. None of these depend on each other, and with the database in a
  // different region from this function every sequential query was a full round
  // trip spent waiting rather than working.
  const [
    { data: coach },
    { data: clients },
    { reviews: pendingReviews },
    { data: recentCheckins },
    { data: allClientCheckins },
    { data: unreadMsgs },
    { count: recentErrorCount },
  ] = await Promise.all([
    supabase.from("clients").select("role").eq("id", user.id).single(),
    supabase.from("clients").select("*").eq("role", "client").order("created_at", { ascending: false }),
    getPendingReviews(),
    supabase.from("weekly_checkins").select("client_id").gte("submitted_at", weekStart.toISOString()),
    supabase.from("weekly_checkins").select("client_id, submitted_at").order("submitted_at", { ascending: false }),
    supabase.from("messages").select("client_id, from_coach, created_at").order("created_at", { ascending: false }),
    supabase.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
  ])

  if (!coach || coach.role !== "coach") {
    redirect("/dashboard")
  }

  const activeClients = clients?.filter(c => c.subscription_status === "active").length || 0
  const totalClients = clients?.length || 0

  const clientsWithCheckins = new Set(recentCheckins?.map(c => c.client_id) || [])
  const pendingCheckins = clients?.filter(c => !clientsWithCheckins.has(c.id)).length || 0

  // Last check-in per client comes from the batch above (coach reads all
  // check-ins via RLS). Drives the roster column and the quiet-clients list.
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
  // Who is waiting = whose most recent message is hers, not who has an unread
  // flag. Opening a thread marks it read as a side effect of merely FETCHING it,
  // so read-and-defer — glancing at your phone between clients — used to delete
  // a paying client from the only list tracking her, unrecoverably.
  const newestByClient = new Map<string, { from_coach: boolean; created_at: string }>()
  const clientMsgSince = new Map<string, number>()
  for (const m of unreadMsgs || []) {
    if (!m.client_id) continue
    if (!newestByClient.has(m.client_id)) {
      newestByClient.set(m.client_id, { from_coach: m.from_coach, created_at: m.created_at })
    }
    // Count her messages since the coach last replied, so the badge means
    // "how much is she waiting on" rather than "how many are unread".
    const newest = newestByClient.get(m.client_id)!
    if (!newest.from_coach && !m.from_coach) {
      clientMsgSince.set(m.client_id, (clientMsgSince.get(m.client_id) || 0) + 1)
    }
  }
  const waitingClients = [...newestByClient.entries()]
    .filter(([, m]) => !m.from_coach)
    .map(([id, m]) => ({
      id,
      full_name: (clients || []).find(c => c.id === id)?.full_name || "Client",
      count: clientMsgSince.get(id) || 1,
      waitingSince: m.created_at,
    }))
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

  // App errors in the last 7 days come from the batch above — logging them is
  // only useful if the coach sees a failure without a client reporting it.
  // RLS on error_logs is coach-read-only, so this is 0 for anyone else.
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
