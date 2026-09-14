"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, CheckCircle2 } from "lucide-react"
import type { PendingReview } from "@/app/actions/coach-reviews"
import type { WorkFilter, WorkKind, WorkRow } from "@/lib/coach/worklist"
import { CheckInReviewScreen } from "@/components/coach/CheckInReviewScreen"

const TONE: Record<WorkKind, { color: string; label: string }> = {
  reply: { color: "#2dd4bf", label: "Reply" },
  lab: { color: "#fb7185", label: "Lab" },
  review: { color: "#818cf8", label: "Review" },
  report: { color: "#f59e0b", label: "Report" },
  plan: { color: "#f59e0b", label: "Plan" },
  attention: { color: "#f59e0b", label: "Check" },
  quiet: { color: "#a9b2c1", label: "Quiet" },
  never: { color: "#a9b2c1", label: "Not started" },
  win: { color: "#34d399", label: "Win" },
}

const FILTERS: { key: WorkFilter; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "reply", label: "Replies" },
  { key: "review", label: "Reviews & reports" },
  { key: "quiet", label: "Gone quiet" },
  { key: "never", label: "Not started" },
]

/**
 * The coach's one list. Each row names why it is there; the check-in review
 * opens on top of the list and closing it puts her back where she was.
 */
export function Worklist({ rows, reviews }: { rows: WorkRow[]; reviews: PendingReview[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<WorkFilter>("all")
  const [reviewing, setReviewing] = useState<PendingReview | null>(null)
  const shown = useMemo(() => rows.filter((r) => r.filters.includes(filter)), [rows, filter])
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, rows.filter((r) => r.filters.includes(f.key)).length])), [rows])

  useEffect(() => {
    if (!reviewing) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [reviewing])

  return (
    <section>
      {reviewing && (
        <div className="fixed inset-0 z-[100]" style={{ background: "#090c14" }} role="dialog" aria-modal="true" aria-label={`Review ${reviewing.client_name}`}>
          <div className="max-w-2xl mx-auto h-full">
            <CheckInReviewScreen review={reviewing} onClose={() => { setReviewing(null); router.refresh() }} />
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-semibold" style={{ color: "#e8eaf0" }}>Needs you today</h2>
        <span className="text-xs tabular-nums" style={{ color: "#7e8a9e" }}>{rows.length} client{rows.length === 1 ? "" : "s"}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="shrink-0 h-8 px-3 rounded-full text-xs font-medium"
            style={filter === f.key
              ? { background: "rgba(45,212,191,0.15)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" }
              : { background: "rgba(255,255,255,0.04)", color: "#a9b2c1", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {f.label} <span className="tabular-nums opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="p-6 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <CheckCircle2 size={22} className="mx-auto" style={{ color: "#34d399" }} />
          <p className="text-sm mt-2" style={{ color: "#e8eaf0" }}>Nothing here right now.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((row) => {
            const tone = TONE[row.top.kind]
            const review = row.top.reviewId ? reviews.find((r) => r.id === row.top.reviewId) : undefined
            const body = (
              <>
                <span className="shrink-0 text-[9.5px] font-bold uppercase rounded-full px-2 py-1 mt-0.5 w-[74px] text-center" style={{ color: tone.color, background: `${tone.color}1f`, letterSpacing: "0.05em" }}>
                  {tone.label}
                </span>
                <span className="flex-1 min-w-0 text-left">
                  <span className="block text-sm" style={{ color: "#e8eaf0" }}>
                    <b className="font-semibold">{row.clientName}</b> — {row.top.text}
                  </span>
                  {row.others.length > 0 && (
                    <span className="block text-[11.5px] mt-0.5" style={{ color: "#7e8a9e" }}>
                      Also: {row.others.map((o) => o.text).join(" · ")}
                    </span>
                  )}
                </span>
                <ChevronRight size={16} className="shrink-0 mt-1" style={{ color: tone.color }} />
              </>
            )
            const style = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }
            return (
              <li key={row.clientId}>
                {review ? (
                  <button onClick={() => setReviewing(review)} className="w-full flex items-start gap-3 p-3.5 rounded-2xl" style={style}>{body}</button>
                ) : (
                  <Link href={row.top.href} className="flex items-start gap-3 p-3.5 rounded-2xl" style={style}>{body}</Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
