'use server'

import { createClient } from '@/lib/supabase/server'
import { guard, failed } from '@/lib/errors'
import { searchIngredients as ifctSearch, computeRecipe, type Ingredient, type RecipePart } from '@/lib/nutrition/ifct'
import type { Food } from '@/app/actions/library'
import { EMPTY_PREFERENCES, hardExclusions, type FoodPreferences } from '@/lib/plans/preferences'
import { generatePlan } from '@/lib/plans/generate'
import { computeTargets, type ActivityLevel } from '@/lib/plans/targets'
import { getAuthUser } from '@/lib/supabase/auth'

/** Ingredient search for the recipe composer (coach only). */
export async function lookupIngredients(query: string): Promise<Ingredient[]> {
  return guard('nutrition.lookupIngredients', [], async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (me?.role !== 'coach' && me?.role !== 'admin') return []
    return ifctSearch(query)
  })
}

/**
 * Save a food composed from measured ingredients. Macros are computed
 * server-side from the parts — never trusted from the client — so the stored
 * numbers always match the recipe shown alongside them.
 */
export async function saveComposedFood(input: {
  id?: string
  name: string
  portion: string
  parts: RecipePart[]
  recipe?: string | null
  tags?: string | null
  isVeg?: boolean
}) {
  return guard('nutrition.saveComposedFood', failed('Could not save that recipe.'), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (me?.role !== 'coach' && me?.role !== 'admin') {
      return { success: false, error: 'Only the coach can edit the library' }
    }
    if (!input.name?.trim()) return { success: false, error: 'Name is required' }

    const parts = (input.parts || [])
      .filter((p) => p?.name && Number(p.grams) > 0)
      .slice(0, 40)
      .map((p) => ({
        name: String(p.name).slice(0, 80),
        grams: Number(p.grams),
        kcal: Number(p.kcal) || 0,
        protein: Number(p.protein) || 0,
        carbs: Number(p.carbs) || 0,
        fats: Number(p.fats) || 0,
        source: p.source || 'IFCT 2017',
      }))
    if (!parts.length) return { success: false, error: 'Add at least one ingredient' }

    const totals = computeRecipe(parts)
    const row = {
      name: input.name.trim(),
      portion: input.portion?.trim() || `1 serving (${totals.totalGrams}g)`,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
      is_veg: input.isVeg ?? true,
      tags: input.tags?.trim() || null,
      recipe: input.recipe?.trim() || null,
      ingredients: parts,
      updated_at: new Date().toISOString(),
    }

    const { error } = input.id
      ? await supabase.from('foods').update(row).eq('id', input.id)
      : await supabase.from('foods').insert({ ...row, created_by: user.id })
    if (error) return { success: false, error: error.message }
    return { success: true, totals }
  })
}

/**
 * A starting calorie and protein target for this client, worked out from her
 * own record rather than typed in from the coach's head every time.
 *
 * Returns the reasoning alongside the numbers. The coach is still the one
 * deciding — this removes the arithmetic, not the judgement.
 */
export async function getClientTargets(clientId: string) {
  return guard('nutrition.getClientTargets', null, async () => {
    const supabase = await createClient()
    const user = await getAuthUser(supabase)
    if (!user) return null
    const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (me?.role !== 'coach' && me?.role !== 'admin') return null

    const { data: c } = await supabase
      .from('clients')
      .select('full_name, age, gender, current_weight, target_weight, height_cm, activity_level, thyroid_condition')
      .eq('id', clientId)
      .maybeSingle()
    if (!c?.current_weight) return null

    const targets = computeTargets({
      weightKg: Number(c.current_weight),
      targetWeightKg: c.target_weight != null ? Number(c.target_weight) : null,
      heightCm: c.height_cm != null ? Number(c.height_cm) : null,
      age: c.age,
      gender: c.gender,
      activity: (c.activity_level as ActivityLevel | null) ?? null,
    })

    return { ...targets, clientName: c.full_name as string | null }
  })
}

/** Save the two details the target calculation needs but onboarding never asked for. */
export async function saveClientMetrics(input: {
  clientId: string
  heightCm?: number | null
  activityLevel?: ActivityLevel | null
}) {
  return guard('nutrition.saveClientMetrics', failed('Could not save that.'), async () => {
    const supabase = await createClient()
    const user = await getAuthUser(supabase)
    if (!user) return { success: false, error: 'Not authenticated' }
    const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (me?.role !== 'coach' && me?.role !== 'admin') {
      return { success: false, error: 'Only the coach can edit client details' }
    }

    const patch: Record<string, unknown> = {}
    if (input.heightCm != null) {
      const h = Number(input.heightCm)
      // Matches the database constraint, so a typo fails here with a readable
      // message instead of surfacing as a Postgres error.
      if (!Number.isFinite(h) || h < 100 || h > 250) {
        return { success: false, error: 'Height should be between 100 and 250 cm' }
      }
      patch.height_cm = h
    }
    if (input.activityLevel) patch.activity_level = input.activityLevel
    if (!Object.keys(patch).length) return { success: true }

    const { error } = await supabase.from('clients').update(patch).eq('id', input.clientId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  })
}

/**
 * Draft a day's meals for a client from the coach's own library.
 *
 * Pulls her restrictions from her health profile automatically, so an allergy
 * recorded at onboarding can't be forgotten at plan time. Returns a draft the
 * coach edits and assigns — nothing reaches the client unreviewed.
 */
export async function generateMealPlan(input: {
  clientId: string
  targetCalories: number
  targetProtein: number
  /** The coach's checkbox. Overridden by her saved diet_type when she has one. */
  isVeg: boolean
  variety?: number
}) {
  return guard('nutrition.generateMealPlan', null, async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (me?.role !== 'coach' && me?.role !== 'admin') return null

    const [{ data: foods }, { data: profile }, { data: prefsRow }] = await Promise.all([
      supabase.from('foods').select('*'),
      supabase
        .from('health_profiles')
        .select('allergies, conditions')
        .eq('client_id', input.clientId)
        .maybeSingle(),
      // Her onboarding answers. This query was missing, so every field the
      // generator gained — meals a day, cuisine, staple, the diet gate — was
      // unreachable: she answered ten questions and got the same four-slot
      // roti-shaped day as everyone else.
      supabase.from('food_preferences').select('*').eq('client_id', input.clientId).maybeSingle(),
    ])
    if (!foods?.length) return null

    const prefs: FoodPreferences = { ...EMPTY_PREFERENCES, ...(prefsRow ?? {}) }

    // The chips she tapped, expanded into real keywords.
    //
    // This used to parse health_profiles.allergies as prose, and onboarding
    // writes that column as display LABELS — "Milk & dairy", "Onion & garlic",
    // "Peanuts", "Fish & seafood". The splitter broke on "," and the word "and",
    // never on "&", so those survived as single tokens that match no food name,
    // and "Peanuts" missed "Peanut Butter" on the plural alone. Four of the
    // twelve chips silently did nothing — peanut among them. The stored values
    // are the source of truth; the prose column is for the coach to read.
    const { diet, avoid: prefAvoid } = hardExclusions(prefs)

    // Kept as a belt-and-braces layer: anything she typed in the free-text note,
    // or the coach entered by hand, still excludes. Over-excluding a food costs
    // her one option; missing an allergen can put her in hospital.
    const typed = [profile?.allergies, profile?.conditions]
      .filter(Boolean)
      .join(',')
      .split(/[,;/&]+|\band\b/i)
      .map((s) => s.trim().toLowerCase())
      // Trailing "s" trimmed so a label like "Peanuts" still matches "Peanut Butter".
      .flatMap((s) => (s.endsWith('s') && s.length > 4 ? [s, s.slice(0, -1)] : [s]))
      .filter((s) => s.length >= 3 && !/^(none|nil|no|na|n\/a|nothing)$/i.test(s))

    const avoid = [...new Set([...prefAvoid, ...typed])]

    const plan = generatePlan({
      foods: foods as Food[],
      targetCalories: Math.max(600, Math.min(5000, input.targetCalories)),
      targetProtein: Math.max(20, Math.min(400, input.targetProtein)),
      isVeg: input.isVeg,
      // Her saved answer wins over the checkbox; null when she has not onboarded.
      diet: prefs.diet_type ? diet : null,
      avoid,
      mealsPerDay: prefs.meals_per_day,
      cuisines: prefs.cuisines,
      staple: prefs.staple,
      variety: input.variety ?? 0,
    })

    return {
      items: plan.items.map((i) => ({
        foodId: i.food.id,
        name: i.food.name,
        portion: i.food.portion,
        qty: i.qty,
        meal: i.meal,
        calories: i.food.calories,
        protein: i.food.protein,
        carbs: i.food.carbs,
        fats: i.food.fats,
      })),
      totals: plan.totals,
      warnings: plan.warnings,
      excluded: avoid,
    }
  })
}

export interface FoodDetail {
  name: string
  portion: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
  recipe: string | null
  ingredients: Array<{ name: string; grams: number }> | null
}

/**
 * Full detail for a food on the client's plan. Plan items embed only a macro
 * snapshot, so the recipe has to be looked up by name from the library.
 */
export async function getFoodDetail(name: string): Promise<FoodDetail | null> {
  return guard('nutrition.getFoodDetail', null, async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('foods')
      .select('name, portion, calories, protein, carbs, fats, recipe, ingredients')
      .ilike('name', name.trim())
      .limit(1)
      .maybeSingle()
    return (data as FoodDetail) ?? null
  })
}

export interface SwapOption {
  id: string
  name: string
  portion: string
  calories: number | null
  protein: number | null
  is_veg: boolean
}

/**
 * Alternatives for a meal the client can't or doesn't want to eat today.
 *
 * Constrained on purpose: same meal slot, similar calories, and never a
 * non-veg swap for a vegetarian. A swap that wanders outside the plan's
 * intent isn't a swap — it's the client silently going off-plan.
 */
export async function getSwapOptions(foodName: string, mealSlot?: string | null): Promise<SwapOption[]> {
  return guard('nutrition.getSwapOptions', [], async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: current } = await supabase
      .from('foods')
      .select('id, name, calories, is_veg, tags')
      .ilike('name', foodName.trim())
      .limit(1)
      .maybeSingle()

    const { data: all } = await supabase
      .from('foods')
      .select('id, name, portion, calories, protein, is_veg, tags')
    if (!all) return []

    const slot = (mealSlot || '').trim().toLowerCase()
    const targetKcal = current?.calories ?? null
    const currentVeg = current?.is_veg ?? true

    const scored = (all as (Food & { id: string })[])
      .filter((f) => {
        if (current && f.id === current.id) return false
        // A vegetarian must never be offered meat; a non-veg client may eat either.
        if (currentVeg && !f.is_veg) return false
        // Same meal slot, when we know it.
        if (slot) {
          const tags = (f.tags || '').toLowerCase()
          if (!tags.includes(slot)) return false
        }
        if (targetKcal != null && f.calories != null) {
          const diff = Math.abs(f.calories - targetKcal) / targetKcal
          return diff <= 0.25
        }
        return true
      })
      .sort((a, b) => {
        if (targetKcal == null) return (a.name || '').localeCompare(b.name || '')
        return Math.abs((a.calories ?? 0) - targetKcal) - Math.abs((b.calories ?? 0) - targetKcal)
      })
      .slice(0, 8)

    return scored.map((f) => ({
      id: f.id,
      name: f.name,
      portion: f.portion,
      calories: f.calories,
      protein: f.protein,
      is_veg: f.is_veg,
    }))
  })
}
