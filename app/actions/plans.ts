'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PlanType = 'meal' | 'workout'

export interface PlanSection {
  heading: string
  body: string
}

/** A workout-plan line item, embedded from the exercise library at save time. */
export interface WorkoutItem {
  exerciseId?: string
  name: string
  sets?: number | null
  reps?: string | null      // "12", "8-10", "45 sec" — freeform
  day?: string | null       // "Mon", "Day 1" — freeform grouping
  videoUrl?: string | null
  demoUrl?: string | null     // animated GIF/MP4 demo (embedded from library at save time)
  imageStart?: string | null  // demo frame 1 — fallback when no demoUrl
  imageEnd?: string | null    // demo frame 2
  notes?: string | null
}

/** A meal-plan line item, embedded from the food library at save time. */
export interface MealItem {
  foodId?: string
  name: string
  portion: string
  qty?: number | null       // portion multiplier
  meal?: string | null      // "Breakfast", "Lunch" — freeform grouping
  calories?: number | null
  protein?: number | null
  carbs?: number | null
  fats?: number | null
}

export interface PlanContent {
  sections: PlanSection[]
  workoutItems?: WorkoutItem[]
  mealItems?: MealItem[]
}

export interface Plan {
  id: string
  client_id: string
  coach_id: string
  type: PlanType
  title: string
  content: PlanContent
  file_path: string | null
  assigned_at: string
  updated_at: string
}

interface SavePlanInput {
  clientId: string
  type: PlanType
  title: string
  sections: PlanSection[]
  workoutItems?: WorkoutItem[]
  mealItems?: MealItem[]
  filePath?: string | null
}

/**
 * Coach upserts a client's meal or workout plan. A client has one plan of each
 * type; if one already exists we update it, otherwise we insert. RLS enforces
 * that only a coach (coach_id = auth.uid() AND is_coach()) can write.
 */
export async function savePlan(input: SavePlanInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    // Keep only sections with any content
    const sections = input.sections
      .map((s) => ({ heading: s.heading.trim(), body: s.body.trim() }))
      .filter((s) => s.heading || s.body)

    // Library-built line items (optional, additive to the sections model)
    const workoutItems = (input.workoutItems || []).filter((i) => i.name?.trim())
    const mealItems = (input.mealItems || []).filter((i) => i.name?.trim())

    const content: PlanContent = {
      sections,
      ...(workoutItems.length ? { workoutItems } : {}),
      ...(mealItems.length ? { mealItems } : {}),
    }

    const { data: existing } = await supabase
      .from('plans')
      .select('id')
      .eq('client_id', input.clientId)
      .eq('type', input.type)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('plans')
        .update({
          title: input.title.trim() || (input.type === 'meal' ? 'Meal Plan' : 'Workout Plan'),
          content,
          file_path: input.filePath ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await supabase.from('plans').insert({
        client_id: input.clientId,
        coach_id: user.id,
        type: input.type,
        title: input.title.trim() || (input.type === 'meal' ? 'Meal Plan' : 'Workout Plan'),
        content,
        file_path: input.filePath ?? null,
      })
      if (error) return { success: false, error: error.message }
    }

    revalidatePath(`/coach/client/${input.clientId}`)
    revalidatePath('/dashboard/plans')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save plan' }
  }
}

/**
 * Fetch a client's plans (one meal, one workout). Works for both the client
 * (own plans via RLS) and the coach (via coach RLS policy).
 */
export async function getPlansForClient(clientId: string): Promise<{ meal: Plan | null; workout: Plan | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plans')
    .select('*')
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false })

  const plans = (data || []) as Plan[]
  return {
    meal: plans.find((p) => p.type === 'meal') || null,
    workout: plans.find((p) => p.type === 'workout') || null,
  }
}
