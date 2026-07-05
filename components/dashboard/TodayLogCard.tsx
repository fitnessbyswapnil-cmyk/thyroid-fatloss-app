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
      <span className="text-[11px] font-medium uppercase block mb-4" style={{ color: "#7e8a9e", letterSpacing: "0.10em" }}>
        Today&apos;s Log
      </span>

      <div className="p-5 rounded-[22px] space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Workout toggle */}
        <button
          onClick={() => { const v = !workoutDone; setWorkoutDone(v); save(v, meals) }}
          disabled={saving}
          className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
          style={{
            background: workoutDone ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${workoutDone ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <span className="inline-flex items-center gap-3 text-sm font-medium" style={{ color: "#e8eaf0" }}>
            <Dumbbell size={18} style={{ color: workoutDone ? "#2dd4bf" : "#7e8a9e" }} />
            Workout done today
          </span>
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: workoutDone ? "#2dd4bf" : "rgba(255,255,255,0.08)" }}
          >
            {workoutDone && <Check size={14} style={{ color: "#090c14" }} />}
          </span>
        </button>

        {/* Meals-on-plan stepper */}
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="inline-flex items-center gap-3 text-sm font-medium" style={{ color: "#e8eaf0" }}>
            <UtensilsCrossed size={18} style={{ color: meals > 0 ? "#2dd4bf" : "#7e8a9e" }} />
            Meals on plan
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { const v = Math.max(0, meals - 1); setMeals(v); save(workoutDone, v) }}
              disabled={saving || meals <= 0}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", color: "#e8eaf0" }}
              aria-label="Decrease meals"
            >
              <Minus size={14} />
            </button>
            <span className="text-lg font-semibold tabular-nums w-6 text-center" style={{ color: "#e8eaf0" }}>{meals}</span>
            <button
              onClick={() => { const v = Math.min(10, meals + 1); setMeals(v); save(workoutDone, v) }}
              disabled={saving || meals >= 10}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}
              aria-label="Increase meals"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between min-h-[16px]">
          {error ? (
            <p className="text-xs" style={{ color: "#fb7185" }}>{error}</p>
          ) : (
            <span className="text-[11px]" style={{ color: "#5a6578" }}>Logging daily keeps your streak alive.</span>
          )}
          {saving ? (
            <Loader2 size={13} className="animate-spin" style={{ color: "#7e8a9e" }} />
          ) : saved ? (
            <span className="text-[11px] inline-flex items-center gap-1" style={{ color: "#2dd4bf" }}><Check size={12} /> Saved</span>
          ) : null}
        </div>
      </div>
    </motion.section>
  )
}
