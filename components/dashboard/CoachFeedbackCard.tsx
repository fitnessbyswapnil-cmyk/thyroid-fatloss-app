"use client"

import { useRef } from "react"
import { motion } from "framer-motion"
import { MessageSquare } from "lucide-react"
import { markFeedbackRead } from "@/app/actions/coach-reviews"

export interface CoachFeedbackItem {
  id: string
  weekNumber: number | null
  body: string
  createdAt: string
  /**
   * Already-stamped receipt, when the caller selected it. Absent means "not
   * known here", not "unread" — the stamp call then decides, and the server
   * only writes rows that are still null.
   */
  readAt?: string | null
}

export function CoachFeedbackCard({ feedback }: { feedback: CoachFeedbackItem[] }) {
  const stamped = useRef(false)

  // Render nothing if there's no feedback yet — never a fake placeholder.
  if (!feedback || feedback.length === 0) return null

  // The receipt means the note was on her screen, so it is stamped when the
  // section scrolls into view rather than when the page mounts — this card sits
  // well below the fold, and "delivered" is not the question the coach is
  // asking. Fire and forget: a failed stamp must never disturb her dashboard.
  const stampRead = () => {
    if (stamped.current) return
    const unread = feedback.filter((f) => !f.readAt).map((f) => f.id)
    if (unread.length === 0) return
    stamped.current = true
    // The action swallows its own errors, but the call itself can still reject
    // on a dropped connection — and an unhandled rejection here would surface as
    // an error on a dashboard where nothing has actually gone wrong for her.
    void markFeedbackRead(unread).catch(() => {})
  }

  return (
    <motion.section
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      onViewportEnter={stampRead}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className="text-[11px] font-medium uppercase block mb-4"
        style={{ color: "#7e8a9e", letterSpacing: "0.10em" }}
      >
        Your Coach&apos;s Notes
      </span>

      <div className="space-y-3">
        {feedback.map((f) => (
          <div
            key={f.id}
            className="p-5 rounded-2xl"
            style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-2 text-[12px]" style={{ color: "#2dd4bf" }}>
                <MessageSquare size={14} />
                {f.weekNumber ? `Week ${f.weekNumber} feedback` : "Coach feedback"}
              </span>
              <span className="text-[11px]" style={{ color: "#7e8a9e" }}>
                {new Date(f.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c9cdd5" }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
