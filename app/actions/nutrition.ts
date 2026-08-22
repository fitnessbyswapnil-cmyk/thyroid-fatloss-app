'use server'

import { createClient } from '@/lib/supabase/server'
import { guard, failed } from '@/lib/errors'
import { searchIngredients as ifctSearch, computeRecipe, type Ingredient, type RecipePart } from '@/lib/nutrition/ifct'
import type { Food } from '@/app/actions/library'

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
