"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, UtensilsCrossed, Dumbbell, Footprints } from "lucide-react"
import { saveDailyLog } from "@/app/actions/daily-log"

// Local date (IST-safe): en-CA gives YYYY-MM-DD
const localDate = () => new Date().toLocaleDateString("en-CA")

const MEALS = ["Breakfast", "Lunch", "Dinner"] as const

/**
 * Step buckets rather than a number pad.
 *
 * She reads a rough figure off her phone's step counter once a day; asking her
 * to type "6,432" invites the keyboard, and the keyboard is what stops a log
 * being filled in at 10pm. The stored value is the middle of the band, so a
 * month of taps still averages honestly — it is a range she picked, not a
 * precision we are pretending to have.
 */
const STEPS = [
  { mid: 1000, label: "Under 2k" },
  { mid: 3000, label: "2–4k" },
  { mid: 5000, label: "4–6k" },
  { mid: 7000, label: "6–8k" },
  { mid: 9000, label: "8k+" },
] as const

const TEAL = "#2dd4bf"

/**
 * The whole day in three rows: did she eat to plan, did she train, did she move.
 *
 * Everything is a tap. No number pad, no stepper, no notes box — these get
 * filled in on a phone at the end of a long day, and anything needing the
 * keyboard does not get filled in at all.
 */
export function TodayLogCard({
  initialWorkoutDone,
  initialMealsFollowed,
  initialSteps,
}: {
  initialWorkoutDone: boolean
  initialMealsFollowed: number
  initialSteps: number | null
}) {
  const router = useRouter()
  const [meals, setMeals] = useState(initialMealsFollowed)
  const [workoutDone, setWorkoutDone] = useState(initialWorkoutDone)
  const [steps, setSteps] = useState<number | null>(initialSteps)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Save, and put every control back if it did not land. A tick that survives a
   * failed write tells her the day is logged while the coach's view says it is
   * not — wrong in the direction that costs trust, and invisible from both sides.
   */
  const save = async (nextMeals: number, nextWorkout: boolean, nextSteps: number | null) => {
    const prev = { meals, workoutDone, steps }
    const revert = () => {
      setMeals(prev.meals)
      setWorkoutDone(prev.workoutDone)
      setSteps(prev.steps)
    }
    setSaving(true)
    setError(null)
    try {
      const res = await saveDailyLog({
        date: localDate(),
        mealsFollowed: nextMeals,
        workoutDone: nextWorkout,
        // walk_done stays true when she logged any real movement, so the streak
        // and the coach's walk row keep working off the same tap.
        walkDone: (nextSteps ?? 0) >= 3000,
        steps: nextSteps,
      })
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 1400)
        router.refresh()
      } else {
        revert()
        setError(res.error || "That didn't save. Please try again.")
      }
    } catch (e) {
      console.error("[TodayLogCard]", e)
      revert()
      setError("That didn't save — you may have lost signal. Nothing is lost; try again.")
    } finally {
      setSaving(false)
    }
  }

  /** Tapping meal n sets the count to n+1, or back to n if it was already on. */
  const tapMeal = (i: number) => {
    const next = meals === i + 1 ? i : i + 1
    setMeals(next)
    save(next, workoutDone, steps)
  }

  const done = meals >= 3 && workoutDone && steps !== null

  return (
    <section className="px-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[11px] font-medium uppercase" style={{ color: "#7e8a9e", letterSpacing: "0.10em" }}>
          Today
        </span>
        <span className="text-[11px]" style={{ color: done ? TEAL : "#5a6578" }}>
          {done ? "All three done" : "Three taps"}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* 1 — DIET */}
        <Row Icon={UtensilsCrossed} title="Ate to plan" note={`${meals} of 3 meals`} on={meals >= 3}>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {MEALS.map((m, i) => {
              const on = i < meals
              return (
                <button
                  key={m}
                  onClick={() => tapMeal(i)}
                  disabled={saving}
                  aria-pressed={on}
                  className="h-11 rounded-xl text-[12px] font-medium transition-all active:scale-[0.97] disabled:opacity-60"
                  style={{
                    background: on ? "rgba(45,212,191,0.14)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${on ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.07)"}`,
                    color: on ? "#e8eaf0" : "#7e8a9e",
                  }}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </Row>

        {/* 2 — WORKOUT */}
        <button
          onClick={() => {
            const v = !workoutDone
            setWorkoutDone(v)
            save(meals, v, steps)
          }}
          disabled={saving}
          aria-pressed={workoutDone}
          className="w-full p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] disabled:opacity-60"
          style={{
            background: workoutDone ? "rgba(45,212,191,0.10)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${workoutDone ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <span className="inline-flex items-center gap-3">
            <Dumbbell size={19} style={{ color: workoutDone ? TEAL : "#7e8a9e" }} />
            <span className="text-left">
              <span className="block text-[15px] font-medium" style={{ color: "#e8eaf0" }}>
                Did today&apos;s exercises
              </span>
              <span className="block text-[11px] mt-0.5" style={{ color: "#7e8a9e" }}>
                About 20 minutes
              </span>
            </span>
          </span>
          <Tick on={workoutDone} />
        </button>

        {/* 3 — STEPS */}
        <Row
          Icon={Footprints}
          title="Steps today"
          note={steps === null ? "Not logged" : (STEPS.find((s) => s.mid === steps)?.label ?? `${steps}`)}
          on={steps !== null}
        >
          <div className="grid grid-cols-5 gap-1.5 mt-3">
            {STEPS.map((s) => {
              const on = steps === s.mid
              return (
                <button
                  key={s.mid}
                  onClick={() => {
                    const v = on ? null : s.mid
                    setSteps(v)
                    save(meals, workoutDone, v)
                  }}
                  disabled={saving}
                  aria-pressed={on}
                  className="h-11 rounded-xl text-[11px] font-medium transition-all active:scale-[0.97] disabled:opacity-60"
                  style={{
                    background: on ? "rgba(45,212,191,0.14)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${on ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.07)"}`,
                    color: on ? "#e8eaf0" : "#7e8a9e",
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
        </Row>
      </div>

      <div className="flex items-center justify-between min-h-[18px] mt-3 px-1">
        {error ? (
          <p className="text-xs" style={{ color: "#fb7185" }}>{error}</p>
        ) : (
          <span className="text-[11px]" style={{ color: "#5a6578" }}>Tap again to undo.</span>
        )}
        {saving ? (
          <Loader2 size={13} className="animate-spin" style={{ color: "#7e8a9e" }} />
        ) : saved ? (
          <span className="text-[11px] inline-flex items-center gap-1" style={{ color: TEAL }}>
            <Check size={12} /> Saved
          </span>
        ) : null}
      </div>
    </section>
  )
}

function Tick({ on }: { on: boolean }) {
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
      style={{ background: on ? TEAL : "rgba(255,255,255,0.08)" }}
    >
      {on && <Check size={15} style={{ color: "#06231f" }} />}
    </span>
  )
}

function Row({
  Icon,
  title,
  note,
  on,
  children,
}: {
  Icon: typeof Dumbbell
  title: string
  note: string
  on: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="p-4 rounded-2xl"
      style={{
        background: on ? "rgba(45,212,191,0.10)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${on ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-3">
          <Icon size={19} style={{ color: on ? TEAL : "#7e8a9e" }} />
          <span className="text-left">
            <span className="block text-[15px] font-medium" style={{ color: "#e8eaf0" }}>{title}</span>
            <span className="block text-[11px] mt-0.5" style={{ color: "#7e8a9e" }}>{note}</span>
          </span>
        </span>
        <Tick on={on} />
      </div>
      {children}
    </div>
  )
}
