"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Dumbbell, Video } from "lucide-react"
import type { WorkoutItem } from "@/app/actions/plans"

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
      style={{ background: "rgba(4, 8, 14, 0.82)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "#0d111b", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
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
            <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <Dumbbell size={64} style={{ color: "#404858" }} />
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
              style={{ background: "rgba(4,8,14,0.6)", color: "#2dd4bf", backdropFilter: "blur(4px)" }}
            >
              ● Looping demo
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl leading-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>
              {item.name}
            </h3>
            {(item.sets || item.reps) && (
              <span className="shrink-0 px-3 py-1 rounded-lg text-sm tabular-nums font-medium" style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}>
                {item.sets ? `${item.sets} × ` : ""}{item.reps || ""}
              </span>
            )}
          </div>

          {item.notes && (
            <div className="mb-4">
              <p className="text-[11px] uppercase mb-1.5" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>How to do it</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c9cdd5" }}>{item.notes}</p>
            </div>
          )}

          {item.videoUrl && (
            <a
              href={item.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}
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
