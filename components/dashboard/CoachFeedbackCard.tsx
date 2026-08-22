"use client"

import { motion } from "framer-motion"
import { MessageSquare } from "lucide-react"

export interface CoachFeedbackItem {
  id: string
  weekNumber: number | null
  body: string
  createdAt: string
}

export function CoachFeedbackCard({ feedback }: { feedback: CoachFeedbackItem[] }) {
  // Render nothing if there's no feedback yet — never a fake placeholder.
  if (!feedback || feedback.length === 0) return null

  return (
    <motion.section
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className="text-[11px] font-medium uppercase block mb-4"
        style={{ color: "#8b867c", letterSpacing: "0.10em" }}
      >
        Your Coach&apos;s Notes
      </span>

      <div className="space-y-3">
        {feedback.map((f) => (
          <div
            key={f.id}
            className="p-5 rounded-2xl"
            style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: "#155e56" }}>
                <MessageSquare size={14} />
                {f.weekNumber ? `Week ${f.weekNumber} feedback` : "Coach feedback"}
              </span>
              <span className="text-[11px]" style={{ color: "#8b867c" }}>
                {new Date(f.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#3c3a34" }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
