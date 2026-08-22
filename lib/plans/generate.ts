import type { Food } from "@/app/actions/library"

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

/**
 * Share of daily calories per slot, and how each slot is composed.
 *
 * `composite` slots get a carb base plus a protein main, because that's what an
 * Indian lunch or dinner actually is — roti/rice with a dal or sabzi. Picking a
 * single item per slot produced macro-correct nonsense like "2x Grilled Paneer"
 * for lunch with no carb and no vegetable, which no coach would prescribe.
 */
const SLOTS: { name: string; tag: string; share: number; composite: boolean }[] = [
  { name: "Breakfast", tag: "breakfast", share: 0.25, composite: false },
  { name: "Lunch", tag: "lunch", share: 0.35, composite: true },
  { name: "Snack", tag: "snack", share: 0.1, composite: false },
  { name: "Dinner", tag: "dinner", share: 0.3, composite: true },
]

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

  for (const slot of SLOTS) {
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
        const basePick = choose(bases, budget * 0.42, 0, variety)
        take(basePick, slot.name)
        const mainPool = mains.filter((f) => !used.has(f.id))
        take(choose(mainPool, budget * 0.58, hunger, variety), slot.name)
        continue
      }
      warnings.push(
        `${slot.name}: library lacks a ${bases.length ? "protein main" : "carb base"} for this slot — used a single item instead.`
      )
    }

    take(choose(candidates, budget, hunger, variety), slot.name)
  }

  // One corrective pass: if protein is still short, add the most protein-dense
  // snack that doesn't blow the calorie budget.
  if (proteinSoFar < targetProtein * 0.9) {
    const headroom = targetCalories * 1.05 - kcalSoFar
    const topUp = usable
      .filter((f) => !used.has(f.id) && (f.protein ?? 0) > 0 && (f.calories ?? 0) <= headroom)
      .sort((a, b) => (b.protein ?? 0) / (b.calories || 1) - (a.protein ?? 0) / (a.calories || 1))[0]
    if (topUp) {
      used.add(topUp.id)
      items.push({ food: topUp, qty: 1, meal: "Snack" })
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
