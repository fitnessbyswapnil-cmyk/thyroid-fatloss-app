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

  const showDemo = Boolean(demo) && !demoBroken

  // Both effects must run on every render. They used to sit BELOW an early
  // return for the GIF branch, so the first time a demo image 404'd — the
  // fallback path this component exists for — the hook count changed between
  // renders and React threw, taking the whole plan page down with it.
  // 353 exercises carry a demo URL and one is cached, so that was the common
  // path, not the rare one. ExerciseViewer.tsx already had the correct shape.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (showDemo || frames.length < 2 || !inView) return
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const t = setInterval(() => setI((v) => (v + 1) % frames.length), interval)
    return () => clearInterval(t)
  }, [showDemo, frames.length, inView, interval])

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

  return (
    <div
      ref={ref}
      className="relative shrink-0 overflow-hidden"
      style={{ width: size, height: size, borderRadius: rounded, background: "rgba(255,255,255,0.05)" }}
    >
      {frames.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          <Dumbbell size={size * 0.4} style={{ color: "#404858" }} />
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
