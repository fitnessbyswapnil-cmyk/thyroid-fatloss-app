"use client"

/**
 * Minimal dependency-free SVG line chart for coach-side trends.
 * Renders nothing meaningful with <2 points — callers show an honest
 * "not enough data" state instead.
 */
export function TrendChart({
  points,
  color = "#155e56",
  height = 120,
  unit = "",
}: {
  points: Array<{ label: string; value: number }>
  color?: string
  height?: number
  unit?: string
}) {
  const W = 560
  const H = height
  const PAD = { top: 14, right: 12, bottom: 22, left: 34 }

  if (points.length < 2) return null

  const vals = points.map((p) => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / (points.length - 1)
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * (H - PAD.top - PAD.bottom)

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ")
  const area = `${path} L${x(points.length - 1).toFixed(1)},${H - PAD.bottom} L${PAD.left},${H - PAD.bottom} Z`

  // Show at most ~6 x labels to avoid crowding
  const step = Math.max(1, Math.ceil(points.length / 6))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* min/max gridlines + labels */}
      {[min, max].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#e2dbcd" strokeDasharray="3 4" />
          <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#8b867c" className="tabular-nums">
            {Number.isInteger(v) ? v : v.toFixed(1)}{unit}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="2.5" fill={color} />
          {i % step === 0 && (
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#a09a8e">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
