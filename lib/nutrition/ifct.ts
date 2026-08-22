import 'server-only'

/**
 * Ingredient lookup backed by IFCT 2017 (Indian Food Composition Tables,
 * ICMR-NIN Hyderabad) — 528 Indian foods with directly measured composition.
 *
 * IFCT is a RAW INGREDIENT table per 100g, not a table of prepared dishes:
 * it has "Wheat, semolina" but no "upma". That's why it can't be dumped
 * straight into the food library — but it's exactly the right source for
 * *composing* a dish from its ingredients and getting real macros out.
 *
 * Data use is encouraged with acknowledgement of the source.
 */

const KJ_PER_KCAL = 4.184

export interface Ingredient {
  code: string
  name: string
  /** Per 100g, converted to the units the app uses. */
  kcal: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  /**
   * Where the energy figure came from. IFCT reports enerc = 0 for every pure
   * fat (oils, ghee: fatce 100, enerc 0), so those fall back to Atwater —
   * worth surfacing rather than hiding.
   */
  energyBasis: 'measured' | 'derived'
}

interface IfctRow {
  code?: string
  name?: string
  enerc?: number      // kilojoules per 100g — NOT kcal
  protcnt?: number    // g
  choavldf?: number   // g available carbohydrate
  fatce?: number      // g
  fibtg?: number      // g total dietary fibre
}

// The dataset load is async and non-trivial; keep one promise per process.
let loaded: Promise<(q: string) => IfctRow[]> | null = null

async function getSearch() {
  if (!loaded) {
    loaded = (async () => {
      const mod = await import('@ifct2017/compositions')
      const compositions = (mod.default ?? mod) as unknown as {
        (q: string): IfctRow[]
        load: () => Promise<unknown>
      }
      await compositions.load()
      return (q: string) => compositions(q) || []
    })()
  }
  return loaded
}

const round = (n: number, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp

function toIngredient(r: IfctRow): Ingredient | null {
  if (!r?.name) return null

  const protein = round(r.protcnt ?? 0)
  const carbs = round(r.choavldf ?? 0)
  const fats = round(r.fatce ?? 0)

  // enerc is KILOJOULES. Treating it as kcal would overstate every dish ~4.2x.
  const measured = typeof r.enerc === 'number' && r.enerc > 0 ? r.enerc / KJ_PER_KCAL : NaN

  // IFCT reports enerc = 0 for every pure fat — coconut/mustard/sunflower oil
  // and ghee all come back as fatce 100 with zero energy. Trusting that would
  // silently drop ~90 kcal per tablespoon of oil from every recipe, which for
  // an Indian diet plan is a large and consistently wrong error. Fall back to
  // the Atwater factors (4/4/9) whenever energy is missing or zero.
  const atwater = 4 * protein + 4 * carbs + 9 * fats
  const useMeasured = Number.isFinite(measured)
  const kcal = useMeasured ? measured : atwater

  // Nothing usable at all — skip rather than emit a zero-calorie ingredient.
  if (!Number.isFinite(kcal) || (kcal === 0 && protein === 0 && carbs === 0 && fats === 0)) return null

  return {
    code: r.code ?? '',
    name: r.name,
    kcal: round(kcal),
    protein,
    carbs,
    fats,
    fiber: round(r.fibtg ?? 0),
    energyBasis: useMeasured ? 'measured' : 'derived',
  }
}

/** Search IFCT by name. Returns per-100g values. */
export async function searchIngredients(query: string, limit = 12): Promise<Ingredient[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const search = await getSearch()
  const rows = search(q)
  const out: Ingredient[] = []
  for (const r of rows) {
    const ing = toIngredient(r)
    if (ing) out.push(ing)
    if (out.length >= limit) break
  }
  return out
}

export interface RecipePart {
  name: string
  grams: number
  /** Per-100g values captured at the time of composing. */
  kcal: number
  protein: number
  carbs: number
  fats: number
  source?: string
}

export interface ComputedMacros {
  calories: number
  protein: number
  carbs: number
  fats: number
  totalGrams: number
}

/**
 * Sum a recipe's parts into dish totals.
 *
 * Note this is raw-ingredient arithmetic: it does not model water lost in
 * cooking, so a slow-cooked dish will weigh less than totalGrams suggests.
 * The macro totals stay correct — only the served weight shifts.
 */
export function computeRecipe(parts: RecipePart[]): ComputedMacros {
  let calories = 0, protein = 0, carbs = 0, fats = 0, totalGrams = 0
  for (const p of parts) {
    const g = Number(p.grams)
    if (!Number.isFinite(g) || g <= 0) continue
    const factor = g / 100
    calories += (p.kcal || 0) * factor
    protein += (p.protein || 0) * factor
    carbs += (p.carbs || 0) * factor
    fats += (p.fats || 0) * factor
    totalGrams += g
  }
  return {
    calories: Math.round(calories),
    protein: round(protein),
    carbs: round(carbs),
    fats: round(fats),
    totalGrams: Math.round(totalGrams),
  }
}
