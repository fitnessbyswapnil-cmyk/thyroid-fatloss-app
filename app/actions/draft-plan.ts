'use server'

import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { getAnthropicApiKey } from '@/lib/env'
import { logError } from '@/lib/errors'
import type { Food } from '@/app/actions/library'
import { ACTIVITY, computeTargets, type ActivityLevel } from '@/lib/plans/targets'
import { EMPTY_PREFERENCES, type FoodPreferences } from '@/lib/plans/preferences'
import { draftMealDay, type ClaudeDraft, type DraftOutcome } from '@/lib/plans/claude-draft'

/**
 * Hand a client's real profile to Claude and get back a day of meals built only
 * from this app's own food library.
 *
 * Coach-only, and not because of an inconvenience: this spends money per press
 * and reads a client's whole record. A client calling it would be paying the
 * coach's bill to read her own file back to herself.
 *
 * Everything that comes back has already been checked against the library rows
 * in lib/plans/claude-draft.ts. This file's job is to load the inputs in one
 * round trip, authorize, and never let a failure reach the coach as a stack
 * trace or as a plan that is quietly empty.
 */

export type DraftPlanResult = { ok: true; draft: ClaudeDraft } | { ok: false; reason: string }

export interface DraftMealPlanInput {
  clientId: string
  /** Bump to ask for a different day for the same client. */
  variety?: number
  /** Free text from the coach — "she's travelling this week", "more iron". */
  notes?: string
}

/** The one row per client in food_preferences, or the empty shape if she never filled it in. */
type PrefRow = Partial<Record<keyof FoodPreferences, unknown>> | null

function toPreferences(row: PrefRow): FoodPreferences {
  if (!row) return EMPTY_PREFERENCES
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  return {
    diet_type: str(row.diet_type),
    meals_per_day: typeof row.meals_per_day === 'number' ? row.meals_per_day : null,
    cuisines: arr(row.cuisines),
    staple: str(row.staple),
    who_cooks: str(row.who_cooks),
    cook_time: str(row.cook_time),
    lunch_place: str(row.lunch_place),
    caffeine_per_day: str(row.caffeine_per_day),
    tablet_timing: str(row.tablet_timing),
    avoid: arr(row.avoid),
    avoid_note: str(row.avoid_note),
  }
}

/**
 * Allergies and conditions are free text a coach typed. Split generously —
 * over-excluding a food costs her one option; missing an allergen does not.
 *
 * Same treatment `generateMealPlan` in ./nutrition.ts already gives them, so
 * the two drafting paths can't disagree about what she must not be sent.
 */
function avoidKeywordsFrom(profile: { allergies?: string | null; conditions?: string | null } | null): string[] {
  return [profile?.allergies, profile?.conditions]
    .filter(Boolean)
    .join(',')
    .split(/[,;/]+|\band\b/i)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length >= 3 && !/^(none|nil|no|na|n\/a)$/i.test(s))
}

export async function draftMealPlanWithClaude(input: DraftMealPlanInput): Promise<DraftPlanResult> {
  try {
    const supabase = await createClient()
    const user = await getAuthUser(supabase)
    if (!user) return { ok: false, reason: 'Not authenticated' }

    // Same check as inviteClient in ./provision-client.ts. RLS already stops a
    // client reading someone else's row; this stops her spending on the call.
    const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).single()
    if (!me || (me.role !== 'coach' && me.role !== 'admin')) {
      return { ok: false, reason: 'Only the coach can draft plans with Claude.' }
    }

    const apiKey = getAnthropicApiKey()
    if (!apiKey) {
      // The honest version. Says what is missing, who sets it, and what still
      // works — rather than an empty plan or a 500 the coach has to guess at.
      return {
        ok: false,
        reason:
          'ANTHROPIC_API_KEY is not set, so Claude drafting is off. Add it to the Vercel environment and redeploy. "Draft a day" still works and needs no key.',
      }
    }

    // Four reads, one round trip. Functions run in Mumbai and the database is
    // in Singapore, so each of these serialised would cost ~67ms of the coach
    // staring at a spinner before the model call has even started.
    const [clientRes, profileRes, prefsRes, foodsRes] = await Promise.all([
      supabase
        .from('clients')
        .select('full_name, age, gender, current_weight, target_weight, height_cm, activity_level')
        .eq('id', input.clientId)
        .maybeSingle(),
      supabase
        .from('health_profiles')
        .select('allergies, conditions')
        .eq('client_id', input.clientId)
        .maybeSingle(),
      supabase.from('food_preferences').select('*').eq('client_id', input.clientId).maybeSingle(),
      supabase.from('foods').select('id, name, portion, calories, protein, carbs, fats, is_veg, tags'),
    ])

    const c = clientRes.data
    if (!c) return { ok: false, reason: 'That client could not be found.' }
    if (!c.current_weight) {
      return {
        ok: false,
        reason: `${c.full_name || 'This client'} has no current weight on file, so there is no calorie target to plan against. Add her weight first.`,
      }
    }

    const foods = (foodsRes.data ?? []) as Food[]
    if (!foods.length) {
      return { ok: false, reason: 'The food library is empty — add some foods before drafting a plan.' }
    }

    const activity = (c.activity_level as ActivityLevel | null) ?? null
    const targets = computeTargets({
      weightKg: Number(c.current_weight),
      targetWeightKg: c.target_weight != null ? Number(c.target_weight) : null,
      heightCm: c.height_cm != null ? Number(c.height_cm) : null,
      age: c.age,
      gender: c.gender,
      activity,
    })

    const outcome: DraftOutcome = await draftMealDay({
      apiKey,
      client: {
        fullName: c.full_name ?? null,
        age: c.age ?? null,
        gender: c.gender ?? null,
        heightCm: c.height_cm != null ? Number(c.height_cm) : null,
        weightKg: Number(c.current_weight),
        targetWeightKg: c.target_weight != null ? Number(c.target_weight) : null,
        activityLabel: ACTIVITY.find((a) => a.key === activity)?.label ?? null,
      },
      prefs: toPreferences(prefsRes.data as PrefRow),
      foods,
      targets,
      extraAvoid: avoidKeywordsFrom(profileRes.data),
      variety: input.variety,
      notes: input.notes,
    })

    // Only genuine failures, not the routine off-target notes.
    //
    // This used to fire on any warning at all, and "Came to 1520 kcal against a
    // 1400 target" is a warning on a large share of drafts. Every row it wrote
    // landed in error_logs, which the coach dashboard counts and renders as a
    // rose-bordered "N app errors logged in the last 7 days — clients may have
    // hit a failure". Four ordinary Sunday drafts became four Monday errors
    // pointing at a table with nothing wrong in it — and put red on something
    // that is not the app failing, which this project reserves red for.
    const realFailures = outcome.ok
      ? outcome.draft.warnings.filter((w) => /isn't in the library|exclusion list/i.test(w))
      : []

    if (outcome.ok && realFailures.length) {
      // A model naming a food that does not exist is the failure this whole
      // path is defended against, and it is invisible from the coach's side
      // once she edits the draft. Record it so it can be counted later.
      //
      // after(), not a bare promise: a floating promise dies when the
      // serverless invocation freezes and writes nothing anywhere. This has
      // already cost this project one silent logging hole.
      const summary = {
        clientId: input.clientId,
        model: outcome.draft.model,
        items: outcome.draft.items.length,
        candidates: outcome.draft.candidateCount,
        warnings: realFailures,
      }
      after(async () => {
        await logError('draftPlan.warnings', new Error(JSON.stringify(summary)), user.id)
      })
    }

    return outcome
  } catch (error) {
    // Nothing thrown from here reaches the coach. She gets one sentence she can
    // act on; the cause goes to error_logs and the Vercel log.
    await logError('draftPlan.draftMealPlanWithClaude', error)
    return {
      ok: false,
      reason: 'Claude drafting failed. Nothing was saved — use "Draft a day" for a plan now, and try Claude again in a minute.',
    }
  }
}
