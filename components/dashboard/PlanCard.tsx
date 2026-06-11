"use client"

import { motion } from "framer-motion"
import { Apple, Dumbbell, FileText, Sparkles } from "lucide-react"
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
              !plan.file_path && (
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
