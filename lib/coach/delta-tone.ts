/**
 * How a week-over-week change should be coloured on a coach screen.
 *
 * Two rules, both of which the review screens were breaking.
 *
 * Red is for the app failing — an upload error, being offline. It is never for
 * her body. A coach screen is not exempt: the same value gets read aloud to her
 * on a call, and a red number is a verdict.
 *
 * And zero is not bad. The comparison was `delta > 0 ? good : bad`, so a delta
 * of exactly zero rendered red — and the queue sets every delta to zero when
 * there is no previous check-in to compare against. A client's very first
 * check-in therefore always showed her energy and sleep in red, on the one
 * screen the coach reads before writing to her.
 */

export type DeltaTone = { color: string; text: string }

const IMPROVED = "#34d399"
const WORSE = "#f59e0b" // amber, never red
const NEUTRAL = "#7e8a9e"

/**
 * @param delta      the change, or null/undefined when there is nothing to compare
 * @param goodWhen   "up" for energy and sleep, "down" for weight and stress
 */
export function deltaTone(
  delta: number | null | undefined,
  goodWhen: "up" | "down"
): DeltaTone {
  if (delta === null || delta === undefined || !Number.isFinite(delta) || delta === 0) {
    return { color: NEUTRAL, text: "—" }
  }
  const improved = goodWhen === "up" ? delta > 0 : delta < 0
  const sign = delta > 0 ? "+" : ""
  return {
    color: improved ? IMPROVED : WORSE,
    text: `${sign}${Number(delta.toFixed(1))}`,
  }
}

/** A standalone reading (stress, energy) against a threshold. Amber, not red. */
export function levelTone(value: number | null | undefined, worseAbove: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return NEUTRAL
  return value > worseAbove ? WORSE : IMPROVED
}
