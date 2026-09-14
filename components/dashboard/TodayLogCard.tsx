"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, UtensilsCrossed, Dumbbell, Footprints } from "lucide-react"
import { setExercisesDone, setMealEaten, setSteps } from "@/app/actions/daily-log"

// Local date (IST-safe): en-CA gives YYYY-MM-DD
const localDate = () => new Date().toLocaleDateString("en-CA")

const MEALS = ["Breakfast", "Lunch", "Dinner"] as const

/**
 * Step buckets rather than a number pad.
 *
 * She reads a rough figure off her phone's step counter once a day; asking her
 * to type "6,432" invites the keyboard, and the keyboard is what stops a log
 * being filled in at 10pm. The stored value is the middle of the band, so a
 * month of taps still averages honestly.
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
 * The whole day in three rows: meals, exercises, steps. Everything is a tap.
 *
 * Each tap writes to the table that owns the fact — a meal to meal_logs, the
 * exercises to exercise_logs, steps to the daily log — so a meal ticked here
 * and a meal ticked in Food are the same row, and this card always shows what
 * was saved from anywhere.
 */
export function TodayLogCard({
  initialMealsDone,
  initialWorkoutDone,
  initialSteps,
  hasExercises = true,
  heading = "Today",
}: {
  initialMealsDone: string[]
  initialWorkoutDone: boolean
  initialSteps: number | null
  hasExercises?: boolean
  heading?: string
}) {
  const router = useRouter()
  const [meals, setMeals] = useState<string[]>(initialMealsDone ?? [])
  const [workoutDone, setWorkoutDone] = useState(initialWorkoutDone)
  const [steps, setStepsState] = useState<number | null>(initialSteps)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Run one save, and put the control back if it did not land. A tick that
   * survives a failed write tells her the day is logged while the coach's view
   * says it is not.
   */
  const run = async (apply: () => void, revert: () => void, write: () => Promise<{ success: boolean; error?: string }>) => {
    apply()
    setSaving(true)
    setError(null)
    try {
      const res = await write()
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

  const tapMeal = (m: string) => {
    const was = meals
    const on = !was.includes(m)
    run(
      () => setMeals(on ? [...was, m] : was.filter((x) => x !== m)),
      () => setMeals(was),
      () => setMealEaten(localDate(), m, on)
    )
  }

  const tapWorkout = () => {
    const was = workoutDone
    run(() => setWorkoutDone(!was), () => setWorkoutDone(was), () => setExercisesDone(localDate(), !was))
  }

  const tapSteps = (mid: number) => {
    const was = steps
    const next = was === mid ? null : mid
    run(() => setStepsState(next), () => setStepsState(was), () => setSteps(localDate(), next))
  }

  const mealCount = MEALS.filter((m) => meals.includes(m)).length
  const done = mealCount >= 3 && (workoutDone || !hasExercises) && steps !== null

  return (
    <section className="px-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[11px] font-medium uppercase" style={{ color: "#7e8a9e", letterSpacing: "0.10em" }}>{heading}</span>
        <span className="text-[11px]" style={{ color: done ? TEAL : "#5a6578" }}>
          {done ? "All three done — well done" : "Tap each one you did"}
        </span>
      </div>

      <div className="space-y-2.5">
        {/* 1 — MEALS */}
        <Row Icon={UtensilsCrossed} title="Ate to plan" note={`${mealCount} of 3 meals`} on={mealCount >= 3}>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {MEALS.map((m) => {
              const on = meals.includes(m)
              return (
                <button
                  key={m}
                  onClick={() => tapMeal(m)}
                  disabled={saving}
                  aria-pressed={on}
                  className="h-11 rounded-xl text-[12px] font-medium transition-all active:scale-[0.97] disabled:opacity-60 inline-flex items-center justify-center gap-1"
                  style={{
                    background: on ? "rgba(45,212,191,0.14)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${on ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.07)"}`,
                    color: on ? "#e8eaf0" : "#7e8a9e",
                  }}
                >
                  {on && <Check size={12} style={{ color: TEAL }} />} {m}
                </button>
              )
            })}
          </div>
        </Row>

        {/* 2 — EXERCISES */}
        {hasExercises ? (
          <button
            onClick={tapWorkout}
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
                <span className="block text-[15px] font-medium" style={{ color: "#e8eaf0" }}>Did today&apos;s exercises</span>
                <span className="block text-[11px] mt-0.5" style={{ color: "#7e8a9e" }}>About 20 minutes</span>
              </span>
            </span>
            <Tick on={workoutDone} />
          </button>
        ) : (
          <div className="w-full p-4 rounded-2xl flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Dumbbell size={19} style={{ color: "#5a6578" }} />
            <span className="text-[13px]" style={{ color: "#7e8a9e" }}>Rest day — no exercises to tick</span>
          </div>
        )}

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
                  onClick={() => tapSteps(s.mid)}
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
    <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: on ? TEAL : "rgba(255,255,255,0.08)" }}>
      {on && <Check size={15} style={{ color: "#06231f" }} />}
    </span>
  )
}

function Row({ Icon, title, note, on, children }: { Icon: typeof Dumbbell; title: string; note: string; on: boolean; children: React.ReactNode }) {
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
