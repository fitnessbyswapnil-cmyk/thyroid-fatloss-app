import Link from "next/link"
import { ChevronRight, Dumbbell, Footprints, Play, UtensilsCrossed } from "lucide-react"
import { TodayLogCard } from "@/components/dashboard/TodayLogCard"
import type { TodayMeal } from "@/lib/plans/today"
import type { WorkoutItem } from "@/app/actions/plans"

export interface TodayLogState {
  workoutDone: boolean
  mealsFollowed: number
  steps: number | null
}

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const
const eyebrow = { color: "#7e8a9e", letterSpacing: "0.16em" } as const

/**
 * The top of every home screen: what to eat today, what to do today, and the
 * three taps that say she did it. Server component — every control is a Link,
 * and the only interactive part (the log) is its own client boundary.
 *
 * This is shared between week one and every week after, so the client never
 * meets a different home screen the day her first check-in lands.
 */
export function TodayCard({
  hasPlan,
  meals,
  walk,
  exercises,
  log,
}: {
  hasPlan: boolean
  meals: TodayMeal[]
  walk: WorkoutItem | null
  exercises: WorkoutItem[]
  log: TodayLogState
}) {
  if (!hasPlan) {
    return (
      <section className="px-5 max-w-2xl mx-auto">
        <div className="p-5 rounded-2xl" style={card}>
          <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>Your coach is building your plan</p>
          <p className="text-[12.5px] mt-1" style={{ color: "#7e8a9e", lineHeight: 1.55 }}>
            Your food and exercises will appear right here. Until then, take your day-one photos below.
          </p>
        </div>
      </section>
    )
  }

  const main = meals.filter((m) => ["Breakfast", "Lunch", "Dinner"].includes(m.slot))
  const extras = meals.filter((m) => !["Breakfast", "Lunch", "Dinner"].includes(m.slot) && m.pick)

  return (
    <div className="max-w-2xl mx-auto px-5 space-y-7">
      {/* ── 1. EAT ─────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-2.5">
          <p className="text-[10.5px] uppercase font-semibold inline-flex items-center gap-1.5" style={eyebrow}>
            <UtensilsCrossed size={12} /> 1 · Eat this today
          </p>
          <Link href="/dashboard/food" className="text-[11px] font-medium" style={{ color: "#2dd4bf" }}>
            Recipes &amp; swaps
          </Link>
        </div>
        <div className="space-y-2">
          {main.map((m) => (
            <Link key={m.slot} href={`/dashboard/food#${m.slot.toLowerCase()}`} className="block p-4 rounded-2xl" style={card}>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-semibold uppercase" style={{ color: "#7e8a9e", letterSpacing: "0.1em" }}>
                  {m.slot}
                </span>
                {m.pick && (
                  <span className="text-[11px] tabular-nums" style={{ color: "#5a6578" }}>
                    {m.pick.kcal} kcal · {m.pick.protein}g protein
                  </span>
                )}
              </div>
              {m.pick ? (
                <>
                  <p className="text-[15px] font-medium mt-1" style={{ color: "#e8eaf0", lineHeight: 1.4 }}>
                    {m.pick.items.map((x) => x.name).join(" · ")}
                  </p>
                  <p className="text-[11px] mt-1.5 inline-flex items-center gap-1" style={{ color: "#5a6578" }}>
                    {m.options.length > 1 ? `Or swap for ${m.options.length - 1} other option${m.options.length === 2 ? "" : "s"}` : "Tap for the recipe"}
                    <ChevronRight size={12} />
                  </p>
                </>
              ) : (
                <p className="text-sm mt-1" style={{ color: "#7e8a9e" }}>Not set yet</p>
              )}
            </Link>
          ))}
          {extras.length > 0 && (
            <Link href="/dashboard/food" className="block p-3.5 rounded-2xl" style={card}>
              <p className="text-[12px]" style={{ color: "#a9b2c1" }}>
                Also today: {extras.map((m) => `${m.slot} — ${m.pick!.items.map((x) => x.name).join(", ")}`).join(" · ")}
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* ── 2. MOVE ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-2.5">
          <p className="text-[10.5px] uppercase font-semibold inline-flex items-center gap-1.5" style={eyebrow}>
            <Dumbbell size={12} /> 2 · Move today
          </p>
          <Link href="/dashboard/move" className="text-[11px] font-medium" style={{ color: "#2dd4bf" }}>
            All days
          </Link>
        </div>
        <div className="p-4 rounded-2xl" style={card}>
          <div className="flex items-center gap-3 pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Footprints size={18} style={{ color: "#2dd4bf" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium" style={{ color: "#e8eaf0" }}>{walk?.name || "Walk 30 minutes"}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#7e8a9e" }}>
                {walk?.notes || "Split it if you like — 15 after lunch, 15 after dinner"}
              </p>
            </div>
          </div>
          {exercises.length > 0 ? (
            <>
              <ul className="space-y-1.5">
                {exercises.map((w, i) => (
                  <li key={`${w.name}-${i}`} className="flex items-baseline justify-between text-sm">
                    <span style={{ color: "#e8eaf0" }}>{w.name}</span>
                    <span className="text-[11px] tabular-nums shrink-0 ml-3" style={{ color: "#7e8a9e" }}>
                      {w.sets ? `${w.sets} × ` : ""}{w.reps || ""}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/move?start=1"
                className="mt-4 h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2 w-full"
                style={{ background: "#2dd4bf", color: "#06231f", boxShadow: "0 8px 24px rgba(45,212,191,0.25)" }}
              >
                <Play size={15} fill="#06231f" /> Start today&apos;s exercises · about 20 min
              </Link>
            </>
          ) : (
            <p className="text-sm" style={{ color: "#7e8a9e" }}>Rest day — the walk still counts.</p>
          )}
        </div>
      </section>

      {/* ── 3. TAP ─────────────────────────────────────────────────────── */}
      <section className="-mx-1">
        <TodayLogCard
          initialWorkoutDone={log.workoutDone}
          initialMealsFollowed={log.mealsFollowed}
          initialSteps={log.steps}
          heading="3 · Tap what you did"
        />
      </section>
    </div>
  )
}
