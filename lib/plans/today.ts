import type { MealItem, WorkoutItem } from "@/app/actions/plans"
import { sessionFor, todayDayOfWeek } from "@/lib/plans/schedule"

/**
 * "What do I eat and do today" — derived once, used by the home screen, the
 * Food tab and the Move tab, so all three always agree.
 */

export const MAIN_SLOTS = ["Breakfast", "Lunch", "Dinner"] as const
export type MainSlot = (typeof MAIN_SLOTS)[number]

export interface MealOption {
  /** The plan's own grouping label, e.g. "Breakfast — option 3". */
  label: string
  /** Line items that make up this option, in plan order. */
  items: MealItem[]
  kcal: number
  protein: number
}

export interface TodayMeal {
  slot: string
  /** Today's suggestion, rotated so she gets variety without deciding. */
  pick: MealOption | null
  /** Every option for this slot, suggestion included. */
  options: MealOption[]
  /** Index of `pick` in `options`. */
  pickIndex: number
}

const qty = (x: { qty?: number | null }) => x.qty || 1

/** Programme day from her start date. Day 1 if she has none yet. */
export function dayNumberFrom(startDate: string | null | undefined, now = new Date()): number {
  const start = startDate ? new Date(startDate) : now
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86_400_000) + 1)
}

/**
 * Group the flat mealItems list into slots and options.
 *
 * The coach's plan labels each row "Breakfast — option 2" (or just "Snack").
 * Everything before the dash is the slot; the whole label is one option.
 * Rows that share a label are one meal together.
 */
export function groupMealOptions(items: MealItem[] | undefined | null): Map<string, MealOption[]> {
  const byLabel = new Map<string, MealItem[]>()
  for (const it of items || []) {
    const key = (it.meal || "").trim()
    if (!key) continue
    const arr = byLabel.get(key) || []
    arr.push(it)
    byLabel.set(key, arr)
  }
  const slots = new Map<string, MealOption[]>()
  for (const [label, rows] of byLabel) {
    const slot = label.split(/\s[—–-]\s/)[0].trim()
    const arr = slots.get(slot) || []
    arr.push({
      label,
      items: rows,
      kcal: Math.round(rows.reduce((a, x) => a + (x.calories || 0) * qty(x), 0)),
      protein: Math.round(rows.reduce((a, x) => a + (Number(x.protein) || 0) * qty(x), 0)),
    })
    slots.set(slot, arr)
  }
  return slots
}

/**
 * Today's meals: the three main slots first, always present even when empty,
 * then any other slot the coach added (snacks, pre-workout) in plan order.
 */
export function buildTodayMeals(items: MealItem[] | undefined | null, dayNumber: number): TodayMeal[] {
  const slots = groupMealOptions(items)
  const order: string[] = [...MAIN_SLOTS]
  for (const k of slots.keys()) if (!order.includes(k)) order.push(k)
  return order
    .filter((slot) => MAIN_SLOTS.includes(slot as MainSlot) || (slots.get(slot)?.length ?? 0) > 0)
    .map((slot) => {
      const options = slots.get(slot) || []
      const pickIndex = options.length ? (dayNumber - 1) % options.length : -1
      return { slot, options, pickIndex, pick: pickIndex >= 0 ? options[pickIndex] : null }
    })
}

/** Today's exercises, by ISO weekday, with the walk row separated out. */
export function buildTodayWorkout(items: WorkoutItem[] | undefined | null, now = new Date()) {
  const all = items || []
  const session = sessionFor(all, todayDayOfWeek(now))
  const isWalk = (w: WorkoutItem) => /walk/i.test(w.name)
  return {
    hasPlan: all.length > 0,
    walk: session.find(isWalk) || null,
    exercises: session.filter((w) => !isWalk(w)),
  }
}
