/**
 * Find the flat stretch in a weight series, so the chart can name it.
 *
 * A plateau is the most predictable thing that happens on a thyroid programme
 * and the most likely to be read as personal failure. Left unlabelled she
 * discovers it alone, at eleven at night, and concludes she has stalled it
 * herself. Labelled on the chart, in advance, it is just the shape week five
 * to eight tends to have.
 *
 * Pure and dependency-free so the thresholds can be tested rather than eyeballed.
 */

export interface PlateauSpan {
  /** Index of the first point in the flat run. */
  startIndex: number
  /** Index of the last point in the flat run. */
  endIndex: number
  /** How many points the run covers. */
  weeks: number
  /** Net change across the run, kg. */
  netChange: number
}

/** Below this, a week's movement is noise — water, salt, the time of day. */
const FLAT_KG = 0.4
/** Fewer than this is not a plateau, it is a normal fortnight. */
const MIN_WEEKS = 3

/**
 * The longest run of consecutive points that stayed flat.
 *
 * "Flat" is measured against the run's own starting value rather than
 * point-to-point, so a slow drift that adds up to real loss is not mislabelled
 * as a plateau just because no single week moved much.
 */
export function findPlateau(values: (number | null | undefined)[]): PlateauSpan | null {
  const pts: { i: number; v: number }[] = []
  values.forEach((v, i) => {
    if (typeof v === "number" && Number.isFinite(v)) pts.push({ i, v })
  })
  if (pts.length < MIN_WEEKS) return null

  let best: PlateauSpan | null = null

  for (let start = 0; start < pts.length; start++) {
    let end = start
    while (
      end + 1 < pts.length &&
      Math.abs(pts[end + 1].v - pts[start].v) <= FLAT_KG
    ) {
      end++
    }
    const weeks = end - start + 1
    if (weeks >= MIN_WEEKS && (!best || weeks > best.weeks)) {
      best = {
        startIndex: pts[start].i,
        endIndex: pts[end].i,
        weeks,
        netChange: +(pts[end].v - pts[start].v).toFixed(1),
      }
    }
    if (end > start) start = end - 1 // overlapping runs cannot beat the longer one
  }

  // A flat run that covers the whole series is not a plateau — it is simply a
  // client who has not moved yet, and calling that a plateau would be flattery.
  if (best && best.weeks === pts.length) return null
  return best
}

/**
 * The sentence that goes under the chart. Written in the coach's voice and
 * deliberately explanatory rather than reassuring — "this is the ordinary
 * shape" is a fact she can check, "don't worry" is not.
 */
export function plateauNote(span: PlateauSpan, droppedBefore: boolean): string {
  const n = span.weeks
  const word = n === 3 ? "Three" : n === 4 ? "Four" : n === 5 ? "Five" : `${n}`
  const lead = droppedBefore
    ? `${word} flat weeks after a steady drop.`
    : `${word} flat weeks.`
  return `${lead} With hypothyroidism this is the ordinary shape of week 5–8, not a stall you caused.`
}

/** True when the series was genuinely falling before the flat stretch began. */
export function droppedBefore(values: (number | null | undefined)[], span: PlateauSpan): boolean {
  const before = values
    .slice(0, span.startIndex + 1)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
  if (before.length < 2) return false
  return before[0] - before[before.length - 1] > FLAT_KG
}
