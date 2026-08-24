"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Image as ImageIcon, Loader2, Check, Send, Zap, Moon, Brain, TrendingDown, Scale } from "lucide-react"
import { submitPhotoReview } from "@/app/actions/photo-review"

interface Photo {
  id: string
  front_photo: string | null
  side_photo: string | null
  back_photo: string | null
  week_number: number | null
  upload_date: string
}
interface Checkin {
  week_number: number
  weight: number | null
  energy_level: number | null
  sleep_score: number | null
  stress_level: number | null
  mood: number | null
  submitted_at: string
}
type Pose = "front" | "side" | "back"
const POSE_FIELD: Record<Pose, keyof Photo> = { front: "front_photo", side: "side_photo", back: "back_photo" }

function fileUrl(pathname: string | null) {
  return pathname ? `/api/file?pathname=${encodeURIComponent(pathname)}` : null
}

function nearestCheckin(checkins: Checkin[], date: string): Checkin | null {
  if (!checkins.length) return null
  const t = new Date(date).getTime()
  return checkins
    .slice()
    .sort((a, b) => Math.abs(new Date(a.submitted_at).getTime() - t) - Math.abs(new Date(b.submitted_at).getTime() - t))[0]
}

export function PhotoComparison({ clientId, photos, checkins }: { clientId: string; photos: Photo[]; checkins: Checkin[] }) {
  const router = useRouter()
  const sessions = useMemo(
    () => photos.slice().sort((a, b) => new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime()),
    [photos]
  )

  const [pose, setPose] = useState<Pose>("front")
  const [leftId, setLeftId] = useState(sessions[0]?.id || "")
  const [rightId, setRightId] = useState(sessions[sessions.length - 1]?.id || "")
  const [slider, setSlider] = useState(50)
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const left = sessions.find((s) => s.id === leftId) || null
  const right = sessions.find((s) => s.id === rightId) || null
  const leftImg = fileUrl((left?.[POSE_FIELD[pose]] as string | null) ?? null)
  const rightImg = fileUrl((right?.[POSE_FIELD[pose]] as string | null) ?? null)

  const label = (s: Photo | null) =>
    s ? `${s.week_number ? `Week ${s.week_number}` : ""} · ${new Date(s.upload_date).toLocaleDateString()}`.trim() : "—"

  // Non-scale-victory deltas between the check-ins nearest each photo date.
  const deltas = useMemo(() => {
    if (!left || !right) return null
    const a = nearestCheckin(checkins, left.upload_date)
    const b = nearestCheckin(checkins, right.upload_date)
    if (!a || !b) return null
    const d = (x: number | null, y: number | null) => (x != null && y != null ? y - x : null)
    return {
      energy: d(a.energy_level, b.energy_level),
      sleep: d(a.sleep_score, b.sleep_score),
      mood: d(a.mood, b.mood),
      stress: d(a.stress_level, b.stress_level), // lower is better
      weight: d(a.weight, b.weight), // lower is better
    }
  }, [left, right, checkins])

  if (sessions.length < 2) {
    return (
      <div className="p-6 rounded-2xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <ImageIcon size={32} className="mx-auto mb-3" style={{ color: "#404858" }} />
        <p className="text-sm" style={{ color: "#7e8a9e" }}>
          Need at least two photo sessions to compare.
        </p>
      </div>
    )
  }

  const handleSubmit = async () => {
    setSending(true)
    setError(null)
    const result = await submitPhotoReview({
      clientId,
      comparisonLabel: `${label(left)} → ${label(right)} (${pose})`,
      afterDate: right?.upload_date || new Date().toISOString(),
      body,
    })
    setSending(false)
    if (result.success) {
      setBody("")
      setSent(true)
      setTimeout(() => setSent(false), 2500)
      router.refresh()
    } else {
      setError(result.error || "Failed to submit")
    }
  }

  const selectStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" } as const
  const chip = (labelText: string, value: number | null, goodWhenNegative = false, Icon: typeof Zap, unit = "") => {
    if (value == null) return null
    const improved = goodWhenNegative ? value < 0 : value > 0
    const neutral = value === 0
    const color = neutral ? "#7e8a9e" : improved ? "#2dd4bf" : "#fb7185"
    const sign = value > 0 ? "+" : ""
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Icon size={14} style={{ color }} />
        <span className="text-xs" style={{ color: "#7e8a9e" }}>{labelText}</span>
        <span className="text-sm font-semibold" style={{ color }}>{sign}{value}{unit}</span>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl space-y-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>Before / After Comparison</h3>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase mb-1.5" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Before</label>
          <select value={leftId} onChange={(e) => setLeftId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={selectStyle}>
            {sessions.map((s) => <option key={s.id} value={s.id}>{label(s)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase mb-1.5" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>After</label>
          <select value={rightId} onChange={(e) => setRightId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={selectStyle}>
            {sessions.map((s) => <option key={s.id} value={s.id}>{label(s)}</option>)}
          </select>
        </div>
      </div>

      {/* Pose toggle */}
      <div className="flex items-center gap-2">
        {(["front", "side", "back"] as Pose[]).map((p) => (
          <button
            key={p}
            onClick={() => setPose(p)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={{ background: pose === p ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.04)", color: pose === p ? "#2dd4bf" : "#7e8a9e" }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Slider comparison */}
      <div className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl overflow-hidden select-none" style={{ background: "rgba(255,255,255,0.04)" }}>
        {leftImg ? (
          <img src={leftImg} alt="before" decoding="async" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><ImageIcon size={28} style={{ color: "#404858" }} /></div>
        )}
        {/* "after" image at full size, revealed from the left via clip-path so it never squishes */}
        {rightImg ? (
          <img
            src={rightImg}
            alt="after"
            // Both slider halves stay eager — the drag reveals the "after" image
            // progressively, so it has to already be decoded when she starts dragging.
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: "rgba(9,12,20,0.6)", clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
            <ImageIcon size={28} style={{ color: "#404858" }} />
          </div>
        )}
        {/* divider line */}
        <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `${slider}%`, width: 2, background: "#2dd4bf", boxShadow: "0 0 12px rgba(45,212,191,0.6)" }} />
        <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(9,12,20,0.7)", color: "#7e8a9e" }}>Before</span>
        <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(9,12,20,0.7)", color: "#2dd4bf" }}>After</span>
        <input
          type="range" min={0} max={100} value={slider}
          onChange={(e) => setSlider(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          aria-label="Comparison slider"
        />
      </div>

      {/* Non-scale-victory deltas */}
      {deltas && (
        <div>
          <p className="text-xs uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Changes between these dates</p>
          <div className="flex flex-wrap gap-2">
            {chip("Energy", deltas.energy, false, Zap, "/10")}
            {chip("Sleep", deltas.sleep, false, Moon, "/10")}
            {chip("Mood", deltas.mood, false, Brain, "/10")}
            {chip("Stress", deltas.stress, true, TrendingDown, "/10")}
            {chip("Weight", deltas.weight, true, Scale, " kg")}
            {!deltas.energy && !deltas.sleep && !deltas.mood && deltas.stress == null && deltas.weight == null && (
              <span className="text-xs" style={{ color: "#7e8a9e" }}>No nearby check-in data.</span>
            )}
          </div>
        </div>
      )}

      {/* Coach feedback */}
      <div>
        <label className="block text-xs uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Feedback on this comparison</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Tell them what you see — the visible changes they can't feel day to day…"
          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
          style={selectStyle}
        />
        {error && <p className="text-xs mt-2" style={{ color: "#fb7185" }}>{error}</p>}
        <motion.button
          onClick={handleSubmit}
          disabled={sending || !body.trim()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full mt-3 h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14", opacity: !body.trim() ? 0.5 : 1 }}
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : sent ? <><Check size={18} /> Sent to client</> : <><Send size={18} /> Send Feedback</>}
        </motion.button>
      </div>
    </div>
  )
}
