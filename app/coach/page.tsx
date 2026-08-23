import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { CoachDashboardClient } from "./coach-dashboard-client"
import { buildSetupIndex } from "@/lib/coach/assignment"
import { getPendingReviews } from "@/app/actions/coach-reviews"
import { buildAlerts, sortAlerts, type CoachAlert } from "@/lib/coach/alerts"
import { buildEngagement } from "@/lib/coach/engagement"
import type { RosterEngagement } from "./coach-dashboard-client"

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
    { data: allPlans },
  ] = await Promise.all([
    supabase.from("clients").select("role").eq("id", user.id).single(),
    supabase.from("clients").select("*").eq("role", "client").order("created_at", { ascending: false }),
    getPendingReviews(),
    supabase.from("weekly_checkins").select("client_id").gte("submitted_at", weekStart.toISOString()),
    supabase.from("weekly_checkins").select("client_id, submitted_at").order("submitted_at", { ascending: false }),
    supabase.from("messages").select("client_id, from_coach, created_at").order("created_at", { ascending: false }),
    supabase.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    // Joins the batch rather than running per client: one round trip to
    // Singapore costs about the same as ten, and there is one per client
    // otherwise.
    supabase.from("plans").select("client_id, type, assigned_at, created_at"),
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
  // Every check-in date per client, not just the newest — the engagement pass
  // below needs the whole history, and it is already in memory here.
  const checkinDates: Record<string, string[]> = {}
  for (const row of allClientCheckins || []) {
    if (!row.client_id) continue
    if (!lastCheckIns[row.client_id]) lastCheckIns[row.client_id] = row.submitted_at
    ;(checkinDates[row.client_id] ||= []).push(row.submitted_at)
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

  // ── Data → action alerts, and who is actually opening the app ───────────
  // One batch for the whole roster: the alert inputs (check-ins, labs) plus the
  // raw rows lib/coach/engagement.ts reads. Everything is fetched for all
  // clients at once and grouped in memory — a query per client would be a
  // Mumbai→Singapore round trip each, which is the whole page's latency budget.
  const activeIds = (clients || []).filter((c) => c.subscription_status === "active").map((c) => c.id)
  let alerts: CoachAlert[] = []
  const engagement: RosterEngagement = { neverStarted: [], goneQuiet: [] }
  // meal_logs is several rows a day and exercise_logs is one row per SET, and
  // these read the WHOLE roster at once, so they cross PostgREST's max-rows cap
  // far sooner than a single client's page does. Bounded by date and read
  // newest-first for the reason app/dashboard/page.tsx spells out: an unordered
  // read truncates arbitrarily, which here would drop this week's rows and put
  // clients who are logging every day into the quiet list.
  const ENGAGEMENT_WINDOW_DAYS = 120
  const engagementWindowStart = new Date(now - ENGAGEMENT_WINDOW_DAYS * DAY).toISOString()
  const LOG_ROW_CAP = 1000
  if (activeIds.length) {
    const [
      { data: alertCheckins },
      { data: alertLabs },
      { data: mealRows },
      { data: exerciseRows },
      { data: lessonReadRows },
      { data: photoRows },
      { data: profileRows },
      { data: pushRows },
      { count: lessonsAvailable },
    ] = await Promise.all([
      supabase
        .from("weekly_checkins")
        .select("client_id, week_number, weight, energy_level, adherence_score, symptoms")
        .in("client_id", activeIds),
      supabase
        .from("lab_results")
        .select("client_id, taken_on, tsh, t3, t4, vitamin_d, b12, ferritin, extras")
        .in("client_id", activeIds),
      supabase
        .from("meal_logs")
        .select("client_id, created_at")
        .in("client_id", activeIds)
        .gte("created_at", engagementWindowStart)
        .order("created_at", { ascending: false })
        .limit(LOG_ROW_CAP),
      supabase
        .from("exercise_logs")
        .select("client_id, created_at")
        .in("client_id", activeIds)
        .gte("created_at", engagementWindowStart)
        .order("created_at", { ascending: false })
        .limit(LOG_ROW_CAP),
      supabase.from("lesson_reads").select("client_id, read_at, lesson_id").in("client_id", activeIds),
      supabase.from("progress_photos").select("client_id, created_at").in("client_id", activeIds),
      supabase.from("health_profiles").select("client_id").in("client_id", activeIds),
      supabase.from("push_subscriptions").select("client_id").in("client_id", activeIds),
      supabase.from("lessons").select("*", { count: "exact", head: true }).eq("published", true),
    ])

    const byClient = <T extends { client_id: string }>(rows: T[] | null) => {
      const m: Record<string, T[]> = {}
      for (const r of rows || []) (m[r.client_id] ||= []).push(r)
      return m
    }
    const ciMap = byClient(alertCheckins as never)
    const labMap = byClient(alertLabs as never)

    // Engagement only ever reads one column per table, so these group straight
    // down to the values rather than carrying whole rows around.
    const valuesBy = (rows: unknown, column: string) => {
      const m: Record<string, string[]> = {}
      for (const r of (rows as Record<string, string>[] | null) || []) {
        if (r.client_id) (m[r.client_id] ||= []).push(r[column])
      }
      return m
    }
    const mealDatesBy = valuesBy(mealRows, "created_at")
    const exDatesBy = valuesBy(exerciseRows, "created_at")
    const readDatesBy = valuesBy(lessonReadRows, "read_at")
    const lessonIdsBy = valuesBy(lessonReadRows, "lesson_id")
    const photoDatesBy = valuesBy(photoRows, "created_at")
    const labDatesBy = valuesBy(alertLabs, "taken_on")
    const pushBy = valuesBy(pushRows, "client_id")
    const hasProfile = new Set((profileRows || []).map((r) => r.client_id))

    const activeRoster = (clients || []).filter((c) => c.subscription_status === "active")

    alerts = sortAlerts(
      activeRoster.flatMap((c) =>
        buildAlerts({
          clientId: c.id,
          clientName: c.full_name || "Client",
          checkins: (ciMap[c.id] || []) as never,
          labs: (labMap[c.id] || []) as never,
        })
      )
    )

    // The three signals that move day to day. Labs, photos and the health
    // profile are all legitimately months apart, so they say nothing about
    // whether she opened the app this week.
    const LIVE = new Set(["meals", "training", "checkin"])
    // At the cap the oldest end of the window is missing, so "no rows" stops
    // meaning "never logged". Recent activity is still trustworthy either way,
    // so gone-quiet survives it; never-started is an accusation and does not.
    const logsCapped =
      (mealRows?.length ?? 0) >= LOG_ROW_CAP || (exerciseRows?.length ?? 0) >= LOG_ROW_CAP
    const daysSince = (dates: string[]) => {
      let newest = -Infinity
      for (const d of dates) {
        const t = new Date(d).getTime()
        if (Number.isFinite(t) && t > newest) newest = t
      }
      return newest === -Infinity ? null : Math.max(0, Math.floor((now - newest) / DAY))
    }

    for (const c of activeRoster) {
      const mealDates = mealDatesBy[c.id] || []
      const exDates = exDatesBy[c.id] || []
      const ownCheckins = (checkinDates[c.id] || []).filter(Boolean)

      const e = buildEngagement({
        mealLogDates: mealDates,
        exerciseLogDates: exDates,
        lessonReadDates: readDatesBy[c.id] || [],
        labResultDates: labDatesBy[c.id] || [],
        photoDates: photoDatesBy[c.id] || [],
        checkinDates: ownCheckins,
        hasHealthProfile: hasProfile.has(c.id),
        pushSubscriptions: (pushBy[c.id] || []).length,
        lessonsAvailable: lessonsAvailable ?? 0,
        lessonsRead: new Set(lessonIdsBy[c.id] || []).size,
        now,
      })

      const live = e.signals.filter((s) => LIVE.has(s.key))
      if (live.some((s) => s.state === "active")) continue

      // Never started and gone quiet are different jobs — one is a walkthrough,
      // the other a conversation — so they never get merged into one count.
      // Claiming the first one needs the window to actually reach back to the
      // day she joined with nothing truncated out of it; short of that, all the
      // data supports is that nothing has come in lately, which is the other
      // list. Neither client disappears, so the panel degrades rather than lies.
      const daysSinceJoined = daysSince([c.created_at])
      const provablyNever =
        !logsCapped && daysSinceJoined !== null && daysSinceJoined <= ENGAGEMENT_WINDOW_DAYS

      if (provablyNever && live.every((s) => s.state === "never")) {
        engagement.neverStarted.push({
          id: c.id,
          full_name: c.full_name || "Client",
          daysSinceJoined,
          pushOff: e.signals.some((s) => s.key === "push" && s.state === "never"),
        })
      } else {
        engagement.goneQuiet.push({
          id: c.id,
          full_name: c.full_name || "Client",
          daysSinceLog: daysSince([...mealDates, ...exDates, ...ownCheckins]),
          active: e.active,
          total: e.total,
        })
      }
    }

    const stalest = (a: number | null, b: number | null) =>
      (b ?? Number.MAX_SAFE_INTEGER) - (a ?? Number.MAX_SAFE_INTEGER)
    engagement.neverStarted.sort((a, b) => stalest(a.daysSinceJoined, b.daysSinceJoined))
    engagement.goneQuiet.sort((a, b) => stalest(a.daysSinceLog, b.daysSinceLog))
  }

  // App errors in the last 7 days come from the batch above — logging them is
  // only useful if the coach sees a failure without a client reporting it.
  // RLS on error_logs is coach-read-only, so this is 0 for anyone else.
  // Calculate average stats
  const avgWeight = clients?.reduce((sum, c) => sum + (c.current_weight || 0), 0) / (totalClients || 1)

  // What each client has been given and what is still outstanding.
  const setup = buildSetupIndex(clients || [], allPlans || [])

  return (
    <CoachDashboardClient
      clients={clients || []}
      setup={setup}
      pendingReviews={pendingReviews || []}
      lastCheckIns={lastCheckIns}
      quietClients={quietClients}
      waitingClients={waitingClients}
      alerts={alerts}
      engagement={engagement}
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
