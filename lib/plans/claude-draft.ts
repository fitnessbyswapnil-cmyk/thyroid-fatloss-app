import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { Food } from '@/app/actions/library'
import { hardExclusions, isFoodAllowed, labelFor, type Exclusions, type FoodPreferences } from './preferences'
import type { TargetResult } from './targets'

/**
 * Ask Claude to draft a day of meals from this app's own food library.
 *
 * The free generator in ./generate.ts is arithmetic and will always be the
 * cheaper, faster, more predictable option — it hits a calorie target exactly
 * and cannot invent a food. What it cannot do is read "carries a tiffin, cooks
 * for a family, 15 minutes on a weekday, South Indian kitchen" and put a plate
 * together that reflects all four at once. That judgement is what this file
 * buys, and it is the only thing it is here for.
 *
 * Everything the model returns is treated as a suggestion that has to earn its
 * way past a server-side check:
 *
 *   - it may only name foods from the list we handed it, and we look every one
 *     of them back up in the rows we loaded from the database;
 *   - every macro shown to the coach is recomputed here from those rows, never
 *     copied from the model's own arithmetic;
 *   - quantities are clamped to something a coach would actually prescribe;
 *   - the note is labelled a draft for the coach and never presented as his.
 *
 * The failure this is built against is not a wrong number. It is a plausible
 * food that does not exist — "Ragi Adai, 1 piece, 140 kcal" reads perfectly and
 * would be prescribed to a real person. So the id is the gate, and anything
 * that fails it is dropped and reported rather than repaired.
 */

/**
 * The four slots the free generator emits, reused verbatim.
 *
 * She may eat five or six times a day, and the prompt says so — the extra
 * meals come back as additional Snack rows rather than new slot names. The
 * plan editor groups by this exact string, so a model-invented "Mid-morning"
 * would render as an orphan section next to the ones "Draft a day" produces.
 */
export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const
export type MealSlot = (typeof MEAL_SLOTS)[number]

/** Explicitly named rather than left to the SDK default, so a model change is a diff. */
const MODEL = 'claude-sonnet-5'

/** Portion multipliers a coach would write down. Anything outside is clamped, not obeyed. */
const MIN_QTY = 0.25
const MAX_QTY = 4
const QTY_STEP = 0.25

/** A day is a day. More rows than this is the model padding, not planning. */
const MAX_ITEMS = 14

/**
 * Ceiling on how many foods go into the prompt. The library is 216 rows today,
 * so nothing is trimmed — this exists so a library that doubles doesn't quietly
 * double the cost of every draft. When it does bite, the coach is told.
 */
const MAX_CANDIDATES = 260

/** The coach is watching a spinner. One retry, then say something useful. */
// Two attempts must fit inside the route's maxDuration (60s, set on
// app/coach/client/[id]/page.tsx) with room to spare, or the platform kills the
// invocation before the action can return a message the coach can read. At 90s
// a single attempt already exceeded the whole budget.
const REQUEST_TIMEOUT_MS = 24_000

export interface DraftItem {
  /** The real `foods.id` — resolved server-side from the short ref the model saw. */
  foodId: string
  name: string
  portion: string
  qty: number
  meal: MealSlot
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
}

export interface DraftSwap {
  replaceFoodId: string
  replaceName: string
  withFoodId: string
  withName: string
  why: string
}

export interface ClaudeDraft {
  items: DraftItem[]
  /** Recomputed here from the database rows. Never the model's own addition. */
  totals: { calories: number; protein: number; carbs: number; fats: number }
  /** Everything that was dropped, clamped or missed, in the coach's words. */
  warnings: string[]
  /**
   * UNREVIEWED MODEL OUTPUT, written for the coach to read and rewrite.
   *
   * The field is named for what it is so a UI cannot render it next to the
   * client's plan by accident. It is never the coach's voice and must never be
   * shown to a client as something he wrote.
   */
  coachNoteDraft: string
  swaps: DraftSwap[]
  targets: { calories: number; protein: number }
  candidateCount: number
  /** How many library rows her restrictions removed before the model saw anything. */
  excludedCount: number
  model: string
}

export type DraftOutcome = { ok: true; draft: ClaudeDraft } | { ok: false; reason: string }

export interface DraftClientFacts {
  fullName: string | null
  age: number | null
  gender: string | null
  heightCm: number | null
  weightKg: number
  targetWeightKg: number | null
  activityLabel: string | null
}

export interface DraftMealDayInput {
  apiKey: string
  client: DraftClientFacts
  prefs: FoodPreferences
  foods: Food[]
  targets: TargetResult
  /**
   * Allergy keywords pulled out of her free-text health profile. Merged with
   * the tap-answer exclusions because an allergy recorded at onboarding must
   * not depend on her also having tapped it on the preferences screen.
   */
  extraAvoid?: string[]
  /** Bumped by the coach to ask for a different day. */
  variety?: number
  /** Anything the coach wants to steer this particular draft with. */
  notes?: string
}

/**
 * Mirrors `isExcluded` in ./generate.ts, deliberately duplicated rather than
 * shared: that file belongs to the deterministic generator and is not being
 * touched in this change. If a third caller appears, lift both into one helper.
 */
function isExcluded(food: Food, avoid: string[]): boolean {
  if (!avoid.length) return false
  const hay = `${food.name} ${food.tags ?? ''}`.toLowerCase()
  return avoid.some((a) => a.length >= 3 && hay.includes(a))
}

/** `foods.tags` is comma-separated text and the values carry leading spaces. */
function tagsOf(food: Food): string[] {
  return (food.tags ?? '')
    .toLowerCase()
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export interface CandidateSet {
  candidates: Food[]
  /** Rows her restrictions removed. */
  excludedCount: number
  /** Rows MAX_CANDIDATES cut off the end. Zero at the current library size. */
  trimmedCount: number
  /** The gate, carried through so the post-model re-check uses the same one. */
  exclusions: Exclusions
  avoid: string[]
}

/**
 * The foods the model is allowed to see, and their order.
 *
 * Two different things happen here and they are not interchangeable. Hard
 * exclusions are *enforced* — a vegetarian is never sent chicken, because a
 * constraint you can enforce in code should never be delegated to a model that
 * might get it right. Cuisine is only a *preference*, so matching foods are
 * moved to the front and the rest are kept: dropping them would turn a
 * four-cuisine library into a twenty-five-item one and produce the same three
 * plates every week.
 *
 * Within each group the order is alphabetical rather than natural, so two
 * drafts for the same client send a byte-identical food list and the prompt
 * cache actually hits.
 */
export function selectCandidates(
  foods: Food[],
  prefs: FoodPreferences,
  extraAvoid: string[] = []
): CandidateSet {
  const base = hardExclusions(prefs)
  const avoid = [
    ...new Set([...base.avoid, ...extraAvoid.map((a) => a.toLowerCase().trim())]),
  ].filter((a) => a.length >= 3)
  // Allergies from health_profiles fold into the same gate, so the filter and
  // the post-model re-check can never disagree about what she may eat.
  const exclusions: Exclusions = { diet: base.diet, avoid }

  const macrosKnown = (f: Food) => typeof f.calories === 'number' && f.calories > 0
  const usable = foods.filter((f) => macrosKnown(f) && isFoodAllowed(f, exclusions))

  const wanted = prefs.cuisines.map((c) => c.toLowerCase().trim()).filter(Boolean)
  const preferred = (f: Food) => wanted.length > 0 && tagsOf(f).some((t) => wanted.includes(t))

  const byName = (a: Food, b: Food) => a.name.localeCompare(b.name)
  const ordered = [...usable.filter(preferred).sort(byName), ...usable.filter((f) => !preferred(f)).sort(byName)]

  return {
    candidates: ordered.slice(0, MAX_CANDIDATES),
    // Only what her restrictions removed. Rows with no calories are unusable
    // for a different reason and must not be reported to the coach as though
    // she had excluded them.
    excludedCount: foods.filter((f) => macrosKnown(f) && !isFoodAllowed(f, exclusions)).length,
    trimmedCount: Math.max(0, ordered.length - MAX_CANDIDATES),
    exclusions,
    avoid,
  }
}

/**
 * Her answers as sentences rather than stored identifiers.
 *
 * `tablet_timing` is deliberately not included. It is the one preference that
 * is about her medication, and this app's standing rule is that nothing
 * generated goes anywhere near her dose or its timing — so the model is never
 * given the opportunity to comment on it.
 */
export function describePreferences(prefs: FoodPreferences): string[] {
  const lines: string[] = []
  if (prefs.diet_type) lines.push(`Eats: ${labelFor('diet_type', prefs.diet_type)}`)
  if (prefs.meals_per_day) lines.push(`Eats ${prefs.meals_per_day} times a day`)
  if (prefs.cuisines.length) {
    lines.push(`Cooks mostly: ${prefs.cuisines.map((c) => labelFor('cuisines', c)).join(', ')}`)
  }
  if (prefs.staple) lines.push(`Staple: ${labelFor('staple', prefs.staple)}`)
  if (prefs.who_cooks) lines.push(`Kitchen: ${labelFor('who_cooks', prefs.who_cooks)}`)
  if (prefs.cook_time) lines.push(`Time she has on a weekday meal: ${labelFor('cook_time', prefs.cook_time)}`)
  if (prefs.lunch_place) lines.push(`Lunch is: ${labelFor('lunch_place', prefs.lunch_place)}`)
  if (prefs.caffeine_per_day) lines.push(`Tea or coffee: ${labelFor('caffeine_per_day', prefs.caffeine_per_day)}`)
  if (prefs.avoid.length) {
    lines.push(`Will not eat: ${prefs.avoid.map((a) => labelFor('avoid', a)).join(', ')}`)
  }
  if (prefs.avoid_note?.trim()) lines.push(`In her own words: ${prefs.avoid_note.trim().slice(0, 300)}`)
  return lines
}

/**
 * The food list, as short refs rather than uuids.
 *
 * A uuid is ~10 tokens; 216 of them is a couple of thousand tokens spent on
 * nothing, and copying 36 characters exactly is a harder job than copying "f7".
 * The mapping never leaves this request — every id in the returned draft is the
 * real `foods.id`, looked up here.
 */
function buildLibraryBlock(candidates: Food[]): { text: string; byRef: Map<string, Food> } {
  const byRef = new Map<string, Food>()
  const rows = candidates.map((f, i) => {
    const ref = `f${i + 1}`
    byRef.set(ref, f)
    const kcal = Math.round(f.calories ?? 0)
    const protein = Math.round((f.protein ?? 0) * 10) / 10
    return `${ref} | ${f.name} | ${f.portion} | ${kcal} kcal | ${protein}g protein | ${tagsOf(f).join(', ')}`
  })

  return {
    text: [
      'FOOD LIST — the only foods that exist. Foods from the cuisines she cooks are listed first.',
      'ref | name | one portion | kcal per portion | protein per portion | tags',
      ...rows,
    ].join('\n'),
    byRef,
  }
}

const SYSTEM = [
  'You are helping a fat-loss coach draft one day of meals for a client in India who has hypothyroidism.',
  'Your output goes to the coach, who edits it before the client ever sees it. You are not talking to the client.',
  '',
  'Hard rules:',
  '- Use ONLY foods from the FOOD LIST you are given, and copy each ref exactly as written. Never invent a food, a name, or a ref. If the list cannot support a good day, use what it has and say so in your note.',
  '- qty is a multiple of the portion shown for that food. Stay between 0.25 and 4, in steps of 0.25.',
  '- Land within about 10% of the calorie target and get as close to the protein target as the list allows.',
  '- Lunch and dinner are a plate, not an item: a carb base plus a protein main, the way an Indian home actually eats. A breakfast or a snack can be a single item.',
  '- Respect how much time she has, who cooks, and whether lunch travels in a tiffin. A dish she has no time to make is not a plan.',
  '- If she eats five or six times a day, add the extra meals as additional Snack rows.',
  '',
  'Never write about her medication, her dose, when she takes her tablet, her blood report, or any lab value. Those belong to her doctor and her coach, not to a meal plan.',
  'EVERY word you write — the note and every swap reason — is a draft for the coach. Write to him, about her, in the third person. Never address her as "you", never write in his voice, and never write a sentence built to be forwarded to her unedited.',
].join('\n')

/** The schema is the output contract. Prose asking for JSON breaks on the first stray comma. */
const DRAFT_TOOL: Anthropic.Tool = {
  name: 'draft_day',
  description:
    "Return one day of meals for this client, built only from the supplied FOOD LIST. Every ref must be copied exactly from that list.",
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        description: 'The meals of the day, in the order they are eaten.',
        items: {
          type: 'object',
          properties: {
            foodId: {
              type: 'string',
              description: 'A ref copied exactly from the FOOD LIST, e.g. "f12".',
            },
            qty: {
              type: 'number',
              description: 'How many portions, between 0.25 and 4 in steps of 0.25.',
            },
            meal: { type: 'string', enum: [...MEAL_SLOTS] },
          },
          required: ['foodId', 'qty', 'meal'],
          additionalProperties: false,
        },
      },
      note: {
        type: 'string',
        description:
          'Two or three sentences for the coach: why this day looks like this, and anything the food list could not cover. Nothing about medication or lab values.',
      },
      swaps: {
        type: 'array',
        description:
          'Optional alternatives if she does not want something on the day. Both refs must come from the FOOD LIST.',
        items: {
          type: 'object',
          properties: {
            replaceFoodId: { type: 'string', description: 'Ref of an item on the day above.' },
            withFoodId: { type: 'string', description: 'Ref of the food to swap in.' },
            why: { type: 'string', description: 'One short line for the coach, written to him about her, in the third person. Not a message to the client.' },
          },
          required: ['replaceFoodId', 'withFoodId', 'why'],
          additionalProperties: false,
        },
      },
    },
    required: ['items', 'note', 'swaps'],
    additionalProperties: false,
  },
}

interface RawDraft {
  items?: Array<{ foodId?: unknown; qty?: unknown; meal?: unknown }>
  note?: unknown
  swaps?: Array<{ replaceFoodId?: unknown; withFoodId?: unknown; why?: unknown }>
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Snap to the nearest prescribable step, then hold inside the range. */
function clampQty(raw: number): number {
  const stepped = Math.round(raw / QTY_STEP) * QTY_STEP
  return round1(Math.min(MAX_QTY, Math.max(MIN_QTY, stepped)))
}

/**
 * Turn what the model said into what the coach is allowed to see.
 *
 * Adversarial by design: nothing here trusts a field. An unknown ref is dropped
 * and named, a nonsense quantity is dropped or clamped, and the totals are
 * built from the database rows rather than from anything the model added up.
 */
function validateDraft(
  raw: RawDraft,
  byRef: Map<string, Food>,
  exclusions: Exclusions,
  avoid: string[],
  targets: { calories: number; protein: number }
): { items: DraftItem[]; swaps: DraftSwap[]; warnings: string[]; totals: ClaudeDraft['totals'] } {
  const warnings: string[] = []
  const invented = new Set<string>()

  /** Resolve a ref, and refuse it if it somehow names something she can't eat. */
  const resolve = (ref: unknown): Food | null => {
    if (typeof ref !== 'string') return null
    const food = byRef.get(ref.trim())
    if (!food) {
      invented.add(String(ref).slice(0, 40))
      return null
    }
    // byRef is built from the already-filtered candidate list, so this cannot
    // fire today. It stays because it is the check that must not be the one we
    // left out if the list is ever built somewhere else.
    if (!isFoodAllowed(food, exclusions)) {
      warnings.push(`Dropped ${food.name} — it is on her exclusion list.`)
      return null
    }
    return food
  }

  // Same food in the same slot twice is one bigger portion, not two rows.
  const merged = new Map<string, DraftItem>()
  for (const it of Array.isArray(raw.items) ? raw.items : []) {
    if (merged.size >= MAX_ITEMS) {
      warnings.push(`Kept the first ${MAX_ITEMS} items — the draft came back longer than a day.`)
      break
    }
    const food = resolve(it?.foodId)
    if (!food) continue

    const qtyRaw = Number(it?.qty)
    if (!Number.isFinite(qtyRaw) || qtyRaw <= 0) {
      warnings.push(`Dropped ${food.name} — the quantity came back as "${String(it?.qty)}".`)
      continue
    }
    const qty = clampQty(qtyRaw)
    if (Math.abs(qty - qtyRaw) > 0.001) {
      warnings.push(`${food.name}: quantity ${qtyRaw} adjusted to ${qty} portions.`)
    }

    const mealRaw = typeof it?.meal === 'string' ? it.meal.trim().toLowerCase() : ''
    const meal = MEAL_SLOTS.find((m) => m.toLowerCase() === mealRaw)
    if (!meal) {
      warnings.push(`${food.name}: came back under "${String(it?.meal)}" — filed as Snack.`)
    }
    const slot: MealSlot = meal ?? 'Snack'

    const key = `${food.id}::${slot}`
    const existing = merged.get(key)
    if (existing) {
      existing.qty = clampQty(existing.qty + qty)
      continue
    }
    merged.set(key, {
      foodId: food.id,
      name: food.name,
      portion: food.portion,
      qty,
      meal: slot,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    })
  }

  const order = new Map(MEAL_SLOTS.map((m, i) => [m, i]))
  const items = [...merged.values()].sort((a, b) => (order.get(a.meal) ?? 0) - (order.get(b.meal) ?? 0))

  // Counted separately from the items above: a bad ref in a swap is a lost
  // suggestion, not a hole in her day, and the item warning has to stay
  // trustworthy enough that the coach acts on it.
  const inventedInItems = new Set(invented)

  const swaps: DraftSwap[] = []
  for (const s of Array.isArray(raw.swaps) ? raw.swaps : []) {
    const from = resolve(s?.replaceFoodId)
    const to = resolve(s?.withFoodId)
    if (!from || !to || from.id === to.id) continue
    swaps.push({
      replaceFoodId: from.id,
      replaceName: from.name,
      withFoodId: to.id,
      withName: to.name,
      why: typeof s?.why === 'string' ? s.why.trim().slice(0, 200) : '',
    })
    if (swaps.length >= 6) break
  }

  if (inventedInItems.size) {
    // The headline failure. Named explicitly, because "some items were removed"
    // gives the coach no way to tell whether to trust the rest of the day.
    warnings.push(
      `${inventedInItems.size} item${inventedInItems.size === 1 ? '' : 's'} named a food that isn't in the library and ${inventedInItems.size === 1 ? 'was' : 'were'} dropped.`
    )
  }

  // Recomputed from the rows we loaded. The model's own totals are never read.
  const raws = items.reduce(
    (acc, it) => ({
      calories: acc.calories + (it.calories ?? 0) * it.qty,
      protein: acc.protein + (it.protein ?? 0) * it.qty,
      carbs: acc.carbs + (it.carbs ?? 0) * it.qty,
      fats: acc.fats + (it.fats ?? 0) * it.qty,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  if (!items.length) {
    warnings.push('Nothing in the draft survived the check against the library.')
  } else {
    // Same honesty as the free generator: report the miss, don't hide it.
    if (Math.abs(raws.calories - targets.calories) / targets.calories > 0.1) {
      warnings.push(
        `Came to ${Math.round(raws.calories)} kcal against a ${targets.calories} target — adjust portions before you send it.`
      )
    }
    if (raws.protein < targets.protein * 0.9) {
      warnings.push(`Protein reached ${Math.round(raws.protein)}g of ${targets.protein}g.`)
    }
  }

  return {
    items,
    swaps,
    warnings,
    totals: {
      calories: Math.round(raws.calories),
      protein: round1(raws.protein),
      carbs: round1(raws.carbs),
      fats: round1(raws.fats),
    },
  }
}

function buildProfileBlock(input: DraftMealDayInput, set: CandidateSet): string {
  const { client, targets } = input
  const facts: string[] = []
  if (client.age) facts.push(`${client.age} years old`)
  if (client.heightCm) facts.push(`${Math.round(client.heightCm)} cm`)
  facts.push(`${client.weightKg} kg now`)
  if (client.targetWeightKg) facts.push(`aiming for ${client.targetWeightKg} kg`)
  if (client.activityLabel) facts.push(client.activityLabel.toLowerCase())

  const lines = [
    'THE CLIENT',
    facts.join(', ') + '.',
    ...describePreferences(input.prefs),
    '',
    'TARGET FOR THE DAY',
    `${targets.calories} kcal and about ${targets.protein} g protein.`,
  ]

  if (set.avoid.length) {
    lines.push(
      '',
      'Foods matching her restrictions have already been removed from the list below — you do not need to filter again.'
    )
  }
  if (input.notes?.trim()) {
    lines.push('', 'THE COACH ADDS', input.notes.trim().slice(0, 600))
  }
  if ((input.variety ?? 0) > 0) {
    lines.push(
      '',
      `This is alternative #${input.variety} for the same client — build a day that is genuinely different from an obvious first pass, not a reshuffle of the same dishes.`
    )
  }
  lines.push('', 'Call draft_day with the result.')
  return lines.join('\n')
}

/**
 * One call, one validated day. Returns a reason instead of throwing, because
 * every caller of this is a button the coach just pressed.
 */
export async function draftMealDay(input: DraftMealDayInput): Promise<DraftOutcome> {
  const set = selectCandidates(input.foods, input.prefs, input.extraAvoid ?? [])
  if (!set.candidates.length) {
    return {
      ok: false,
      reason:
        'Her restrictions rule out every food in the library. Add some options she can eat, then try again.',
    }
  }

  const { text: libraryText, byRef } = buildLibraryBlock(set.candidates)
  const targets = { calories: input.targets.calories, protein: input.targets.protein }

  const client = new Anthropic({
    apiKey: input.apiKey,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1,
  })

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Selecting from a fixed list against two numbers is bounded work, not
      // research. High effort spends thinking tokens on a decision the food
      // list has already narrowed for it.
      output_config: { effort: 'medium' },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            // Library first, and cached: it is identical across re-rolls for
            // the same client, so only the short profile block below is re-read
            // at full price when the coach asks for another day.
            { type: 'text', text: libraryText, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: buildProfileBlock(input, set) },
          ],
        },
      ],
      tools: [DRAFT_TOOL],
      tool_choice: { type: 'tool', name: 'draft_day' },
    })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false, reason: 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY, then try again.' }
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, reason: 'Claude is rate-limited right now. Wait a minute and try again — "Draft a day" still works.' }
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      return { ok: false, reason: 'Claude took too long to answer. Try again, or use "Draft a day" to get a plan now.' }
    }
    if (err instanceof Anthropic.APIError) {
      // The status is worth surfacing; the stack is not.
      return { ok: false, reason: `Claude could not be reached (${err.status ?? 'no response'}). "Draft a day" still works.` }
    }
    throw err
  }

  if (response.stop_reason === 'refusal') {
    return { ok: false, reason: 'Claude declined to answer this one. Use "Draft a day", or adjust your note and retry.' }
  }

  // A run cut off at the token ceiling still delivers a tool_use block, and its
  // input is a valid-looking partial object — plausibly a day containing only
  // breakfast. Everything downstream then validates it happily and the coach
  // sees an ordinary result card with one mild "came to 380 kcal" note, which
  // reads as the model planning badly rather than as a truncated answer. There
  // is no way to tell the two apart after this point, so it is caught here.
  if (response.stop_reason === 'max_tokens') {
    return { ok: false, reason: 'The draft was cut off before it finished, so it would be missing meals. Try again, or use "Draft a day".' }
  }

  const call = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'draft_day'
  )
  if (!call) {
    return { ok: false, reason: 'Claude answered without a plan. Try again — "Draft a day" still works.' }
  }

  const raw = (call.input ?? {}) as RawDraft
  const { items, swaps, warnings, totals } = validateDraft(raw, byRef, set.exclusions, set.avoid, targets)

  if (!items.length) {
    return {
      ok: false,
      reason: 'Every food in the draft failed the check against your library, so there is nothing to show. Try again, or use "Draft a day".',
    }
  }

  if (set.trimmedCount > 0) {
    warnings.push(`${set.trimmedCount} library foods were left out of this draft — the list sent to Claude is capped at ${MAX_CANDIDATES}.`)
  }

  return {
    ok: true,
    draft: {
      items,
      totals,
      warnings,
      coachNoteDraft: typeof raw.note === 'string' ? raw.note.trim().slice(0, 800) : '',
      swaps,
      targets,
      candidateCount: set.candidates.length,
      excludedCount: set.excludedCount,
      model: response.model,
    },
  }
}
