"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Camera, ChevronRight } from "lucide-react"

export interface PhotoSet {
  id: string
  week_number: number | null
  upload_date: string
  front_photo: string | null
  side_photo: string | null
  back_photo: string | null
  /** Weight recorded in the check-in closest to this photo set, if any. */
  weight?: number | null
}

type Pose = "front" | "side" | "back"
const POSES: { key: Pose; label: string; field: keyof PhotoSet }[] = [
  { key: "front", label: "Front", field: "front_photo" },
  { key: "side", label: "Side", field: "side_photo" },
  { key: "back", label: "Back", field: "back_photo" },
]

const src = (p: string) => `/api/file?pathname=${encodeURIComponent(p)}`
const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })

/**
 * Before/after comparison — the single most persuasive screen in transformation
 * coaching, and the one thing a list of uploaded photos can never do.
 *
 * Defaults to the widest possible span (first vs latest) because that's the
 * comparison that shows the most change; the client can narrow it from there.
 */
export function PhotoCompare({ sets }: { sets: PhotoSet[] }) {
  // Oldest first, so index 0 is genuinely "before".
  const ordered = [...sets].sort((a, b) => a.upload_date.localeCompare(b.upload_date))
  const [pose, setPose] = useState<Pose>("front")
  const [leftIdx, setLeftIdx] = useState(0)
  const [rightIdx, setRightIdx] = useState(Math.max(0, ordered.length - 1))

  const field = POSES.find((p) => p.key === pose)!.field
  // Only offer dates that actually have this pose — otherwise the client picks
  // a date and gets an empty frame with no explanation.
  const available = ordered.filter((s) => s[field])

  if (ordered.length < 2) {
    return (
      <Shell>
        <div className="rounded-3xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.12)" }}>
          <Camera size={30} style={{ color: "#404858" }} className="mx-auto" />
          <p className="text-sm font-semibold mt-4" style={{ color: "#e8eaf0" }}>
            {ordered.length === 0 ? "No photos yet" : "One set so far"}
          </p>
          <p className="text-[12.5px] mt-2 mx-auto" style={{ color: "#7e8a9e", lineHeight: 1.55, maxWidth: 280 }}>
            Add a second set a few weeks apart and this becomes your before-and-after.
            Same pose, same light, same time of day works best.
          </p>
          <Link href="/dashboard/progress-photos" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mt-5" style={{ color: "#2dd4bf" }}>
            Add photos <ChevronRight size={14} />
          </Link>
        </div>
      </Shell>
    )
  }

  const left = available[Math.min(leftIdx, available.length - 1)]
  const right = available[Math.min(rightIdx, available.length - 1)]
  const daysApart =
    left && right
      ? Math.abs(Math.round((new Date(right.upload_date).getTime() - new Date(left.upload_date).getTime()) / 86400000))
      : 0
  const weightDelta =
    left?.weight != null && right?.weight != null ? +(right.weight - left.weight).toFixed(1) : null

  return (
    <Shell>
      {/* Pose selector */}
      <div className="flex gap-1.5 p-1 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {POSES.map((p) => {
          const active = pose === p.key
          const count = ordered.filter((s) => s[p.field]).length
          return (
            <button
              key={p.key}
              onClick={() => { setPose(p.key); setLeftIdx(0); setRightIdx(Math.max(0, count - 1)) }}
              disabled={count === 0}
              className="flex-1 py-2 rounded-full text-[12.5px] font-semibold transition-colors"
              style={
                active
                  ? { background: "#2dd4bf", color: "#04121a" }
                  : { color: count === 0 ? "#404858" : "#a9b2c1" }
              }
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {available.length < 2 ? (
        <p className="text-sm text-center py-10" style={{ color: "#7e8a9e" }}>
          Not enough {pose} photos yet — add another set to compare.
        </p>
      ) : (
        <>
          {/* The comparison */}
          <div className="grid grid-cols-2 gap-2.5">
            {[left, right].map((s, i) => (
              <div key={i}>
                <div
                  className="relative w-full overflow-hidden rounded-2xl"
                  style={{ aspectRatio: "3 / 4", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src(s[field] as string)} alt={`${pose} ${i === 0 ? "before" : "after"}`} className="w-full h-full object-cover" />
                  <span
                    className="absolute top-2 left-2 text-[9.5px] font-bold uppercase rounded-full px-2 py-1"
                    style={{ background: "rgba(4,8,14,0.6)", color: i === 0 ? "#a9b2c1" : "#2dd4bf", backdropFilter: "blur(4px)", letterSpacing: "0.06em" }}
                  >
                    {i === 0 ? "Before" : "Now"}
                  </span>
                </div>
                <p className="text-[11.5px] font-semibold mt-2 text-center" style={{ color: "#e8eaf0" }}>{fmt(s.upload_date)}</p>
                <p className="text-[10.5px] text-center" style={{ color: "#5a6578" }}>
                  {s.week_number ? `Week ${s.week_number}` : ""}{s.weight != null ? ` · ${s.weight} kg` : ""}
                </p>
              </div>
            ))}
          </div>

          {/* The delta line — the sentence she screenshots */}
          <div className="mt-4 p-4 rounded-2xl text-center" style={{ background: "rgba(45,212,191,0.07)", border: "1px solid rgba(45,212,191,0.2)" }}>
            <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontSize: 22, color: "#e8eaf0" }}>
              {daysApart} days apart
            </p>
            {weightDelta !== null && (
              <p className="text-[12.5px] mt-1" style={{ color: weightDelta < 0 ? "#34d399" : "#a9b2c1" }}>
                {weightDelta < 0 ? `${Math.abs(weightDelta)} kg down` : weightDelta > 0 ? `${weightDelta} kg up` : "Weight steady"}
                {weightDelta >= 0 && " — look at the photos, not just the number"}
              </p>
            )}
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            {([["Before", leftIdx, setLeftIdx], ["Now", rightIdx, setRightIdx]] as const).map(([label, val, setter]) => (
              <div key={label}>
                <label className="block text-[10px] uppercase mb-1.5 font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.1em" }}>{label}</label>
                <select
                  value={Math.min(val, available.length - 1)}
                  onChange={(e) => setter(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl text-[12.5px] focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" }}
                >
                  {available.map((s, i) => (
                    <option key={s.id} value={i}>{fmt(s.upload_date)}{s.week_number ? ` · Wk ${s.week_number}` : ""}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-center mt-5" style={{ color: "#5a6578", lineHeight: 1.5 }}>
            Private to you and your coach. Nothing is shared unless you choose to.
          </p>
        </>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative" style={{ background: "#090c14", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}>
      <div className="tw-glow" style={{ position: "fixed", top: -150, left: 20, width: 340, height: 300, zIndex: 0 }} />
      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(9,12,20,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard/progress" className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>Before &amp; After</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-6 relative" style={{ zIndex: 1 }}>{children}</main>
    </div>
  )
}
