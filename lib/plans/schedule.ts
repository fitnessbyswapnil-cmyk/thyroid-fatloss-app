import type { WorkoutItem } from "@/app/actions/plans"

/**
 * Weekly scheduling for workout plans.
 *
 * A plan without a calendar is a document: the client opens it and has to work
 * out what today is for. Assigning each exercise to a weekday turns it into a
 * programme she can follow — "today's session" instead of "the plan".
 */

export const DAYS = [
  { n: 1, short: "M", label: "Mon" },
  { n: 2, short: "T", label: "Tue" },
  { n: 3, short: "W", label: "Wed" },
  { n: 4, short: "T", label: "Thu" },
  { n: 5, short: "F", label: "Fri" },
  { n: 6, short: "S", label: "Sat" },
  { n: 7, short: "S", label: "Sun" },
] as const

/** JS getDay() is 0=Sun..6=Sat; we use 1=Mon..7=Sun so the week reads Mon-first. */
export function todayDayOfWeek(d: Date = new Date()): number {
  const js = d.getDay()
  return js === 0 ? 7 : js
}

export function dayLabel(n: number | null | undefined): string {
  return DAYS.find((d) => d.n === n)?.label ?? "Any day"
}

/**
 * Best-effort read of the legacy freeform `day` field, so plans built before
 * scheduling existed still land on the right weekday instead of all collapsing
 * into "Any day".
 */
export function inferDayOfWeek(item: WorkoutItem): number | null {
  if (typeof item.dayOfWeek === "number" && item.dayOfWeek >= 1 && item.dayOfWeek <= 7) {
    return item.dayOfWeek
  }
  const raw = (item.day || "").trim().toLowerCase()
  if (!raw) return null
  const byName: Record<string, number> = {
    mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, weds: 3, wednesday: 3,
    thu: 4, thur: 4, thurs: 4, thursday: 4, fri: 5, friday: 5,
    sat: 6, saturday: 6, sun: 7, sunday: 7,
  }
  if (byName[raw] !== undefined) return byName[raw]
  // "Day 1".."Day 7" maps onto Mon..Sun.
  const m = raw.match(/^day\s*([1-7])$/)
  if (m) return Number(m[1])
  return null
}

/** Group items by weekday. Key 0 collects everything unscheduled. */
export function groupByDay(items: WorkoutItem[]): Map<number, WorkoutItem[]> {
  const map = new Map<number, WorkoutItem[]>()
  for (const it of items) {
    const d = inferDayOfWeek(it) ?? 0
    const arr = map.get(d) || []
    arr.push(it)
    map.set(d, arr)
  }
  return map
}

/** Days that actually have work assigned — everything else is a rest day. */
export function scheduledDays(items: WorkoutItem[]): Set<number> {
  const s = new Set<number>()
  for (const it of items) {
    const d = inferDayOfWeek(it)
    if (d) s.add(d)
  }
  return s
}

/** Today's exercises, falling back to unscheduled items when nothing is set. */
export function sessionFor(items: WorkoutItem[], day: number): WorkoutItem[] {
  const grouped = groupByDay(items)
  const scheduled = grouped.get(day) || []
  if (scheduled.length) return scheduled
  // A plan with no scheduling at all shouldn't show an empty app — surface the
  // unscheduled items rather than implying there's nothing to do.
  return scheduledDays(items).size === 0 ? grouped.get(0) || [] : []
}
