/**
 * Find when a report was actually taken.
 *
 * The upload screen used to default to today, so every client had to notice
 * the date was wrong and correct it by hand. Reports are usually a few days
 * old by the time they are uploaded, and a missed correction is worse than
 * tedious — the value lands on the wrong day and quietly bends the trend line
 * that the whole progress view is built on.
 *
 * Indian lab reports print the date under fairly predictable labels, so this
 * reads them rather than asking. Pure and dependency-free so it can be tested
 * against real report text.
 */

export type DateKind = "collected" | "reported" | "other"

export interface DetectedDate {
  /** yyyy-mm-dd */
  iso: string
  /** How the report labelled it, e.g. "Collected on". */
  label: string
  kind: DateKind
  /** True when day/month order had to be guessed. */
  ambiguous: boolean
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

/** Labels that mark the date a sample was taken — the one we actually want. */
const COLLECTED = [
  "collected on", "collected", "collection date", "sample collected",
  "sample date", "specimen collected", "drawn on", "registered on",
  "registration date", "received on",
]
/** Labels for when the lab issued the result — a usable fallback. */
const REPORTED = ["reported on", "report date", "reported", "released on", "approved on", "printed on"]

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * Build an ISO date, rejecting anything that cannot be a real report date.
 * Nothing in the future, nothing older than ~15 years — those are almost
 * always a phone number, an invoice figure, or a misread.
 */
function toIso(y: number, m: number, d: number, now: number): string | null {
  if (y < 100) y += y < 70 ? 2000 : 1900
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const t = Date.UTC(y, m - 1, d)
  const dt = new Date(t)
  // Rejects impossible days like 31 February, which Date would roll forward.
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  if (t > now + 2 * 86400_000) return null
  if (t < now - 15 * 365 * 86400_000) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

function kindOf(context: string): { kind: DateKind; label: string } {
  const c = context.toLowerCase()
  for (const l of COLLECTED) if (c.includes(l)) return { kind: "collected", label: titleCase(l) }
  for (const l of REPORTED) if (c.includes(l)) return { kind: "reported", label: titleCase(l) }
  return { kind: "other", label: "Date on report" }
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * All plausible report dates found in the text, best first.
 *
 * Ordering is collected-before-reported-before-anything-else, then most recent,
 * because a report that prints both is telling us the sample date is the real
 * one and the print date is bookkeeping.
 */
export function extractReportDates(text: string, now = Date.now()): DetectedDate[] {
  const found = new Map<string, DetectedDate>()

  const consider = (iso: string | null, context: string, ambiguous: boolean) => {
    if (!iso) return
    const { kind, label } = kindOf(context)
    const existing = found.get(iso)
    // Keep the strongest labelling we have seen for this date.
    const rank = (k: DateKind) => (k === "collected" ? 0 : k === "reported" ? 1 : 2)
    if (!existing || rank(kind) < rank(existing.kind)) {
      found.set(iso, { iso, label, kind, ambiguous: existing ? existing.ambiguous && ambiguous : ambiguous })
    }
  }

  for (const rawLine of text.split(/\n+/)) {
    const line = rawLine.replace(/\s+/g, " ").trim()
    if (!line) continue

    // 12 Aug 2026 / 12-Aug-2026 / Aug 12, 2026 — unambiguous, so try first.
    const named = /(\d{1,2})(?:st|nd|rd|th)?[\s\-/.]*(jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec)[a-z]*\.?[\s\-/.,]*(\d{2,4})/gi
    for (const m of line.matchAll(named)) {
      consider(toIso(Number(m[3]), MONTHS[m[2].toLowerCase()], Number(m[1]), now), line, false)
    }
    // Aug 12, 2026 — month first. Deliberately strict: it must not follow a
    // digit or separator, and the year must be four digits. Without both
    // guards it reads the tail of "05-Aug-2026" as "Aug 20, '26" and returns a
    // date that never appeared on the report. No lookbehind — older mobile
    // Safari does not support it, and clients upload from phones.
    const namedFirst = /(^|[^\d\-/.])(jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec)[a-z]*\.?[\s,]+(\d{1,2})(?:st|nd|rd|th)?[\s,]+(\d{4})/gi
    for (const m of line.matchAll(namedFirst)) {
      consider(toIso(Number(m[4]), MONTHS[m[2].toLowerCase()], Number(m[3]), now), line, false)
    }

    // 2026-08-12 — ISO, unambiguous.
    for (const m of line.matchAll(/(\d{4})-(\d{1,2})-(\d{1,2})/g)) {
      consider(toIso(Number(m[1]), Number(m[2]), Number(m[3]), now), line, false)
    }

    // 12/08/2026 — day first by Indian convention. Only truly ambiguous when
    // both numbers could be a month; if one exceeds 12 the order is decided.
    for (const m of line.matchAll(/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/g)) {
      const a = Number(m[1]), b = Number(m[2]), y = Number(m[3])
      if (a > 12 && b <= 12) consider(toIso(y, b, a, now), line, false)
      else if (b > 12 && a <= 12) consider(toIso(y, a, b, now), line, false)
      else consider(toIso(y, b, a, now), line, true) // dd/mm, flagged as a guess
    }
  }

  const rank = (k: DateKind) => (k === "collected" ? 0 : k === "reported" ? 1 : 2)
  return [...found.values()].sort(
    (x, y) => rank(x.kind) - rank(y.kind) || (x.iso < y.iso ? 1 : -1)
  )
}

/** The single best guess, or null when the text carries no usable date. */
export function bestReportDate(text: string, now = Date.now()): DetectedDate | null {
  return extractReportDates(text, now)[0] ?? null
}
