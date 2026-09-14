/**
 * One answer to "who needs me today?".
 *
 * The coach home used to show three parallel lists — alerts, pending reviews,
 * engagement — plus a reply list and a quiet list, so the same client could
 * appear four times in four places and none of them said which to do first.
 * This merges every source into one row per client, ranked by the most urgent
 * reason, with every other reason kept on the row so nothing that used to be
 * flagged disappears.
 *
 * Pure: the inputs are what app/coach/page.tsx already computes. The rules that
 * decide *whether* something is flagged stay in lib/coach/alerts.ts and
 * engagement.ts; this only decides order and wording.
 */
import type { CoachAlert } from "@/lib/coach/alerts"
import type { ClientSetup } from "@/lib/coach/assignment"

export type WorkKind = "reply" | "lab" | "review" | "report" | "plan" | "attention" | "quiet" | "never" | "win"

/** Filter chips. Engagement is a filter here, not its own list. */
export type WorkFilter = "all" | "reply" | "review" | "quiet" | "never"

export interface WorkReason {
  kind: WorkKind
  /** Plain words, readable without a tap: "check-in waiting 3 days". */
  text: string
  urgency: number
  href: string
  /** Set when the row opens the check-in review in place. */
  reviewId?: string
}

export interface WorkRow {
  clientId: string
  clientName: string
  top: WorkReason
  others: WorkReason[]
  filters: WorkFilter[]
}

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`
const since = (iso: string, now: number) => Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86_400_000))

export function buildWorklist(input: {
  now: number
  names: Record<string, string>
  pendingReviews: { id: string; client_id: string; submitted_at: string; flag_reason?: string }[]
  alerts: CoachAlert[]
  waiting: { id: string; count: number; waitingSince?: string }[]
  reports: { client_id: string; uploaded_at: string }[]
  quiet: { id: string; daysSince: number | null }[]
  neverStarted: { id: string; daysSinceJoined: number | null }[]
  goneQuiet: { id: string; daysSinceLog: number | null }[]
  setup: Record<string, ClientSetup>
}): WorkRow[] {
  const { now } = input
  const by = new Map<string, WorkReason[]>()
  const add = (clientId: string, r: WorkReason) => {
    const list = by.get(clientId) || []
    list.push(r)
    by.set(clientId, list)
  }

  for (const w of input.waiting) {
    const age = w.waitingSince ? since(w.waitingSince, now) : 0
    add(w.id, {
      kind: "reply",
      text: `waiting for your reply${age > 0 ? ` for ${days(age)}` : ""} · ${w.count} message${w.count === 1 ? "" : "s"}`,
      urgency: 90 + Math.min(age, 9),
      href: `/coach/client/${w.id}/messages`,
    })
  }

  for (const a of input.alerts) {
    if (a.severity === "urgent") {
      add(a.clientId, { kind: "lab", text: `${a.title.charAt(0).toLowerCase()}${a.title.slice(1)}`, urgency: 88, href: a.href })
    } else if (a.severity === "attention") {
      add(a.clientId, { kind: "attention", text: `${a.title.charAt(0).toLowerCase()}${a.title.slice(1)}`, urgency: 62, href: a.href })
    } else {
      add(a.clientId, { kind: "win", text: `a win to send — ${a.title.charAt(0).toLowerCase()}${a.title.slice(1)}`, urgency: 20, href: a.href })
    }
  }

  for (const r of input.pendingReviews) {
    const age = since(r.submitted_at, now)
    add(r.client_id, {
      kind: "review",
      text: `check-in waiting ${age === 0 ? "since today" : days(age)}${r.flag_reason ? ` · ${r.flag_reason.toLowerCase()}` : ""}`,
      urgency: 75 + Math.min(age, 12),
      href: `/coach/client/${r.client_id}`,
      reviewId: r.id,
    })
  }

  // Oldest pending report per client, and how many.
  const reportsBy = new Map<string, { oldest: string; count: number }>()
  for (const r of input.reports) {
    const cur = reportsBy.get(r.client_id)
    if (!cur) reportsBy.set(r.client_id, { oldest: r.uploaded_at, count: 1 })
    else reportsBy.set(r.client_id, { oldest: r.uploaded_at < cur.oldest ? r.uploaded_at : cur.oldest, count: cur.count + 1 })
  }
  for (const [clientId, r] of reportsBy) {
    const age = since(r.oldest, now)
    add(clientId, {
      kind: "report",
      text: `${r.count === 1 ? "blood report" : `${r.count} blood reports`} to enter · sent ${age === 0 ? "today" : `${days(age)} ago`}`,
      urgency: 70 + Math.min(age, 10),
      href: `/coach/client/${clientId}/health`,
    })
  }

  for (const [clientId, s] of Object.entries(input.setup)) {
    const todo = s.items.filter((i) => i.state === "todo" && i.owner === "coach").map((i) => i.label.toLowerCase())
    if (todo.length) {
      add(clientId, { kind: "plan", text: `needs ${todo.join(" and ")}`, urgency: 68, href: `/coach/client/${clientId}#plans` })
    }
  }

  for (const q of input.quiet) {
    add(q.id, {
      kind: "quiet",
      text: q.daysSince === null ? "no check-in yet" : `no check-in for ${days(q.daysSince)}`,
      urgency: 45 + Math.min(q.daysSince ?? 7, 20),
      href: `/coach/client/${q.id}/messages`,
    })
  }
  for (const g of input.goneQuiet) {
    add(g.id, {
      kind: "quiet",
      text: g.daysSinceLog === null ? "nothing logged lately" : `nothing logged for ${days(g.daysSinceLog)}`,
      urgency: 44 + Math.min(g.daysSinceLog ?? 7, 20),
      href: `/coach/client/${g.id}/messages`,
    })
  }
  for (const n of input.neverStarted) {
    add(n.id, {
      kind: "never",
      text: `hasn't started${n.daysSinceJoined !== null ? ` · joined ${days(n.daysSinceJoined)} ago` : ""}`,
      urgency: 55,
      href: `/coach/client/${n.id}`,
    })
  }

  const rows: WorkRow[] = []
  for (const [clientId, reasons] of by) {
    reasons.sort((a, b) => b.urgency - a.urgency)
    // "No check-in" and "nothing logged" say the same thing twice; keep the stronger.
    const seen = new Set<WorkKind>()
    const deduped = reasons.filter((r) => (r.kind === "quiet" ? (seen.has("quiet") ? false : (seen.add("quiet"), true)) : true))
    const kinds = new Set(deduped.map((r) => r.kind))
    const filters: WorkFilter[] = ["all"]
    if (kinds.has("reply")) filters.push("reply")
    if (kinds.has("review") || kinds.has("report")) filters.push("review")
    if (kinds.has("quiet")) filters.push("quiet")
    if (kinds.has("never")) filters.push("never")
    rows.push({ clientId, clientName: input.names[clientId] || "Client", top: deduped[0], others: deduped.slice(1), filters })
  }
  return rows.sort((a, b) => b.top.urgency - a.top.urgency || a.clientName.localeCompare(b.clientName))
}
