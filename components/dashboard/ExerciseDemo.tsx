"use client"

import { useEffect, useRef, useState } from "react"
import { Dumbbell } from "lucide-react"

/**
 * Animated exercise demo. Given two frames (start + end position) it cross-fades
 * between them on a loop to show the movement — an owned, dependency-free
 * alternative to a hosted GIF. Falls back to a single image, then an icon.
 * Pauses when off-screen and respects prefers-reduced-motion.
 */
export function ExerciseDemo({
  demo,
  start,
  end,
  alt,
  size = 64,
  rounded = 14,
  interval = 900,
}: {
  demo?: string | null   // animated GIF/MP4 — takes priority when present
  start?: string | null
  end?: string | null
  alt?: string
  size?: number
  rounded?: number
  interval?: number
}) {
  const frames = [start, end].filter(Boolean) as string[]
  const [i, setI] = useState(0)
  const [inView, setInView] = useState(true)
  const [demoBroken, setDemoBroken] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // A real animated GIF loops natively — no crossfade needed, and it reads far
  // clearer than two stills. Prefer it whenever a demo URL exists, but if it
  // fails to load (e.g. not cached yet) fall back to the photo frames below.
  if (demo && !demoBroken) {
    return (
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: size, height: size, borderRadius: rounded, background: "#fff" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={demo}
          alt={alt || "exercise demo"}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setDemoBroken(true)}
        />
      </div>
    )
  }

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (frames.length < 2 || !inView) return
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const t = setInterval(() => setI((v) => (v + 1) % frames.length), interval)
    return () => clearInterval(t)
  }, [frames.length, inView, interval])

  return (
    <div
      ref={ref}
      className="relative shrink-0 overflow-hidden"
      style={{ width: size, height: size, borderRadius: rounded, background: "#f4f0e8" }}
    >
      {frames.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          <Dumbbell size={size * 0.4} style={{ color: "#cfc7b6" }} />
        </div>
      ) : (
        frames.map((src, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={idx === 0 ? alt || "exercise demo" : ""}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: idx === i ? 1 : 0, transition: "opacity .35s ease", background: "#fff" }}
          />
        ))
      )}
    </div>
  )
}
