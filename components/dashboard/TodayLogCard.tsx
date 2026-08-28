"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Dumbbell, Footprints, Check, Loader2, Sunrise, Sun, Moon } from "lucide-react"
import { saveDailyLog } from "@/app/actions/daily-log"

// Local date (IST-safe): en-CA gives YYYY-MM-DD
const localDate = () => new Date().toLocaleDateString("en-CA")

const MEALS = [
  { key: "b", label: "Breakfast", Icon: Sunrise },
  { key: "l", label: "Lunch", Icon: Sun },
  { key: "d", label: "Dinner", Icon: Moon },
] as const

/**
 * The whole day in five taps: three meals, the session, the walk.
 *
 * Everything here is a tap. There is no number to type, no stepper to nudge and
 * no notes box, because the clients this is built for log on a phone at 10pm
 * and anything that needs the keyboard simply does not get filled in.
 *
 * Meals are three separate ticks rather than one "diet followed" toggle: the
 * count is what a coach can act on. Two of three, every day, is a plan that
 * needs its dinner changed, and a single yes/no would hide that.
 */
export function TodayLogCard({
  initialWorkoutDone,
  initialWalkDone,
  initialMealsFollowed,
}: {
  initialWorkoutDone: boolean
  initialWalkDone: boolean
  initialMealsFollowed: number
}) {
  const router = useRouter()
  // meals_followed is a count, so the first N chips light up. Which specific
  // meals were eaten is not stored, and the UI must not pretend otherwise.
  const [meals, setMeals] = useState(initialMealsFollowed)
  const [workoutDone, setWorkoutDone] = useState(initialWorkoutDone)
  const [walkDone, setWalkDone] = useState(initialWalkDone)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Save, and put every control back if it did not land.
   *
   * A tick that stays on after a failed write is worse than no tick at all: she
   * believes the day is logged, and the coach's adherence view disagrees with
   * her screen. The catch matters as much as the branch — on mobile data a
   * thrown transport error used to skip setSaving(false) and leave the whole
   * card disabled until reload.
   */
  const save = async (nextMeals: number, nextWorkout: boolean, nextWalk: boolean) => {
    const prev = { meals, workoutDone, walkDone }
    const revert = () => {
      setMeals(prev.meals)
      setWorkoutDone(prev.workoutDone)
      setWalkDone(prev.walkDone)
    }

    setSaving(true)
    setError(null)
    try {
      const res = await saveDailyLog({
        date: localDate(),
        workoutDone: nextWorkout,
        walkDone: nextWalk,
        mealsFollowed: nextMeals,
      })
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
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
    save(next, workoutDone, walkDone)
  }

  const done = meals >= 3 && workoutDone && walkDone

  return (
    <motion.section
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-[11px] font-medium uppercase" style={{ color: "#7e8a9e", letterSpacing: "0.10em" }}>
          Today&apos;s Log
        </span>
        <span className="text-[11px]" style={{ color: done ? "#2dd4bf" : "#5a6578" }}>
          {done ? "All done today" : "Just tap what you did"}
        </span>
      </div>

      <div
        className="p-5 rounded-[22px] space-y-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Meals — three taps, no counter to nudge */}
        <div
          className="p-4 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "#e8eaf0" }}>
              Meals on plan
            </span>
            <span className="text-[11px] tabular-nums" style={{ color: meals > 0 ? "#2dd4bf" : "#5a6578" }}>
              {meals} of 3
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MEALS.map((m, i) => {
              const on = i < meals
              return (
                <button
                  key={m.key}
                  onClick={() => tapMeal(i)}
                  disabled={saving}
                  aria-pressed={on}
                  aria-label={`${m.label} on plan`}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-[0.97] disabled:opacity-60"
                  style={{
                    background: on ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${on ? "rgba(45,212,191,0.35)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <m.Icon size={17} style={{ color: on ? "#2dd4bf" : "#7e8a9e" }} />
                  <span className="text-[11px] font-medium" style={{ color: on ? "#e8eaf0" : "#7e8a9e" }}>
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <BigToggle
          Icon={Dumbbell}
          label="Today's exercises"
          hint="The session for today"
          on={workoutDone}
          disabled={saving}
          onTap={() => {
            const v = !workoutDone
            setWorkoutDone(v)
            save(meals, v, walkDone)
          }}
        />

        <BigToggle
          Icon={Footprints}
          label="30 minute walk"
          hint="All at once or split — both count"
          on={walkDone}
          disabled={saving}
          onTap={() => {
            const v = !walkDone
            setWalkDone(v)
            save(meals, workoutDone, v)
          }}
        />

        <div className="flex items-center justify-between min-h-[16px] pt-1">
          {error ? (
            <p className="text-xs" style={{ color: "#fb7185" }}>
              {error}
            </p>
          ) : (
            <span className="text-[11px]" style={{ color: "#5a6578" }}>
              Tap again to undo.
            </span>
          )}
          {saving ? (
            <Loader2 size={13} className="animate-spin" style={{ color: "#7e8a9e" }} />
          ) : saved ? (
            <span className="text-[11px] inline-flex items-center gap-1" style={{ color: "#2dd4bf" }}>
              <Check size={12} /> Saved
            </span>
          ) : null}
        </div>
      </div>
    </motion.section>
  )
}

function BigToggle({
  Icon,
  label,
  hint,
  on,
  disabled,
  onTap,
}: {
  Icon: typeof Dumbbell
  label: string
  hint: string
  on: boolean
  disabled: boolean
  onTap: () => void
}) {
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      aria-pressed={on}
      className="w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.99] disabled:opacity-60"
      style={{
        background: on ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${on ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <span className="inline-flex items-center gap-3 text-left">
        <Icon size={18} style={{ color: on ? "#2dd4bf" : "#7e8a9e" }} />
        <span>
          <span className="block text-sm font-medium" style={{ color: "#e8eaf0" }}>
            {label}
          </span>
          <span className="block text-[11px] mt-0.5" style={{ color: "#7e8a9e" }}>
            {hint}
          </span>
        </span>
      </span>
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: on ? "#2dd4bf" : "rgba(255,255,255,0.08)" }}
      >
        {on && <Check size={14} style={{ color: "#090c14" }} />}
      </span>
    </button>
  )
}
