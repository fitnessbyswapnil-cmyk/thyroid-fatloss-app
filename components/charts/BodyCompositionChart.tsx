"use client"

import { SITES, siteChanges, totalCmLost, type Measurements } from "@/lib/health/measurements"

/**
 * Every body site on one chart, because the useful question is comparative:
 * where is it actually coming off? Seven separate trend lines answer that
 * only if you hold all seven in your head at once, which nobody does.
 *
 * Bars all start from the same edge and encode magnitude in length, so sites
 * compare by eye. Direction is carried by colour and a glyph rather than by
 * geometry — a diverging axis reads as "left is bad" and a client losing
 * centimetres everywhere would see all her bars point the wrong way.
 *
 * Before a second measurement exists there is no change to draw, so it shows
 * the current figures instead of an empty frame.
 */

const LOSS = "#2dd4bf"
const GAIN = "#e0a53a"
const FLAT = "#7e8a9e"

export function BodyCompositionChart({ rows }: { rows: Measurements[] }) {
  const changes = siteChanges(rows)
  const hasTrend = changes.length > 0

  // --- Baseline state: one measurement recorded, nothing to compare yet. ---
  if (!hasTrend) {
    const latest = [...rows].reverse().find((r) => SITES.some((s) => typeof r[s.key] === "number"))
    const current = latest
      ? SITES.map((s) => ({ ...s, value: latest[s.key] })).filter(
          (s): s is typeof s & { value: number } => typeof s.value === "number"
        )
      : []

    if (current.length === 0) {
      return (
        <p className="text-[12.5px] py-6 text-center" style={{ color: "#7e8a9e", lineHeight: 1.55 }}>
          Add measurements in your weekly check-in and they&rsquo;ll all appear here together.
        </p>
      )
    }

    const max = Math.max(...current.map((c) => c.value))
    return (
      <div>
        <p className="text-[12.5px] mb-4" style={{ color: "#a9b2c1", lineHeight: 1.55 }}>
          Your starting numbers. Measure again next week and this becomes a comparison of where
          you&rsquo;re losing.
        </p>
        <div className="flex flex-col gap-2.5">
          {current.map((c) => (
            <MetricBar key={c.key} label={c.label} pct={max > 0 ? (c.value / max) * 100 : 0} color={FLAT} tone="rgba(255,255,255,0.06)">
              <span className="tabular-nums text-[12.5px]" style={{ color: "#e8eaf0" }}>{c.value} cm</span>
            </MetricBar>
          ))}
        </div>
      </div>
    )
  }

  // --- Comparison state. Biggest mover first: that is the finding. ---
  const ordered = [...changes].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  const max = Math.max(...ordered.map((c) => Math.abs(c.delta)))
  const lost = totalCmLost(rows)
  const down = ordered.filter((c) => c.delta < 0)

  return (
    <div>
      {lost > 0 ? (
        <div className="mb-5">
          <p
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: "italic",
              fontSize: 34,
              lineHeight: 1.05,
              color: "#e8eaf0",
              textShadow: "0 0 34px rgba(45,212,191,0.28)",
            }}
          >
            {lost} cm off
          </p>
          <p className="text-[12.5px] mt-1" style={{ color: "#a9b2c1", lineHeight: 1.5 }}>
            across {down.length} {down.length === 1 ? "site" : "sites"} — progress the scale can hide.
          </p>
        </div>
      ) : (
        <p className="text-[12.5px] mb-4" style={{ color: "#a9b2c1", lineHeight: 1.55 }}>
          Nothing down yet. Circumference often moves before weight does, so keep measuring.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {ordered.map((c) => {
          const better = c.delta < 0
          const flat = c.delta === 0
          const color = flat ? FLAT : better ? LOSS : GAIN
          return (
            <MetricBar
              key={c.key}
              label={c.label}
              pct={max > 0 ? (Math.abs(c.delta) / max) * 100 : 0}
              color={color}
              tone={`${color}22`}
            >
              <span className="tabular-nums text-[11px]" style={{ color: "#5a6578" }}>
                {c.first}→{c.latest}
              </span>
              <span
                className="tabular-nums text-[12.5px] font-semibold"
                style={{ color, minWidth: 62, textAlign: "right" }}
              >
                {flat ? "no change" : `${better ? "↓" : "↑"} ${Math.abs(c.delta)} cm`}
              </span>
            </MetricBar>
          )
        })}
      </div>

      <p className="text-[11px] mt-4" style={{ color: "#5a6578", lineHeight: 1.5 }}>
        Bar length is how much each site moved, longest first. Measured from your first recorded
        figure to your most recent.
      </p>
    </div>
  )
}

/** One labelled bar. Shared so the wellbeing view reads in the same visual language. */
export function MetricBar({
  label,
  pct,
  color,
  tone,
  children,
}: {
  label: string
  pct: number
  color: string
  tone: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12.5px] shrink-0" style={{ color: "#c9cdd5", width: 52 }}>
        {label}
      </span>

      <div className="flex-1 h-[26px] rounded-lg relative overflow-hidden" style={{ background: "rgba(255,255,255,0.035)" }}>
        <div
          className="h-full rounded-lg"
          style={{
            width: `${Math.max(pct, 3)}%`,
            background: `linear-gradient(90deg, ${tone} 0%, ${color} 100%)`,
            boxShadow: `0 0 18px ${color}33`,
            transition: "width 600ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      <div className="flex items-center gap-2.5 shrink-0 justify-end">{children}</div>
    </div>
  )
}
