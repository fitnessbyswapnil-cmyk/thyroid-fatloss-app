"use client"

import { motion } from "framer-motion"
import { Apple, Dumbbell, FileText, Sparkles, Video } from "lucide-react"
import type { Plan, PlanType } from "@/app/actions/plans"

const META: Record<PlanType, { label: string; icon: typeof Apple; tint: string }> = {
  meal: { label: "Meal Plan", icon: Apple, tint: "#2dd4bf" },
  workout: { label: "Workout Plan", icon: Dumbbell, tint: "#34d399" },
}

export function PlanCard({ type, plan }: { type: PlanType; plan: Plan | null }) {
  const meta = META[type]
  const Icon = meta.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(45, 212, 191, 0.12)" }}
          >
            <Icon size={20} style={{ color: meta.tint }} />
          </div>
          <div>
            <h3
              className="text-xl"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}
            >
              {plan?.title || meta.label}
            </h3>
            {plan && (
              <p className="text-xs" style={{ color: "#7e8a9e" }}>
                Updated {new Date(plan.updated_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {!plan ? (
          <div className="flex flex-col items-center text-center py-8 gap-3">
            <Sparkles size={28} style={{ color: "#404858" }} />
            <p className="text-sm" style={{ color: "#7e8a9e" }}>
              Your coach is preparing your plan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Structured workout items (built from the coach's exercise library) */}
            {(plan.content?.workoutItems?.length ?? 0) > 0 && (
              <div className="space-y-2">
                {plan.content.workoutItems!.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    {it.day && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase shrink-0" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}>
                        {it.day}
                      </span>
                    )}
                    <span className="flex-1 text-sm" style={{ color: "#e8eaf0" }}>{it.name}</span>
                    {(it.sets || it.reps) && (
                      <span className="text-xs tabular-nums shrink-0" style={{ color: "#7e8a9e" }}>
                        {it.sets ? `${it.sets} × ` : ""}{it.reps || ""}
                      </span>
                    )}
                    {it.videoUrl && (
                      <a href={it.videoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0" style={{ color: "#2dd4bf" }} aria-label={`Video: ${it.name}`}>
                        <Video size={15} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Structured meal items (built from the coach's food library) */}
            {(plan.content?.mealItems?.length ?? 0) > 0 && (
              <div className="space-y-2">
                {plan.content.mealItems!.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    {it.meal && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase shrink-0" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}>
                        {it.meal}
                      </span>
                    )}
                    <span className="flex-1 text-sm" style={{ color: "#e8eaf0" }}>
                      {it.name}
                      <span className="text-xs ml-1.5" style={{ color: "#7e8a9e" }}>
                        {it.qty && it.qty !== 1 ? `${it.qty} × ` : ""}{it.portion}
                      </span>
                    </span>
                    {it.calories != null && (
                      <span className="text-xs tabular-nums shrink-0" style={{ color: "#7e8a9e" }}>
                        {Math.round((it.calories || 0) * (it.qty || 1))} kcal
                      </span>
                    )}
                  </div>
                ))}
                {(() => {
                  const t = plan.content.mealItems!.reduce(
                    (acc, m) => {
                      const q = m.qty || 1
                      return {
                        kcal: acc.kcal + (m.calories || 0) * q,
                        p: acc.p + (Number(m.protein) || 0) * q,
                      }
                    },
                    { kcal: 0, p: 0 }
                  )
                  return t.kcal > 0 ? (
                    <p className="text-right text-xs tabular-nums pr-1" style={{ color: "#2dd4bf" }}>
                      Day total ≈ {Math.round(t.kcal)} kcal · {t.p.toFixed(0)}g protein
                    </p>
                  ) : null
                })()}
              </div>
            )}

            {plan.content?.sections?.length > 0 ? (
              plan.content.sections.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <h4 className="text-sm font-semibold mb-1" style={{ color: "#e8eaf0" }}>
                      {section.heading}
                    </h4>
                  )}
                  {section.body && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c9cdd5" }}>
                      {section.body}
                    </p>
                  )}
                </div>
              ))
            ) : (
              !plan.file_path &&
              !(plan.content?.workoutItems?.length || plan.content?.mealItems?.length) && (
                <p className="text-sm" style={{ color: "#7e8a9e" }}>
                  Your coach is preparing your plan.
                </p>
              )
            )}

            {plan.file_path && (
              <a
                href={`/api/file?pathname=${encodeURIComponent(plan.file_path)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium mt-2"
                style={{ background: "rgba(45, 212, 191, 0.12)", color: "#2dd4bf" }}
              >
                <FileText size={16} />
                Open attached PDF
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
