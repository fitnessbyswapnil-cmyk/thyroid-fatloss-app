"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Dumbbell, Video } from "lucide-react"
import type { WorkoutItem } from "@/app/actions/plans"
import { SetLogger } from "@/components/dashboard/SetLogger"

/**
 * Full-screen exercise viewer. Opened when a client taps an exercise in their
 * plan — plays the demo large (cross-fading start/end frames) with the sets ×
 * reps and the coach's form cues, so the movement is easy to understand.
 */
export function ExerciseViewer({ item, onClose }: { item: WorkoutItem; onClose: () => void }) {
  const frames = [item.imageStart, item.imageEnd].filter(Boolean) as string[]
  const [i, setI] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [demoBroken, setDemoBroken] = useState(false)
  const showDemo = !!item.demoUrl && !demoBroken

  useEffect(() => setMounted(true), [])

  // Loop the frames (respect reduced-motion)
  useEffect(() => {
    if (frames.length < 2) return
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const t = setInterval(() => setI((v) => (v + 1) % frames.length), 850)
    return () => clearInterval(t)
  }, [frames.length])

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(28, 29, 32, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "#ffffff", border: "1px solid #cfc7b6", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          <X size={18} />
        </button>

        {/* Big demo */}
        <div className="relative w-full" style={{ aspectRatio: "1 / 1", background: "#fff" }}>
          {showDemo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.demoUrl}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-contain"
              onError={() => setDemoBroken(true)}
            />
          ) : frames.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "#f4f0e8" }}>
              <Dumbbell size={64} style={{ color: "#cfc7b6" }} />
            </div>
          ) : (
            frames.map((src, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={idx === 0 ? item.name : ""}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ opacity: idx === i ? 1 : 0, transition: "opacity .4s ease" }}
              />
            ))
          )}
          {(showDemo || frames.length >= 2) && (
            <span
              className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{ background: "rgba(28, 29, 32, 0.45)", color: "#155e56", backdropFilter: "blur(4px)" }}
            >
              ● Looping demo
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <h3 className="text-[26px] leading-tight" style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", color: "#1c1d20" }}>
              {item.name}
            </h3>
            {item.day && (
              <span className="text-[10px] font-semibold rounded-full px-2.5 py-1 shrink-0" style={{ background: "#f4f0e8", color: "#5a564e" }}>
                {item.day}
              </span>
            )}
          </div>

          {/* Prototype stat tiles */}
          {(item.sets || item.reps) && (
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="rounded-2xl p-3 text-center" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
                <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 22, color: "#1c1d20" }}>{item.sets ?? "—"}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#8b867c" }}>sets</p>
              </div>
              <div className="rounded-2xl p-3 text-center" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
                <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 22, color: "#1c1d20" }}>{item.reps ?? "—"}</p>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#8b867c" }}>reps</p>
              </div>
            </div>
          )}

          {/* Form cues as a checklist (prototype style) */}
          {item.notes && (
            <div className="mb-4">
              <p className="text-[10.5px] uppercase font-semibold mb-2.5" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>Form cues</p>
              <div className="flex flex-col gap-2">
                {item.notes
                  .split(/(?<=[.!?])\s+/)
                  .map((c) => c.trim())
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((cue, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
                      <span className="w-[19px] h-[19px] rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(21, 94, 86,0.12)" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24"><path d="M4.5 12.5l5 5L19.5 7" style={{ fill: "none", stroke: "#155e56", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} /></svg>
                      </span>
                      <p className="text-[12.5px]" style={{ color: "#5a564e", lineHeight: 1.45 }}>{cue}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Set logging lives here, where she's already looking to do the
              movement — not on a separate screen she'd have to remember. */}
          <SetLogger
            exerciseName={item.name}
            exerciseId={item.exerciseId ?? null}
            plannedSets={item.sets}
            plannedReps={item.reps}
          />

          {item.videoUrl && (
            <a
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(21, 94, 86,0.12)", color: "#155e56" }}
            >
              <Video size={16} /> Watch full video
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
