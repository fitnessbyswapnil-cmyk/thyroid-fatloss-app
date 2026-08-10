/**
 * Thyroid symptom cluster — the symptoms that typically shift BEFORE the scale
 * does on a thyroid protocol. Tracking severity (not just presence) is what
 * makes "4 of 6 symptoms improved" possible, which is the single most
 * motivating screen for a client whose weight has plateaued.
 */

export const SYMPTOMS = [
  { key: "Cold sensitivity", short: "Cold" },
  { key: "Hair thinning", short: "Hair" },
  { key: "Brain fog", short: "Focus" },
  { key: "Palpitations", short: "Heart" },
  { key: "Joint aches", short: "Joints" },
  { key: "Dry skin", short: "Skin" },
] as const

/** 0 = none … 3 = severe. Lower is better. */
export const SEVERITY_LABELS = ["None", "Mild", "Moderate", "Severe"] as const
export const MAX_SEVERITY = 3

export type SymptomScores = Record<string, number>

/**
 * Read the `symptoms` JSONB column, which has two historical shapes:
 *   - legacy: string[]  (symptom present, no severity) → scored as Moderate
 *   - current: { [symptom]: 0..3 }
 * Anything unrecognized reads as "no data" rather than guessing.
 */
export function parseSymptoms(raw: unknown): SymptomScores | null {
  if (!raw) return null
  if (Array.isArray(raw)) {
    const out: SymptomScores = {}
    for (const s of raw) if (typeof s === "string") out[s] = 2
    return Object.keys(out).length ? out : null
  }
  if (typeof raw === "object") {
    const out: SymptomScores = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const n = Number(v)
      if (Number.isFinite(n)) out[k] = Math.max(0, Math.min(MAX_SEVERITY, n))
    }
    return Object.keys(out).length ? out : null
  }
  return null
}

/** Total symptom burden across the cluster (0 = symptom-free). */
export function symptomBurden(scores: SymptomScores | null): number | null {
  if (!scores) return null
  let total = 0
  let seen = 0
  for (const s of SYMPTOMS) {
    if (scores[s.key] !== undefined) {
      total += scores[s.key]
      seen++
    }
  }
  return seen ? total : null
}

export interface SymptomChange {
  key: string
  short: string
  first: number
  latest: number
  delta: number // negative = improved
}

/** Per-symptom change between the earliest and most recent scored check-in. */
export function symptomChanges(first: SymptomScores | null, latest: SymptomScores | null): SymptomChange[] {
  if (!first || !latest) return []
  const out: SymptomChange[] = []
  for (const s of SYMPTOMS) {
    const a = first[s.key]
    const b = latest[s.key]
    if (a === undefined || b === undefined) continue
    out.push({ key: s.key, short: s.short, first: a, latest: b, delta: b - a })
  }
  return out
}
