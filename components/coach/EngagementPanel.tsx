"use client"

import { useState } from "react"
import { ChevronDown, Activity } from "lucide-react"
import type { EngagementSignal, SignalState } from "@/lib/coach/engagement"

/**
 * Whether this client is actually using the app.
 *
 * Deliberately shows the never-started and the gone-quiet cases differently:
 * one is a setup problem you can fix in a message, the other is someone
 * drifting away. A single "inactive" state would hide the difference.
 */

const TONE: Record<SignalState, { dot: string; text: string; label: string }> = {
  active: { dot: "#155e56", text: "#5a564e", label: "on track" },
  stale: { dot: "#97671b", text: "#5a564e", label: "gone quiet" },
  never: { dot: "#a09a8e", text: "#8b867c", label: "not started" },
}

export function EngagementPanel({
  signals,
  active,
  total,
  neverStarted,
  clientName,
}: {
  signals: EngagementSignal[]
  active: number
  total: number
  neverStarted: boolean
  clientName?: string | null
}) {
  const [open, setOpen] = useState(true)
  const needsAttention = signals.filter((s) => s.state !== "active")
  const firstName = (clientName || "").trim().split(" ")[0] || "She"

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-5 text-left"
        aria-expanded={open}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(21, 94, 86,0.12)" }}
        >
          <Activity size={18} style={{ color: "#155e56" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg leading-tight"
            style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", color: "#1c1d20" }}
          >
            App engagement
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#8b867c" }}>
            {neverStarted
              ? "Nothing used yet"
              : `${active} of ${total} signals on track`}
          </p>
        </div>

        {/* At-a-glance strip — state reads from position and colour together,
            so it is scannable without opening the panel. */}
        <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
          {signals.map((s) => (
            <span
              key={s.key}
              className="rounded-full"
              style={{ width: 6, height: 6, background: TONE[s.state].dot, opacity: s.state === "never" ? 0.55 : 1 }}
            />
          ))}
        </div>

        <ChevronDown
          size={16}
          className="shrink-0 transition-transform"
          style={{ color: "#a09a8e", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div className="px-5 pb-5">
          {neverStarted && (
            <div
              className="mb-3 px-3.5 py-3 rounded-xl"
              style={{ background: "rgba(151, 103, 27,0.07)", border: "1px solid rgba(151, 103, 27,0.2)" }}
            >
              <p className="text-[12.5px]" style={{ color: "#1c1d20", lineHeight: 1.55 }}>
                {firstName} has an account but hasn&rsquo;t used anything in it yet.
              </p>
              <p className="text-[11.5px] mt-1" style={{ color: "#5a564e", lineHeight: 1.5 }}>
                That&rsquo;s usually a walkthrough problem rather than a motivation one — most
                people never find the logging screens on their own.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            {signals.map((s) => {
              const tone = TONE[s.state]
              return (
                <div
                  key={s.key}
                  className="px-3.5 py-3 rounded-xl"
                  style={{ background: "#fdfbf7", border: "1px solid #f4f0e8" }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="rounded-full shrink-0"
                      style={{ width: 7, height: 7, background: tone.dot }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-[13.5px] font-medium" style={{ color: "#1c1d20" }}>
                      {s.label}
                    </span>
                    <span className="text-[12px] tabular-nums shrink-0" style={{ color: tone.text }}>
                      {s.detail}
                    </span>
                    <span className="sr-only">{tone.label}</span>
                  </div>
                  {s.hint && (
                    <p className="text-[11.5px] mt-1.5 ml-[17px]" style={{ color: "#8b867c", lineHeight: 1.5 }}>
                      {s.hint}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {needsAttention.length === 0 && (
            <p className="text-[11.5px] mt-3 px-1" style={{ color: "#a09a8e", lineHeight: 1.5 }}>
              Every signal is current. Nothing needs chasing.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
