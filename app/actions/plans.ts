'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  day?: string | null       // legacy freeform label ("Mon", "Day 1") — kept so
                            // plans saved before scheduling still render
  /**
   * Real schedule slot: 1 = Monday … 7 = Sunday. null = unscheduled, shown
   * under "Any day". This is what turns a flat plan into a weekly programme
   * the client can actually follow day by day.
   */
  dayOfWeek?: number | null
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

/**
 * A superseded version of a plan, copied out of `plans` just before the change
 * that replaced it. `created_at` is the moment it stopped being the live plan.
 */
export interface PlanRevision {
  id: string
  plan_id: string | null
  client_id: string
  type: PlanType
  title: string
  content: PlanContent
  file_path: string | null
  created_by: string | null
  created_at: string
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
 * Key-order-independent JSON, for asking "did this actually change?".
 *
 * The stored content comes back from Postgres with jsonb's key order, not the
 * order the editor built the object in. A plain JSON.stringify comparison would
 * therefore call almost every save a change, and file a revision for plans
 * nobody edited — history that is mostly noise is history nobody reads.
 */
function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined) // dropped on the way into jsonb too
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`)
    .join(',')}}`
}

/**
 * Coach upserts a client's meal or workout plan. A client has one plan of each
 * type; if one already exists we update it, otherwise we insert. RLS enforces
 * that only a coach (coach_id = auth.uid() AND is_coach()) can write.
 *
 * A plan is edited in place, so every change used to erase the version the
 * client had actually been following. Each changing save now copies the
 * outgoing version into plan_revisions first (025). The live row is written
 * exactly as before — this is a record kept alongside, not a new plan model.
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

    const title = input.title.trim() || (input.type === 'meal' ? 'Meal Plan' : 'Workout Plan')
    const filePath = input.filePath ?? null

    const { data: existing } = await supabase
      .from('plans')
      .select('id, title, content, file_path')
      .eq('client_id', input.clientId)
      .eq('type', input.type)
      .maybeSingle()

    if (existing) {
      // What she has to follow, versus what the plan is merely called. Only the
      // first is a re-assignment; fixing a typo in the title does not restart
      // her plan.
      const substanceChanged =
        stableJson(existing.content) !== stableJson(content) ||
        (existing.file_path ?? null) !== filePath
      const changed = substanceChanged || existing.title !== title

      // A no-op save writes nothing: no revision, and no updated_at bump that
      // would make an untouched plan look freshly revised in every listing.
      if (changed) {
        // History first. If this fails the save stops — a plan save that
        // silently drops the outgoing version is the exact failure the table
        // exists to prevent, and the coach can retry. In practice the only way
        // this fails is a database that would fail the update below anyway.
        const { error: revError } = await supabase.from('plan_revisions').insert({
          plan_id: existing.id,
          client_id: input.clientId,
          type: input.type,
          title: existing.title,
          content: existing.content,
          file_path: existing.file_path,
          created_by: user.id,
        })
        if (revError) return { success: false, error: revError.message }

        const now = new Date().toISOString()
        const { error } = await supabase
          .from('plans')
          .update({
            title,
            content,
            file_path: filePath,
            updated_at: now,
            ...(substanceChanged ? { assigned_at: now } : {}),
          })
          .eq('id', existing.id)
        if (error) return { success: false, error: error.message }
      }
    } else {
      // No revision on the first save: there is no previous version to keep.
      // assigned_at defaults to now() in the database.
      const { error } = await supabase.from('plans').insert({
        client_id: input.clientId,
        coach_id: user.id,
        type: input.type,
        title,
        content,
        file_path: filePath,
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
 * The superseded versions of one plan, newest first — 20 is roughly five months
 * of weekly revisions, well past the window anyone reviews a bad month over.
 *
 * Deliberately not run through the library-demo overlay that getPlansForClient
 * applies: a revision answers "what was she following then", so it shows the
 * snapshot as saved rather than today's version of it.
 */
export async function listPlanRevisions(clientId: string, type: PlanType): Promise<PlanRevision[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plan_revisions')
    .select('*')
    .eq('client_id', clientId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(20)

  // An empty list is drawn as "no earlier versions yet", which a failed read
  // would turn into a false reassurance that history is being kept. Nothing to
  // show the coach mid-edit, but it must not vanish silently.
  if (error) console.error('[listPlanRevisions] read failed for', clientId, type, '—', error)

  return (data || []) as PlanRevision[]
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
  const meal = plans.find((p) => p.type === 'meal') || null
  let workout = plans.find((p) => p.type === 'workout') || null

  // Overlay the CURRENT library demo (GIF/photos/cues) onto each workout item by
  // exerciseId, so demos upgrade automatically without re-saving old plans. The
  // exercises table is coach-only under RLS, so we read demo fields with the
  // admin client — non-sensitive, and the caller already has plan access.
  const items = workout?.content?.workoutItems
  if (workout && items?.length) {
    const ids = [...new Set(items.map((i) => i.exerciseId).filter(Boolean))] as string[]
    if (ids.length) {
      try {
        const admin = createAdminClient()
        const { data: exs } = await admin
          .from('exercises')
          .select('id, demo_url, image_start, image_end, cues')
          .in('id', ids)
        const byId = new Map((exs || []).map((e) => [e.id, e]))
        workout = {
          ...workout,
          content: {
            ...workout.content,
            workoutItems: items.map((it) => {
              const e = it.exerciseId ? byId.get(it.exerciseId) : null
              if (!e) return it
              return {
                ...it,
                demoUrl: e.demo_url ?? it.demoUrl ?? null,
                imageStart: e.image_start ?? it.imageStart ?? null,
                imageEnd: e.image_end ?? it.imageEnd ?? null,
                notes: it.notes ?? e.cues ?? null,
              }
            }),
          },
        }
      } catch {
        /* enrichment is best-effort — fall back to the embedded snapshot */
      }
    }
  }

  return { meal, workout }
}
