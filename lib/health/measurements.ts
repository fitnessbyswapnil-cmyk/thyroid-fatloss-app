/**
 * Body measurement sites tracked at check-in.
 *
 * Deliberately 7 sites with no left/right split: someone measuring herself at
 * home each week will abandon a 12-field form, and consistency beats precision
 * for tracking a trend. All values in centimetres.
 */

export const SITES = [
  { key: "waist", label: "Waist", hint: "narrowest point, above the navel" },
  { key: "hips",  label: "Hips",  hint: "widest point around the seat" },
  { key: "chest", label: "Chest", hint: "across the fullest part" },
  { key: "thigh", label: "Thigh", hint: "widest part of one thigh" },
  { key: "arm",   label: "Arm",   hint: "mid-bicep, relaxed" },
  { key: "neck",  label: "Neck",  hint: "just below the Adam's apple" },
  { key: "calf",  label: "Calf",  hint: "widest part of one calf" },
] as const

export type SiteKey = (typeof SITES)[number]["key"]
export type Measurements = Partial<Record<SiteKey, number | null>>

/** Sites the client has actually recorded at least once. */
export function recordedSites(rows: Measurements[]): SiteKey[] {
  return SITES.map((s) => s.key).filter((k) => rows.some((r) => typeof r[k] === "number"))
}

export interface SiteChange {
  key: SiteKey
  label: string
  first: number
  latest: number
  delta: number // negative = lost cm
}

/** Change per site between the earliest and latest check-in that recorded it. */
export function siteChanges(rows: Measurements[]): SiteChange[] {
  const out: SiteChange[] = []
  for (const s of SITES) {
    const vals = rows.map((r) => r[s.key]).filter((v): v is number => typeof v === "number")
    if (vals.length < 2) continue
    const first = vals[0]
    const latest = vals[vals.length - 1]
    out.push({ key: s.key, label: s.label, first, latest, delta: +(latest - first).toFixed(1) })
  }
  return out
}

/**
 * Total centimetres lost across every tracked site — the headline number when
 * body weight refuses to move. Only counts sites that went DOWN, because
 * summing gains and losses together produces a meaningless net figure.
 */
export function totalCmLost(rows: Measurements[]): number {
  return +siteChanges(rows)
    .filter((c) => c.delta < 0)
    .reduce((sum, c) => sum + Math.abs(c.delta), 0)
    .toFixed(1)
}
