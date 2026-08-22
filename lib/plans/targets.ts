/**
 * Work out a starting calorie and protein target from what is already known
 * about a client, so the coach stops typing two numbers she has to derive in
 * her head for every plan.
 *
 * This is arithmetic, not judgement. It produces a defensible starting point
 * and shows its working; the coach edits it and remains the one deciding.
 *
 * Deliberately does NOT read lab values. Adjusting someone's food on the basis
 * of a TSH figure is a clinical decision, not a spreadsheet one, and this app's
 * standing rule is that labs get flagged for a doctor conversation rather than
 * acted on. Thyroid status enters only through the activity level the coach
 * picks, which is an observation about how the client actually lives.
 */

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active"

export const ACTIVITY: { key: ActivityLevel; label: string; factor: number; hint: string }[] = [
  { key: "sedentary", label: "Sedentary", factor: 1.2, hint: "desk job, little movement" },
  { key: "light", label: "Lightly active", factor: 1.375, hint: "2-3 sessions a week" },
  { key: "moderate", label: "Moderately active", factor: 1.55, hint: "4-5 sessions a week" },
  { key: "active", label: "Very active", factor: 1.725, hint: "daily training or on her feet all day" },
]

export interface TargetInput {
  weightKg: number
  targetWeightKg?: number | null
  heightCm?: number | null
  age?: number | null
  gender?: string | null
  activity?: ActivityLevel | null
}

export interface TargetResult {
  calories: number
  protein: number
  /** Plain-English working, shown to the coach so she can judge it. */
  reasoning: string[]
  /** Things that would make the estimate better if filled in. */
  missing: string[]
  /** True when the calorie floor overrode the arithmetic. */
  flooredAt: number | null
}

/** Clinical floors. Going under these is a supervised intervention, not a plan. */
const FLOOR_FEMALE = 1200
const FLOOR_MALE = 1500

/** Fat-loss deficit. Modest on purpose — aggressive cuts cost energy and muscle. */
const DEFICIT = 0.18

const round10 = (n: number) => Math.round(n / 10) * 10
const round5 = (n: number) => Math.round(n / 5) * 5

/**
 * Mifflin-St Jeor when height is known, otherwise a weight-only estimate.
 *
 * The fallback exists because height was never collected. It is less accurate,
 * so it is reported as an estimate rather than quietly presented as the same
 * number a full calculation would produce.
 */
function restingEnergy(i: TargetInput): { bmr: number; method: string; approximate: boolean } {
  const female = (i.gender || "").toLowerCase().startsWith("f")
  const age = i.age && i.age > 0 ? i.age : 35

  if (i.heightCm && i.heightCm > 100) {
    const bmr = 10 * i.weightKg + 6.25 * i.heightCm - 5 * age + (female ? -161 : 5)
    return { bmr, method: "Mifflin-St Jeor", approximate: false }
  }
  // Without height, fall back to kcal per kg — but calibrated against
  // Mifflin at heights this coach's clients actually are. The textbook 22
  // kcal/kg figure assumes a taller population and overshot a 78 kg woman at
  // 162 cm by about 240 kcal a day, which is the difference between losing and
  // stalling. Back-solving Mifflin at 155-162 cm gives ~18.5 for women and
  // ~22.5 for men.
  const perKg = (female ? 18.5 : 22.5) - Math.max(0, age - 30) * 0.04
  return { bmr: i.weightKg * perKg, method: "estimated from weight (height not on file)", approximate: true }
}

export function computeTargets(input: TargetInput): TargetResult {
  const reasoning: string[] = []
  const missing: string[] = []

  const weight = Math.max(30, Math.min(250, input.weightKg))
  const female = (input.gender || "").toLowerCase().startsWith("f")
  const activity = ACTIVITY.find((a) => a.key === input.activity) ?? ACTIVITY[1]

  const { bmr, method, approximate } = restingEnergy({ ...input, weightKg: weight })
  if (approximate) missing.push("height")
  if (!input.age) missing.push("age")
  if (!input.activity) missing.push("activity level")

  const tdee = bmr * activity.factor
  reasoning.push(
    `Resting burn ~${round10(bmr)} kcal (${method})`,
    `× ${activity.factor} for ${activity.label.toLowerCase()} → ~${round10(tdee)} kcal to hold steady`
  )

  // Only apply a deficit when she is actually aiming to lose.
  const target = input.targetWeightKg ?? null
  const losing = target != null && target < weight - 0.5
  let calories = losing ? tdee * (1 - DEFICIT) : tdee
  if (losing) {
    reasoning.push(`−${Math.round(DEFICIT * 100)}% to lose toward ${target} kg → ${round10(calories)} kcal`)
  } else {
    reasoning.push(target == null ? "No goal weight set, so holding at maintenance" : "At or below goal weight — holding at maintenance")
    if (target == null) missing.push("goal weight")
  }

  const floor = female ? FLOOR_FEMALE : FLOOR_MALE
  let flooredAt: number | null = null
  if (calories < floor) {
    flooredAt = floor
    reasoning.push(`Raised to the ${floor} kcal floor — below this is a supervised plan, not a diet`)
    calories = floor
  }

  /**
   * Protein against GOAL weight, not current. Scaling to current weight on a
   * heavier client inflates the number without adding benefit, and the point of
   * protein here is protecting muscle through a deficit — which tracks the body
   * she is heading toward.
   */
  const proteinBase = losing && target ? Math.max(target, weight * 0.75) : weight
  let protein = proteinBase * 1.8
  reasoning.push(`Protein 1.8 g per kg of ${losing && target ? "goal" : "body"} weight → ${round5(protein)} g`)

  // Protein should not dominate the plate; cap it at 35% of the day's energy.
  const proteinCeiling = (calories * 0.35) / 4
  if (protein > proteinCeiling) {
    protein = proteinCeiling
    reasoning.push(`Trimmed to 35% of calories so there is room for carbs and fats`)
  }

  return {
    calories: round10(calories),
    protein: round5(protein),
    reasoning,
    missing,
    flooredAt,
  }
}
