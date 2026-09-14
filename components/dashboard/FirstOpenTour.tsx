"use client"

import { useEffect, useState } from "react"
import { UtensilsCrossed, Dumbbell, CheckCircle2 } from "lucide-react"

const KEY = "thyrowell.tour.v2"

const SCREENS = [
  {
    Icon: UtensilsCrossed,
    title: "Today shows the one thing to do now",
    body: "In the morning it is your next meal, in the afternoon your movement, at night your three taps. Everything else for the day is right below it.",
  },
  {
    Icon: Dumbbell,
    title: "Tap a meal or your movement to open it",
    body: "A meal opens its recipe, grams and swaps. Movement opens your walk and exercises — tap Start and the app takes you through them one at a time.",
  },
  {
    Icon: CheckCircle2,
    title: "Three tabs, that is all",
    body: "Today for your day. Progress for your weight, photos and reports. Coach to message Swapnil. Your account is the round icon at the top.",
  },
]

/**
 * Three screens, first open only.
 *
 * Nothing in the app is complicated, but a new client cannot know that until
 * she has found the three things that matter. This tells her where they are
 * once, then stays out of the way. Stored per phone; a reinstall shows it again,
 * which is fine.
 */
export function FirstOpenTour() {
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setOpen(true)
    } catch {}
  }, [])

  const finish = () => {
    try {
      window.localStorage.setItem(KEY, String(Date.now()))
    } catch {}
    setOpen(false)
  }

  if (!open) return null
  const s = SCREENS[i]
  const last = i === SCREENS.length - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How this app works"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4"
      style={{ background: "rgba(5,7,12,0.82)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: "#0f131d", border: "1px solid rgba(255,255,255,0.08)", marginBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex gap-1.5 mb-6">
          {SCREENS.map((_, k) => (
            <span key={k} className="h-1 rounded-full flex-1" style={{ background: k <= i ? "#2dd4bf" : "rgba(255,255,255,0.10)" }} />
          ))}
        </div>

        <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(45,212,191,0.14)" }}>
          <s.Icon size={22} style={{ color: "#2dd4bf" }} />
        </span>
        <h2 className="mt-4 text-[20px] font-semibold" style={{ color: "#e8eaf0", lineHeight: 1.3 }}>
          {s.title}
        </h2>
        <p className="mt-2 text-[14px]" style={{ color: "#a9b2c1", lineHeight: 1.6 }}>
          {s.body}
        </p>

        <button
          onClick={() => (last ? finish() : setI(i + 1))}
          className="mt-6 w-full h-12 rounded-full font-bold text-sm"
          style={{ background: "#2dd4bf", color: "#06231f" }}
        >
          {last ? "Got it, show me today" : "Next"}
        </button>
        {!last && (
          <button onClick={finish} className="mt-2 w-full h-10 text-[13px]" style={{ color: "#7e8a9e" }}>
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
