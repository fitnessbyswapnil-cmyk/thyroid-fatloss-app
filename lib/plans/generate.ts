import type { Food } from "@/app/actions/library"
import { PREF_QUESTIONS } from "@/lib/plans/preferences"

/**
 * Deterministic meal-plan generator.
 *
 * This is arithmetic, not prediction: filtering a library and solving for a
 * calorie/protein target. An algorithm beats an LLM at exactly this — it hits
 * the numbers precisely, costs nothing, runs instantly, and can never invent a
 * food that isn't in the coach's library.
 *
 * The coach still reviews and edits every plan; this removes the tedious part,
 * not the judgement.
 *
 * Her food preferences (meals a day, cuisine, staple) steer this for free, with
 * no API key and no per-plan cost. Every one of those inputs is optional and
 * omitting all of them reproduces the original four-meal behaviour exactly —
 * callers that predate the preferences table keep working untouched.
 */

export interface GenerateInput {
  foods: Food[]
  targetCalories: number
  targetProtein: number
  /** A vegetarian is never offered meat. Non-veg clients may eat either. */
  isVeg: boolean
  /** Allergy / dislike keywords — any food whose name or tags match is excluded. */
  avoid?: string[]
  /** Rotation index. Same inputs + same variety = same plan; bump it for an alternative. */
  variety?: number
  /**
   * `food_preferences.meals_per_day`, 3–6. Anything outside that is clamped,
   * so the "6 or more" answer and a stray 9 both land on the six-meal shape.
   * Omitted means the four-meal shape, which is what every caller got before.
   */
  mealsPerDay?: number | null
  /**
   * `food_preferences.cuisines` — the same `value` strings as the tags on
   * `foods` (north-indian, south-indian, …). A soft bias, never a filter.
   */
  cuisines?: string[] | null
  /** `food_preferences.staple` — roti | rice | both | millets. Also soft. */
  staple?: string | null
}

export interface GeneratedItem {
  food: Food
  qty: number
  meal: string
}

export interface GeneratedPlan {
  items: GeneratedItem[]
  totals: { calories: number; protein: number; carbs: number; fats: number }
  warnings: string[]
}

interface Slot {
  name: string
  tag: string
  share: number
  composite: boolean
}

/**
 * Share of daily calories per slot, and how each slot is composed, for each
 * answer to "how many times a day do you eat?".
 *
 * `composite` slots get a carb base plus a protein main, because that's what an
 * Indian lunch or dinner actually is — roti/rice with a dal or sabzi. Picking a
 * single item per slot produced macro-correct nonsense like "2x Grilled Paneer"
 * for lunch with no carb and no vegetable, which no coach would prescribe.
 * Lunch and dinner stay composite at every meal count.
 *
 * The extra slots are tagged `snack` because that is the only snack tag the
 * library carries — the distinction between mid-morning and evening is about
 * when she eats, not about a different set of foods.
 *
 * The 4-slot shape is the original table, unchanged and in its original order,
 * so a caller that says nothing about meals per day gets exactly what it got
 * before. Do not "tidy" these numbers: they are the ones the assert below
 * checks, and the ranking inside a slot is sensitive to its budget.
 */
const MEAL_SHAPES: Record<number, Slot[]> = {
  // No snack at all, so its 10% goes back to the three real meals.
  3: [
    { name: "Breakfast", tag: "breakfast", share: 0.28, composite: false },
    { name: "Lunch", tag: "lunch", share: 0.38, composite: true },
    { name: "Dinner", tag: "dinner", share: 0.34, composite: true },
  ],
  4: [
    { name: "Breakfast", tag: "breakfast", share: 0.25, composite: false },
    { name: "Lunch", tag: "lunch", share: 0.35, composite: true },
    { name: "Snack", tag: "snack", share: 0.1, composite: false },
    { name: "Dinner", tag: "dinner", share: 0.3, composite: true },
  ],
  5: [
    { name: "Breakfast", tag: "breakfast", share: 0.24, composite: false },
    { name: "Mid-morning", tag: "snack", share: 0.08, composite: false },
    { name: "Lunch", tag: "lunch", share: 0.32, composite: true },
    { name: "Snack", tag: "snack", share: 0.09, composite: false },
    { name: "Dinner", tag: "dinner", share: 0.27, composite: true },
  ],
  6: [
    { name: "Breakfast", tag: "breakfast", share: 0.22, composite: false },
    { name: "Mid-morning", tag: "snack", share: 0.08, composite: false },
    { name: "Lunch", tag: "lunch", share: 0.3, composite: true },
    { name: "Snack", tag: "snack", share: 0.08, composite: false },
    { name: "Evening snack", tag: "snack", share: 0.07, composite: false },
    { name: "Dinner", tag: "dinner", share: 0.25, composite: true },
  ],
}

/** What a caller that says nothing about meals per day gets. */
const DEFAULT_MEALS_PER_DAY = 4

/**
 * Shares that don't sum to 1 quietly under- or over-feed her by the difference,
 * and nothing downstream would notice. Checked at module load rather than per
 * call: the tables are literals, so a bad edit fails immediately and for
 * everyone instead of only for clients who happen to eat five times a day.
 */
for (const [count, slots] of Object.entries(MEAL_SHAPES)) {
  const sum = slots.reduce((t, s) => t + s.share, 0)
  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error(`MEAL_SHAPES[${count}] shares sum to ${sum}, not 1`)
  }
}

/** Meal counts we have a shape for, derived — never a hardcoded 3 and 6. */
const MEAL_COUNTS = Object.keys(MEAL_SHAPES)
  .map(Number)
  .sort((a, b) => a - b)

function slotsFor(mealsPerDay: number | null | undefined): Slot[] {
  if (mealsPerDay == null || !Number.isFinite(mealsPerDay)) {
    return MEAL_SHAPES[DEFAULT_MEALS_PER_DAY]
  }
  const lo = MEAL_COUNTS[0]
  const hi = MEAL_COUNTS[MEAL_COUNTS.length - 1]
  const clamped = Math.min(hi, Math.max(lo, Math.round(mealsPerDay)))
  return MEAL_SHAPES[clamped] ?? MEAL_SHAPES[DEFAULT_MEALS_PER_DAY]
}

/**
 * The regional tags she can pick between, read off the question itself so this
 * file never carries a second copy of that list. If the question is ever
 * renamed away, every food reads as regionally neutral and the cuisine bias
 * simply stops applying — which is the safe direction to fail in.
 */
const CUISINE_TAGS: string[] = (
  PREF_QUESTIONS.find((q) => q.key === "cuisines")?.options ?? []
).map((o) => o.value)

/** `foods.tags` is comma-separated text and the values carry leading spaces. */
function tagsOf(food: Food): string[] {
  return (food.tags ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * How a food sits against her cuisine answer.
 *
 *   hers    — tagged with a region she picked
 *   neutral — carries no regional tag at all: eggs, milk, plain dal, most snacks
 *   foreign — tagged only with regions she did not pick
 *
 * Three tiers rather than two because both simpler versions are wrong. Treating
 * neutral food as foreign would push boiled eggs and curd off a South Indian
 * client's plan, which nobody asked for. Treating it as hers makes the whole
 * preference inert: half the library is regionally untagged and the neutral
 * foods happen to be the best macro fits, so every cuisine produced the same
 * plan. So: her food first, neutral food to fill the gaps, and food from a
 * region she didn't pick only when the slot would otherwise be empty.
 *
 * Returns null when there is nothing to bias by — she skipped the question, or
 * picked all four — and the pools are then left exactly as they were.
 */
type CuisineFit = { hers: (f: Food) => boolean; notForeign: (f: Food) => boolean }

function cuisineFit(cuisines: string[] | null | undefined): CuisineFit | null {
  const wanted = (cuisines ?? []).map((c) => c.trim().toLowerCase()).filter(Boolean)
  if (!wanted.length || !CUISINE_TAGS.length) return null
  if (CUISINE_TAGS.every((t) => wanted.includes(t))) return null

  const regionsOf = (f: Food) => {
    const tags = tagsOf(f)
    return CUISINE_TAGS.filter((t) => tags.includes(t))
  }
  return {
    hers: (f) => regionsOf(f).some((t) => wanted.includes(t)),
    notForeign: (f) => {
      const regions = regionsOf(f)
      return !regions.length || regions.some((t) => wanted.includes(t))
    },
  }
}

/**
 * Which carb bases each staple answer points at, matched against the food's
 * name. Tags can't answer this — the library has no "roti" tag — and the names
 * in `foods` are the ordinary Indian ones.
 */
const STAPLE_KEYWORDS: Record<string, string[]> = {
  roti: ["roti", "chapati", "chapatti", "phulka", "paratha", "thepla", "naan", "atta", "wheat"],
  rice: ["rice", "pulao", "pulav", "biryani", "khichdi", "poha"],
  millets: ["bajra", "jowar", "ragi", "nachni", "millet", "bhakri"],
}
// "Both" is the union rather than a third hand-typed list, so adding a word to
// roti or rice can never leave this one behind.
STAPLE_KEYWORDS.both = [...STAPLE_KEYWORDS.roti, ...STAPLE_KEYWORDS.rice]

function staplePicker(staple: string | null | undefined): ((f: Food) => boolean) | null {
  const words = STAPLE_KEYWORDS[(staple ?? "").trim().toLowerCase()]
  if (!words?.length) return null
  return (f) => {
    const name = f.name.toLowerCase()
    return words.some((w) => name.includes(w))
  }
}

/**
 * Narrow a pool to the preferred subset — unless that would empty it.
 *
 * This is the whole of "soft bias, not filter": a preference may reorder what
 * she is offered, but it may never be the reason a slot comes up empty or a
 * plate arrives with no base on it.
 */
function prefer<T>(pool: T[], keep: (item: T) => boolean): T[] {
  const narrowed = pool.filter(keep)
  return narrowed.length ? narrowed : pool
}

/** Energy share coming from each macro — used to classify a food's role. */
function macroProfile(f: Food) {
  const kcal = f.calories || 1
  return {
    carb: ((f.carbs ?? 0) * 4) / kcal,
    protein: ((f.protein ?? 0) * 4) / kcal,
  }
}

/**
 * Carb-dominant staple: rice, roti, bhakri — the base of a plate.
 *
 * The 0.65 threshold is deliberate. At 0.5, dals qualified (toor dal sits at
 * 0.56) and the generator paired dal with dal, leaving a plate with no staple.
 * True staples sit well above: brown rice 0.84, bajra bhakri 0.71.
 */
function isBase(f: Food): boolean {
  const m = macroProfile(f)
  return m.carb >= 0.65 && m.protein < 0.25
}

/** Protein-forward: dal, paneer, chicken, eggs — the main of a plate. */
function isProteinMain(f: Food): boolean {
  return macroProfile(f).protein >= 0.2
}

/** Portion multipliers a coach would realistically prescribe. */
const QTYS = [0.5, 1, 1.5, 2]

const round1 = (n: number) => Math.round(n * 10) / 10

function isExcluded(food: Food, avoid: string[]): boolean {
  if (!avoid.length) return false
  const hay = `${food.name} ${food.tags ?? ""}`.toLowerCase()
  return avoid.some((a) => a.length >= 3 && hay.includes(a))
}

/**
 * Score a candidate for a slot. Lower is better.
 * Calorie fit dominates; protein density breaks ties toward the higher-protein
 * option, which is the single most useful bias for thyroid fat loss.
 */
function score(food: Food, qty: number, budget: number, proteinHunger: number): number {
  const kcal = (food.calories ?? 0) * qty
  const protein = (food.protein ?? 0) * qty
  const calorieMiss = Math.abs(kcal - budget)
  // proteinHunger rises as we fall behind target, pulling picks toward protein.
  return calorieMiss - protein * proteinHunger
}

export function generatePlan(input: GenerateInput): GeneratedPlan {
  const { targetCalories, targetProtein, isVeg } = input
  const variety = Math.max(0, Math.floor(input.variety ?? 0))
  const avoid = (input.avoid ?? []).map((a) => a.trim().toLowerCase()).filter(Boolean)
  const warnings: string[] = []

  const usable = input.foods.filter(
    (f) =>
      typeof f.calories === "number" &&
      f.calories > 0 &&
      (!isVeg || f.is_veg) &&
      !isExcluded(f, avoid)
  )

  if (usable.length === 0) {
    return {
      items: [],
      totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      warnings: ["No foods match these restrictions — add options to the library first."],
    }
  }

  const slots = slotsFor(input.mealsPerDay)
  const fit = cuisineFit(input.cuisines)
  const isStaple = staplePicker(input.staple)

  /**
   * Her regions, then neutral food, then anything. Composed out of the same
   * two-step `prefer` in both directions: the inner call drops food from
   * regions she didn't pick, the outer then keeps only her own — and either
   * step hands the wider pool straight back if narrowing would empty it.
   */
  const byCuisine = (pool: Food[]) =>
    fit ? prefer(prefer(pool, fit.notForeign), fit.hers) : pool

  const items: GeneratedItem[] = []
  const used = new Set<string>()
  let kcalSoFar = 0
  let proteinSoFar = 0

  /** Choose one food+qty for a budget, stepping `variety` through near-best fits. */
  const choose = (pool: Food[], budget: number, hunger: number, rotate: number) => {
    if (!pool.length) return null
    const ranked = pool
      .flatMap((food) => QTYS.map((qty) => ({ food, qty, s: score(food, qty, budget, hunger) })))
      .sort((a, b) => a.s - b.s || a.food.name.localeCompare(b.food.name))
    const distinct: typeof ranked = []
    const seen = new Set<string>()
    for (const r of ranked) {
      if (seen.has(r.food.id)) continue
      seen.add(r.food.id)
      distinct.push(r)
      if (distinct.length >= 6) break
    }
    return distinct[rotate % distinct.length]
  }

  const take = (pick: { food: Food; qty: number } | null, meal: string) => {
    if (!pick) return
    used.add(pick.food.id)
    items.push({ food: pick.food, qty: pick.qty, meal })
    kcalSoFar += (pick.food.calories ?? 0) * pick.qty
    proteinSoFar += (pick.food.protein ?? 0) * pick.qty
  }

  for (const slot of slots) {
    const budget = targetCalories * slot.share
    const proteinRemaining = Math.max(0, targetProtein - proteinSoFar)
    // Gentler than before: composite plates supply protein naturally, so a
    // strong bias here just produced plates of pure paneer.
    const hunger = targetProtein > 0 ? (proteinRemaining / targetProtein) * 2.5 : 0

    const candidates = usable.filter(
      (f) => !used.has(f.id) && (f.tags ?? "").toLowerCase().includes(slot.tag)
    )
    if (candidates.length === 0) {
      warnings.push(`No ${slot.name.toLowerCase()} options available — add some tagged "${slot.tag}".`)
      continue
    }

    if (slot.composite) {
      const bases = candidates.filter(isBase)
      const mains = candidates.filter(isProteinMain)

      // A plate needs both halves; if the library can't supply one, fall back to
      // a single best-fit item rather than emitting half a meal.
      if (bases.length && mains.length) {
        // Cuisine first, then staple within it: she is likelier to want a South
        // Indian plate with the wrong grain than the right grain served North
        // Indian. Each step falls back to the wider pool if it finds nothing,
        // so a plate can never end up with no base.
        const withCuisine = byCuisine(bases)
        const basePool = isStaple ? prefer(withCuisine, isStaple) : withCuisine
        const basePick = choose(basePool, budget * 0.42, 0, variety)
        take(basePick, slot.name)
        const mainPool = byCuisine(mains.filter((f) => !used.has(f.id)))
        take(choose(mainPool, budget * 0.58, hunger, variety), slot.name)
        continue
      }
      warnings.push(
        `${slot.name}: library lacks a ${bases.length ? "protein main" : "carb base"} for this slot — used a single item instead.`
      )
    }

    take(choose(byCuisine(candidates), budget, hunger, variety), slot.name)
  }

  // One corrective pass: if protein is still short, add the most protein-dense
  // snack that doesn't blow the calorie budget.
  //
  // It joins the last snack of her day, or dinner if she doesn't snack. Naming
  // it "Snack" unconditionally would have invented a fourth meal for someone
  // who told us she eats three times a day — the one thing this slot table
  // exists to respect.
  const topUpMeal =
    [...slots].reverse().find((s) => s.tag === "snack")?.name ??
    slots[slots.length - 1]?.name ??
    "Snack"
  if (proteinSoFar < targetProtein * 0.9) {
    const headroom = targetCalories * 1.05 - kcalSoFar
    const topUp = usable
      .filter((f) => !used.has(f.id) && (f.protein ?? 0) > 0 && (f.calories ?? 0) <= headroom)
      .sort((a, b) => (b.protein ?? 0) / (b.calories || 1) - (a.protein ?? 0) / (a.calories || 1))[0]
    if (topUp) {
      used.add(topUp.id)
      items.push({ food: topUp, qty: 1, meal: topUpMeal })
      kcalSoFar += topUp.calories ?? 0
      proteinSoFar += topUp.protein ?? 0
    }
  }

  const totals = items.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.food.calories ?? 0) * it.qty,
      protein: acc.protein + (it.food.protein ?? 0) * it.qty,
      carbs: acc.carbs + (it.food.carbs ?? 0) * it.qty,
      fats: acc.fats + (it.food.fats ?? 0) * it.qty,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  // Report honestly rather than pretending the target was met.
  const kcalOff = Math.abs(totals.calories - targetCalories) / targetCalories
  if (kcalOff > 0.1) {
    warnings.push(
      `Came to ${Math.round(totals.calories)} kcal against a ${targetCalories} target — adjust portions or add options.`
    )
  }
  if (totals.protein < targetProtein * 0.9) {
    warnings.push(
      `Protein reached ${Math.round(totals.protein)}g of ${targetProtein}g — the library may need more high-protein foods.`
    )
  }

  return {
    items,
    totals: {
      calories: Math.round(totals.calories),
      protein: round1(totals.protein),
      carbs: round1(totals.carbs),
      fats: round1(totals.fats),
    },
    warnings,
  }
}
