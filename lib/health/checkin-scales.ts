/**
 * The label↔score maps for the weekly check-in, in one place.
 *
 * The check-in stores these as numbers so they chart, but the client picks a
 * word. Both directions are needed now that a check-in can be reopened and
 * corrected, and keeping them in separate files is how they drift: change a
 * score on the way in, forget the way out, and the form silently reopens
 * showing the wrong answer.
 */

export const DIGESTION = { Great: 9, Okay: 6, Sluggish: 3, Off: 1 } as const
export const BLOATING = { None: 1, Mild: 4, Moderate: 7, Severe: 10 } as const
export const CRAVINGS = { Low: 2, Manageable: 5, Intense: 9 } as const
export const ADHERENCE = { 'Spot-on': 100, Mostly: 75, Partly: 50, 'Off-track': 25 } as const

export type Scale = Record<string, number>

/** Label → stored score. Falls back to the scale's own midpoint, not a magic number. */
export function toScore(scale: Scale, label: string | null | undefined, fallback: number): number {
  if (label && label in scale) return scale[label]
  return fallback
}

/**
 * Stored score → label. Picks the nearest label rather than requiring an exact
 * hit, so a row written before a scale changed still reopens as something
 * sensible instead of falling back to a default the client never chose.
 */
export function toLabel(scale: Scale, score: number | null | undefined, fallback: string): string {
  if (typeof score !== 'number' || !Number.isFinite(score)) return fallback
  let best = fallback
  let bestDist = Infinity
  for (const [label, value] of Object.entries(scale)) {
    const d = Math.abs(value - score)
    if (d < bestDist) {
      bestDist = d
      best = label
    }
  }
  return best
}
