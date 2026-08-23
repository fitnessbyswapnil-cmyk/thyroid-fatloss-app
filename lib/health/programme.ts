/**
 * One definition of "what week is she in".
 *
 * "Week number" meant four different things at once. Check-ins are stored under
 * the ISO calendar week of the year, which is a fine deduplication key — one
 * check-in per calendar week — but it was also being *displayed*. So her home
 * screen said "Week 10 of your reset" while the same person's progress chart
 * plotted W25 to W34 and the coach's review queue labelled yesterday's check-in
 * "Week 34".
 *
 * The programme week is the only one that means anything to either of them:
 * how far into her twelve weeks she is. It is derived from her start date, so
 * it cannot drift from the stored key and needs no migration.
 */

const DAY = 86_400_000

/**
 * Which week of her programme a moment falls in. 1-based: the day she starts is
 * week 1, not week 0.
 *
 * Returns null when there is no start date — better a missing label than a
 * confidently wrong one.
 */
export function programmeWeek(
  startDate: string | Date | null | undefined,
  at: string | Date = new Date()
): number | null {
  if (!startDate) return null
  const start = new Date(startDate).getTime()
  const when = new Date(at).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(when)) return null
  // Compare whole days so a start at 9pm and a check-in at 8am next morning
  // don't land a week apart.
  const days = Math.floor((atMidnight(when) - atMidnight(start)) / DAY)
  if (days < 0) return null
  return Math.floor(days / 7) + 1
}

function atMidnight(t: number): number {
  const d = new Date(t)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/** "Week 6", or a date fallback when there is no start date to count from. */
export function weekLabel(
  startDate: string | Date | null | undefined,
  at: string | Date | null | undefined
): string {
  if (!at) return "—"
  const w = programmeWeek(startDate, at)
  if (w !== null) return `Week ${w}`
  return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

/** Short form for a chart axis: "W6". */
export function weekTick(
  startDate: string | Date | null | undefined,
  at: string | Date | null | undefined
): string {
  if (!at) return ""
  const w = programmeWeek(startDate, at)
  if (w !== null) return `W${w}`
  return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

/**
 * Newest first, by when it was actually submitted.
 *
 * Ordering by the stored ISO week silently picked a November check-in over a
 * January one for any cohort running across a new year — reverting her weight,
 * energy and wellness score to two-month-old data with no indication anything
 * was wrong.
 */
export function newestFirst<T extends { submitted_at?: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ta = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
    const tb = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
    return tb - ta
  })
}

/** Oldest first — for charts, which read left to right. */
export function oldestFirst<T extends { submitted_at?: string | null }>(rows: T[]): T[] {
  return newestFirst(rows).reverse()
}
