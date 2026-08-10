/**
 * Data → action rules for the coach dashboard.
 *
 * The app already collects labs, check-ins and symptoms, but data sitting in a
 * table doesn't coach anyone. These rules turn it into a worklist: what changed
 * for whom, and what the coach should do about it today.
 *
 * Pure functions — no I/O — so the thresholds stay testable.
 *
 * MEDICAL BOUNDARY: lab rules only ever surface "this value is outside the
 * range printed on her report, worth a doctor conversation". They never
 * interpret, diagnose, or imply a medication change.
 */
import { parseSymptoms, symptomBurden, symptomChanges } from "@/lib/health/symptoms"
import { CORE_RANGES } from "@/lib/labs/parse"

export type AlertKind = "lab" | "energy" | "adherence" | "symptoms" | "win"

export interface CoachAlert {
  clientId: string
  clientName: string
  kind: AlertKind
  /** urgent = act today · attention = review this week · win = send encouragement */
  severity: "urgent" | "attention" | "win"
  title: string
  detail: string
  href: string
}

export interface AlertCheckin {
  week_number: number
  weight: number | null
  energy_level: number | null
  adherence_score: number | null
  symptoms?: unknown
}

export interface AlertLab {
  taken_on: string
  tsh: number | null
  t3: number | null
  t4: number | null
  vitamin_d: number | null
  b12: number | null
  ferritin: number | null
  extras?: Array<{ name: string; value: number; unit: string | null; low: number | null; high: number | null }> | null
}

export interface AlertInput {
  clientId: string
  clientName: string
  checkins: AlertCheckin[] // any order; sorted internally by week
  labs: AlertLab[] // any order; sorted internally by date
}

const LOW_ENERGY_MAX = 4 // on the 1–10 scale
const LOW_ENERGY_WEEKS = 3
const ADHERENCE_DROP = 25 // percentage points week-over-week
const SYMPTOM_WORSENING = 3 // total burden increase

/** Out-of-range readings in the most recent lab report. */
function labFlags(lab: AlertLab): string[] {
  const out: string[] = []
  // Full extracted panel carries the range printed on that client's own report.
  for (const e of lab.extras || []) {
    if (e.low === null || e.high === null || !Number.isFinite(e.value)) continue
    if (e.value < e.low) out.push(`${e.name} ${e.value}${e.unit ? " " + e.unit : ""} (low)`)
    else if (e.value > e.high) out.push(`${e.name} ${e.value}${e.unit ? " " + e.unit : ""} (high)`)
  }
  if (out.length) return out
  // Manual entries have no printed range — fall back to standard ranges.
  for (const [key, def] of Object.entries(CORE_RANGES)) {
    const v = lab[key as keyof AlertLab]
    if (typeof v !== "number" || !Number.isFinite(v)) continue
    if (v < def.low) out.push(`${def.name} ${v} (low)`)
    else if (v > def.high) out.push(`${def.name} ${v} (high)`)
  }
  return out
}

export function buildAlerts(input: AlertInput): CoachAlert[] {
  const { clientId, clientName } = input
  const base = { clientId, clientName }
  const alerts: CoachAlert[] = []
  const checkins = [...input.checkins].sort((a, b) => a.week_number - b.week_number)
  const labs = [...input.labs].sort((a, b) => a.taken_on.localeCompare(b.taken_on))
  const profileHref = `/coach/client/${clientId}`
  const chatHref = `${profileHref}/messages`

  // 1 — Out-of-range labs on the most recent report.
  const latestLab = labs[labs.length - 1]
  if (latestLab) {
    const flags = labFlags(latestLab)
    if (flags.length) {
      alerts.push({
        ...base,
        kind: "lab",
        severity: "urgent",
        title: `${flags.length} lab value${flags.length === 1 ? "" : "s"} out of range`,
        detail: `${flags.slice(0, 3).join(" · ")}${flags.length > 3 ? ` · +${flags.length - 3} more` : ""} — worth a doctor conversation`,
        href: `${profileHref}/health`,
      })
    }
  }

  // 2 — Sustained low energy across the last few check-ins.
  const recent = checkins.slice(-LOW_ENERGY_WEEKS)
  if (
    recent.length === LOW_ENERGY_WEEKS &&
    recent.every((c) => typeof c.energy_level === "number" && c.energy_level <= LOW_ENERGY_MAX)
  ) {
    alerts.push({
      ...base,
      kind: "energy",
      severity: "attention",
      title: `Energy low ${LOW_ENERGY_WEEKS} weeks running`,
      detail: `Reported ${recent.map((c) => c.energy_level).join(", ")}/10 — consider easing volume or reviewing recovery`,
      href: profileHref,
    })
  }

  // 3 — Sharp adherence drop week-over-week.
  if (checkins.length >= 2) {
    const [prev, latest] = checkins.slice(-2)
    if (
      typeof prev.adherence_score === "number" &&
      typeof latest.adherence_score === "number" &&
      prev.adherence_score - latest.adherence_score >= ADHERENCE_DROP
    ) {
      alerts.push({
        ...base,
        kind: "adherence",
        severity: "attention",
        title: "Adherence dropped sharply",
        detail: `${prev.adherence_score}% → ${latest.adherence_score}% — ask what got in the way before adjusting the plan`,
        href: chatHref,
      })
    }
  }

  // 4 & 5 — Symptom direction, and the non-scale win worth celebrating.
  const scored = checkins
    .map((c) => ({ week: c.week_number, weight: c.weight, energy: c.energy_level, s: parseSymptoms(c.symptoms) }))
    .filter((x) => x.s !== null)
  if (scored.length >= 2) {
    const first = scored[0]
    const prev = scored[scored.length - 2]
    const latest = scored[scored.length - 1]
    const prevBurden = symptomBurden(prev.s)
    const latestBurden = symptomBurden(latest.s)

    if (prevBurden !== null && latestBurden !== null && latestBurden - prevBurden >= SYMPTOM_WORSENING) {
      alerts.push({
        ...base,
        kind: "symptoms",
        severity: "attention",
        title: "Symptoms worsening",
        detail: `Symptom load ${prevBurden} → ${latestBurden} since last check-in — worth asking what changed`,
        href: profileHref,
      })
    }

    // Weight stalled or up, but symptoms clearly better → the moment a client
    // is most likely to quit, and the easiest one to save with a message.
    const improved = symptomChanges(first.s, latest.s).filter((c) => c.delta < 0).length
    const weightStalled =
      typeof first.weight === "number" &&
      typeof latest.weight === "number" &&
      latest.weight >= first.weight - 0.5
    if (weightStalled && improved >= 2) {
      alerts.push({
        ...base,
        kind: "win",
        severity: "win",
        title: "Scale stalled but symptoms improving",
        detail: `${improved} symptoms better since week ${first.week} — send this before she gets discouraged`,
        href: chatHref,
      })
    }
  }

  return alerts
}

/** Urgent first, then attention, then wins. */
export function sortAlerts(alerts: CoachAlert[]): CoachAlert[] {
  const rank = { urgent: 0, attention: 1, win: 2 } as const
  return [...alerts].sort((a, b) => rank[a.severity] - rank[b.severity])
}
