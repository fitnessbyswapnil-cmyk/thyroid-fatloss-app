/**
 * What we ask a client about her food, once, at onboarding — and the single
 * place those questions are defined.
 *
 * Both the onboarding screens and the coach's summary panel render from this
 * list, so a question added here appears on both sides with the same wording
 * and the same options. The alternative, which this replaces, is a question
 * hardcoded in the form and a label hardcoded in the panel, drifting apart the
 * first time either is edited.
 *
 * Every answer is a tap. Nothing here is free text except the one deliberate
 * escape hatch at the end, because the target client is filling this in on a
 * phone, often at night, and every text field is somewhere to give up.
 *
 * `value` strings are stored verbatim in `food_preferences` and read straight
 * into the plan generator and the Claude prompt, so they are stable
 * identifiers, not display copy. Change a `label` freely; changing a `value`
 * is a migration.
 *
 * `cuisine` values match the tags already on the 216 rows in `foods`
 * (south-indian, north-indian, west-indian, east-indian), so a cuisine
 * preference filters the library directly rather than needing a lookup table.
 */

export type PrefKind = "single" | "multi"

export interface PrefOption {
  value: string
  label: string
  /** Second line under the label. Keep to a few words — this is a tap target. */
  hint?: string
  /** Resolved against an explicit map in the UI, so an unknown name degrades. */
  icon?: string
}

export interface PrefQuestion {
  /** Column in `food_preferences`. */
  key: PrefKey
  screen: number
  question: string
  kind: PrefKind
  options: PrefOption[]
  /**
   * Why this question is being asked, in her words. Shown under the question.
   *
   * Only present where there is a real reason a coach would give, and worded as
   * general guidance about food and timing — never as advice about her dose,
   * and never as an interpretation of anything on her report. The caffeine and
   * tablet questions carry the same guidance as the existing lesson "Your
   * tablet, your coffee, and a 4-hour rule".
   */
  why?: string
  /** Skippable questions still advance; the plan just has less to go on. */
  optional?: boolean
}

export type PrefKey =
  | "diet_type"
  | "meals_per_day"
  | "cuisines"
  | "staple"
  | "who_cooks"
  | "cook_time"
  | "lunch_place"
  | "caffeine_per_day"
  | "tablet_timing"
  | "avoid"

export interface FoodPreferences {
  diet_type: string | null
  meals_per_day: number | null
  cuisines: string[]
  staple: string | null
  who_cooks: string | null
  cook_time: string | null
  lunch_place: string | null
  caffeine_per_day: string | null
  tablet_timing: string | null
  avoid: string[]
  avoid_note: string | null
}

export const EMPTY_PREFERENCES: FoodPreferences = {
  diet_type: null,
  meals_per_day: null,
  cuisines: [],
  staple: null,
  who_cooks: null,
  cook_time: null,
  lunch_place: null,
  caffeine_per_day: null,
  tablet_timing: null,
  avoid: [],
  avoid_note: null,
}

/** The four screens, in order, with the heading she sees on each. */
export const PREF_SCREENS: { screen: number; title: string; blurb: string }[] = [
  { screen: 1, title: "How you eat", blurb: "So your plan looks like food you already recognise." },
  { screen: 2, title: "Your kitchen", blurb: "A plan you have no time to cook is a plan you won't follow." },
  { screen: 3, title: "Tea, coffee & your tablet", blurb: "Timing changes how much of your tablet actually reaches you." },
  { screen: 4, title: "Anything you avoid", blurb: "Tap anything that shouldn't appear on your plate." },
]

export const PREF_QUESTIONS: PrefQuestion[] = [
  {
    key: "diet_type",
    screen: 1,
    question: "What do you eat?",
    kind: "single",
    options: [
      { value: "veg", label: "Vegetarian", icon: "leaf" },
      { value: "egg", label: "Veg + egg", icon: "egg" },
      { value: "nonveg", label: "Non-vegetarian", icon: "drumstick" },
      { value: "vegan", label: "Vegan", hint: "No dairy", icon: "sprout" },
    ],
  },
  {
    key: "meals_per_day",
    screen: 1,
    question: "How many times a day do you eat?",
    kind: "single",
    why: "Counting the small ones too — chai with a biscuit is a meal as far as your plan is concerned.",
    options: [
      { value: "3", label: "3", hint: "Main meals only", icon: "utensils" },
      { value: "4", label: "4", hint: "Plus one snack", icon: "utensils" },
      { value: "5", label: "5", hint: "Two snacks", icon: "utensils" },
      { value: "6", label: "6 or more", hint: "I graze", icon: "utensils" },
    ],
  },
  {
    key: "cuisines",
    screen: 1,
    question: "Which food do you cook most at home?",
    kind: "multi",
    why: "Pick as many as apply. Your plan is built from these first.",
    options: [
      { value: "north-indian", label: "North Indian", hint: "Roti, dal, sabzi", icon: "wheat" },
      { value: "south-indian", label: "South Indian", hint: "Idli, dosa, sambar", icon: "soup" },
      { value: "west-indian", label: "West Indian", hint: "Thepla, poha, bhakri", icon: "cookie" },
      { value: "east-indian", label: "East Indian", hint: "Rice, fish, jhol", icon: "fish" },
    ],
  },
  {
    key: "staple",
    screen: 1,
    question: "Roti or rice?",
    kind: "single",
    options: [
      { value: "roti", label: "Mostly roti", icon: "wheat" },
      { value: "rice", label: "Mostly rice", icon: "bowl" },
      { value: "both", label: "Both", icon: "utensils" },
      { value: "millets", label: "Millets", hint: "Bajra, jowar, ragi", icon: "sprout" },
    ],
  },

  {
    key: "who_cooks",
    screen: 2,
    question: "Who does the cooking?",
    kind: "single",
    options: [
      { value: "self", label: "I cook", icon: "chef" },
      { value: "family", label: "Someone at home", icon: "users" },
      { value: "help", label: "A cook or maid", icon: "chef" },
      { value: "outside", label: "Mostly ordered or canteen", icon: "bag" },
    ],
  },
  {
    key: "cook_time",
    screen: 2,
    question: "How long can you spend on a meal?",
    kind: "single",
    why: "Be honest about a weekday, not a Sunday.",
    options: [
      { value: "under15", label: "Under 15 min", icon: "clock" },
      { value: "15to30", label: "15–30 min", icon: "clock" },
      { value: "over30", label: "I have time", icon: "clock" },
    ],
  },
  {
    key: "lunch_place",
    screen: 2,
    question: "Where is lunch, usually?",
    kind: "single",
    why: "A lunch that has to survive a tiffin box is a different lunch.",
    options: [
      { value: "home", label: "At home", icon: "home" },
      { value: "tiffin", label: "Tiffin I carry", icon: "box" },
      { value: "outside", label: "Canteen or outside", icon: "bag" },
    ],
  },

  {
    key: "caffeine_per_day",
    screen: 3,
    question: "How much tea or coffee in a day?",
    kind: "single",
    why: "Not to take it away — to place it where it doesn't sit on top of your tablet.",
    options: [
      { value: "none", label: "None", icon: "off" },
      { value: "1to2", label: "1–2 cups", icon: "coffee" },
      { value: "3to4", label: "3–4 cups", icon: "coffee" },
      { value: "5plus", label: "5 or more", icon: "coffee" },
    ],
  },
  {
    key: "tablet_timing",
    screen: 3,
    question: "How long after your tablet do you have your first tea or food?",
    kind: "single",
    why: "Tea, coffee, milk and calcium all reduce how much of the tablet is absorbed, which is why the gap matters. Your doctor, or the leaflet in the box, is who says what to aim for — we just need to know where you are now.",
    optional: true,
    options: [
      { value: "under30", label: "Less than 30 min", icon: "clock" },
      { value: "30to60", label: "30–60 min", icon: "clock" },
      { value: "over60", label: "An hour or more", icon: "clock" },
      { value: "no_tablet", label: "I don't take one", icon: "off" },
      { value: "unsure", label: "Not sure", icon: "help" },
    ],
  },

  {
    key: "avoid",
    screen: 4,
    question: "Anything you can't eat, or would rather not?",
    kind: "multi",
    why: "Allergies, dislikes, anything that doesn't agree with you. Nothing here is a wrong answer.",
    optional: true,
    options: [
      { value: "dairy", label: "Milk & dairy" },
      { value: "onion-garlic", label: "Onion & garlic" },
      { value: "egg", label: "Egg" },
      { value: "peanut", label: "Peanuts" },
      { value: "soy", label: "Soy" },
      { value: "gluten", label: "Wheat / gluten" },
      { value: "mushroom", label: "Mushroom" },
      { value: "brinjal", label: "Brinjal" },
      { value: "fish", label: "Fish & seafood" },
      { value: "paneer", label: "Paneer" },
      { value: "curd", label: "Curd" },
      { value: "sugar", label: "Sugar" },
    ],
  },
]

export const QUESTIONS_BY_SCREEN = (screen: number) => PREF_QUESTIONS.filter((q) => q.screen === screen)

/**
 * What she is about to be asked, shown before she starts.
 *
 * Onboarding dropped her straight into a form with a progress dot and no idea
 * how long it ran for. Someone who is tired and unwell abandons that.
 *
 * These rows MUST match the real step order in app/onboarding/page.tsx. The
 * first version listed six things while the flow asked eight, and the two it
 * left out were the skippable ones — so the screen built to stop her being
 * surprised was itself the surprise. One row per screen she will actually see,
 * in the order she will see them.
 */
export const ONBOARDING_OUTLINE: { icon: string; title: string; detail: string; optional?: boolean }[] = [
  { icon: "user", title: "About you", detail: "Age, height, weight, your diagnosis" },
  { icon: "utensils", title: "How you eat", detail: "Veg or non-veg, roti or rice" },
  { icon: "chef", title: "Your kitchen", detail: "Who cooks, and how long you have" },
  { icon: "coffee", title: "Tea, coffee & your tablet", detail: "Three taps", optional: true },
  { icon: "off", title: "Anything you avoid", detail: "Tap what shouldn't be on your plate", optional: true },
  { icon: "target", title: "Your goal", detail: "Where you'd like to get to" },
  { icon: "flask", title: "Blood report", detail: "Upload it now or later", optional: true },
]

/**
 * A hard filter on the food library, derived from her answers.
 *
 * Kept separate from the soft preferences on purpose: a vegetarian being
 * offered chicken is a broken product, whereas a North Indian being offered
 * one South Indian breakfast is a Tuesday. Only the first kind belongs here.
 *
 * `diet` is three-state rather than a `vegOnly` boolean because "Veg + egg" is
 * neither. The first version of this returned vegOnly:false for "egg", which
 * meant a woman who eats eggs and nothing else from an animal was handed the
 * entire meat library — mutton, prawns, chicken biryani — with only a line in a
 * prompt standing between her and it. A boolean could not express the case, so
 * it silently picked the wrong side.
 */
export type DietGate = "any" | "veg" | "veg_plus_egg"

export interface Exclusions {
  diet: DietGate
  avoid: string[]
}

/**
 * Egg dishes are `is_veg = false` in the library and are NOT identifiable by
 * name — "Masala Omelette" has no "egg" in it — so they carry an explicit `egg`
 * tag instead. An untagged egg dish is simply never offered to a veg+egg
 * client, which is the harmless direction to fail in; the opposite rule would
 * put meat on a vegetarian's plate the first time someone mistyped a name.
 */
export function isEggFood(food: { tags?: string | null }): boolean {
  return (food.tags ?? "")
    .split(",")
    .some((t) => t.trim().toLowerCase() === "egg")
}

/**
 * Every word that means dairy on an Indian menu.
 *
 * The first version listed milk/curd/paneer/ghee/butter/cheese and stopped,
 * which let Greek Yogurt and both raitas through to a vegan — the words people
 * actually use here are not the words on a Western label. Matched against name
 * and tags, so a dish only needs to say it once.
 */
const DAIRY_WORDS = [
  "milk", "curd", "paneer", "dairy", "ghee", "butter", "cheese",
  "yogurt", "yoghurt", "dahi", "raita", "lassi", "chaas", "buttermilk",
  "malai", "khoya", "kheer", "cream", "shrikhand",
]

export function hardExclusions(prefs: FoodPreferences): Exclusions {
  const avoid = [...prefs.avoid]

  // Vegan excludes more than the is_veg flag can express, so it is spelled out.
  if (prefs.diet_type === "vegan") {
    avoid.push(...DAIRY_WORDS, "egg", "omelette", "honey")
  }
  if (prefs.avoid.includes("dairy")) avoid.push(...DAIRY_WORDS)
  if (prefs.avoid.includes("gluten")) avoid.push("wheat", "roti", "chapati", "atta", "maida", "bread", "suji", "rava")
  if (prefs.avoid.includes("onion-garlic")) avoid.push("onion", "garlic")
  if (prefs.avoid.includes("fish")) avoid.push("fish", "prawn", "seafood")
  if (prefs.avoid.includes("egg")) avoid.push("egg", "omelette")

  const diet: DietGate =
    prefs.diet_type === "veg" || prefs.diet_type === "vegan"
      ? "veg"
      : prefs.diet_type === "egg"
        ? "veg_plus_egg"
        : "any"

  return {
    diet,
    // The generator's isExcluded() ignores anything under 3 characters, and
    // duplicates cost a pointless pass over every food.
    avoid: [...new Set(avoid.map((a) => a.toLowerCase().trim()))].filter((a) => a.length >= 3),
  }
}

/**
 * The single gate every caller must use. Both the free generator and the Claude
 * path filter the candidate list AND re-check whatever comes back, so this runs
 * on both sides of the model — a food that was never offered must not be able
 * to return by id.
 */
export function isFoodAllowed(
  food: { is_veg?: boolean | null; name?: string | null; tags?: string | null },
  ex: Exclusions
): boolean {
  if (ex.diet === "veg" && !food.is_veg) return false
  if (ex.diet === "veg_plus_egg" && !food.is_veg && !isEggFood(food)) return false

  if (ex.avoid.length) {
    const hay = `${food.name ?? ""} ${food.tags ?? ""}`.toLowerCase()
    if (ex.avoid.some((a) => hay.includes(a))) return false
  }
  return true
}

/** The coach's one-line version of an answer, for the summary panel. */
export function labelFor(key: PrefKey, value: string): string {
  const q = PREF_QUESTIONS.find((x) => x.key === key)
  return q?.options.find((o) => o.value === value)?.label ?? value
}
