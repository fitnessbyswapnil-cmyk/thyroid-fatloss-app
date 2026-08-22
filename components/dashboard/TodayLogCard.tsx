"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Dumbbell, UtensilsCrossed, Check, Loader2, Minus, Plus } from "lucide-react"
import { saveDailyLog } from "@/app/actions/daily-log"

// Local date (IST-safe): en-CA gives YYYY-MM-DD
const localDate = () => new Date().toLocaleDateString("en-CA")

export function TodayLogCard({ initialWorkoutDone, initialMealsFollowed }: { initialWorkoutDone: boolean; initialMealsFollowed: number }) {
  const router = useRouter()
  const [workoutDone, setWorkoutDone] = useState(initialWorkoutDone)
  const [meals, setMeals] = useState(initialMealsFollowed)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (nextWorkout: boolean, nextMeals: number) => {
    setSaving(true); setError(null)
    const res = await saveDailyLog({ date: localDate(), workoutDone: nextWorkout, mealsFollowed: nextMeals })
    setSaving(false)
    if (res.success) {
      setSaved(true); setTimeout(() => setSaved(false), 1500)
      router.refresh()
    } else setError(res.error || "Couldn't save")
  }

  return (
    <motion.section
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="text-[11px] font-medium uppercase block mb-4" style={{ color: "#8b867c", letterSpacing: "0.10em" }}>
        Today&apos;s Log
      </span>

      <div className="p-5 rounded-[22px] space-y-4" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
        {/* Workout toggle */}
        <button
          onClick={() => { const v = !workoutDone; setWorkoutDone(v); save(v, meals) }}
          disabled={saving}
          className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
          style={{
            background: workoutDone ? "rgba(21, 94, 86,0.12)" : "#ffffff",
            border: `1px solid ${workoutDone ? "rgba(21, 94, 86,0.3)" : "#e2dbcd"}`,
          }}
        >
          <span className="inline-flex items-center gap-3 text-sm font-medium" style={{ color: "#1c1d20" }}>
            <Dumbbell size={18} style={{ color: workoutDone ? "#155e56" : "#8b867c" }} />
            Workout done today
          </span>
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: workoutDone ? "#155e56" : "#e2dbcd" }}
          >
            {workoutDone && <Check size={14} style={{ color: "#fdfbf7" }} />}
          </span>
        </button>

        {/* Meals-on-plan stepper */}
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
          <span className="inline-flex items-center gap-3 text-sm font-medium" style={{ color: "#1c1d20" }}>
            <UtensilsCrossed size={18} style={{ color: meals > 0 ? "#155e56" : "#8b867c" }} />
            Meals on plan
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { const v = Math.max(0, meals - 1); setMeals(v); save(workoutDone, v) }}
              disabled={saving || meals <= 0}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#e2dbcd", color: "#1c1d20" }}
              aria-label="Decrease meals"
            >
              <Minus size={14} />
            </button>
            <span className="text-lg font-semibold tabular-nums w-6 text-center" style={{ color: "#1c1d20" }}>{meals}</span>
            <button
              onClick={() => { const v = Math.min(10, meals + 1); setMeals(v); save(workoutDone, v) }}
              disabled={saving || meals >= 10}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(21, 94, 86,0.15)", color: "#155e56" }}
              aria-label="Increase meals"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between min-h-[16px]">
          {error ? (
            <p className="text-xs" style={{ color: "#9a3b2e" }}>{error}</p>
          ) : (
            <span className="text-[11px]" style={{ color: "#a09a8e" }}>Logging daily keeps your streak alive.</span>
          )}
          {saving ? (
            <Loader2 size={13} className="animate-spin" style={{ color: "#8b867c" }} />
          ) : saved ? (
            <span className="text-[11px] inline-flex items-center gap-1" style={{ color: "#155e56" }}><Check size={12} /> Saved</span>
          ) : null}
        </div>
      </div>
    </motion.section>
  )
}
