"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft, Send, Scale, Activity, Moon, Brain,
  TrendingDown, Calendar, Clock, Zap, Heart,
  MessageSquare, Image, Loader2, Check,
  LayoutDashboard, LineChart, ClipboardList, Camera, Apple, Lightbulb
} from "lucide-react"
import { PlanEditor } from "@/components/coach/PlanEditor"
import { PhotoComparison } from "@/components/coach/PhotoComparison"
import { TrendChart } from "@/components/coach/TrendChart"
import type { Plan } from "@/app/actions/plans"

interface Client {
  id: string
  full_name: string
  email: string
  phone: string | null
  age: number | null
  gender: string | null
  current_weight: number | null
  start_weight: number | null
  target_weight: number | null
  thyroid_condition: string | null
  medications: string | null
  allergies: string | null
  plan_type: string
  start_date: string | null
  streak_current: number | null
  streak_best: number | null
  recovery_score: number | null
  wellness_score: number | null
  tsh_before: number | null
  tsh_current: number | null
  coach_notes: string | null
  subscription_status: string
}

interface Checkin {
  id: string
  week_number: number
  weight: number | null
  energy_level: number | null
  sleep_score: number | null
  stress_level: number | null
  mood: number | null
  adherence_score: number | null
  notes: string | null
  coach_feedback: string | null
  submitted_at: string
}

interface Photo {
  id: string
  front_photo: string | null
  side_photo: string | null
  back_photo: string | null
  week_number: number | null
  upload_date: string
}

interface Insight {
  id: string
  insight: string
  is_read: boolean
  created_at: string
}


export function ClientDetailView({
  client,
  checkins,
  photos,
  insights,
  mealPlan,
  workoutPlan,
  coachId,
}: {
  client: Client
  checkins: Checkin[]
  photos: Photo[]
  insights: Insight[]
  mealPlan: Plan | null
  workoutPlan: Plan | null
  coachId: string
}) {
  const router = useRouter()
  const [newInsight, setNewInsight] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "checkins" | "photos" | "plans" | "insights">("overview")

  // Ascending series for trend charts (checkins arrive week DESC)
  const asc = checkins.slice().reverse()
  const weightSeries = asc.filter((c) => c.weight != null).map((c) => ({ label: `W${c.week_number}`, value: Number(c.weight) }))
  const energySeries = asc.filter((c) => c.energy_level != null).map((c) => ({ label: `W${c.week_number}`, value: Number(c.energy_level) }))
  const sleepSeries = asc.filter((c) => c.sleep_score != null).map((c) => ({ label: `W${c.week_number}`, value: Number(c.sleep_score) }))

  const weightLost = client.start_weight && client.current_weight
    ? (client.start_weight - client.current_weight).toFixed(1)
    : "0"

  const tshImprovement = client.tsh_before && client.tsh_current
    ? Math.round(((client.tsh_before - client.tsh_current) / client.tsh_before) * 100)
    : 0

  const programWeek = client.start_date
    ? Math.ceil((Date.now() - new Date(client.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 1

  const handleSendInsight = async () => {
    if (!newInsight.trim()) return
    setIsSending(true)

    const supabase = createClient()
    const { error } = await supabase
      .from("coach_insights")
      .insert({
        client_id: client.id,
        coach_id: coachId,
        insight: newInsight,
      })

    if (!error) {
      setNewInsight("")
      router.refresh()
    }
    setIsSending(false)
  }

  return (
    <div className="min-h-screen" style={{ background: "#090c14" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "rgba(9, 12, 20, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/coach" className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}>
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-medium"
                style={{
                  background: "linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(34, 197, 94, 0.2) 100%)",
                  color: "#2dd4bf"
                }}
              >
                {client.full_name?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="font-semibold" style={{ color: "#e8eaf0" }}>
                  {client.full_name}
                </h1>
                <p className="text-xs" style={{ color: "#7e8a9e" }}>
                  Week {programWeek} · {client.plan_type} plan
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/coach/client/${client.id}/messages`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
              style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.25)" }}
            >
              <MessageSquare size={13} /> Chat
            </Link>
            <Link
              href={`/coach/client/${client.id}/health`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
              style={{ background: "rgba(45,212,191,0.12)", color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.25)" }}
            >
              <Activity size={13} /> Health &amp; Labs
            </Link>
            <span
              className="px-3 py-1 rounded-lg text-xs font-medium"
              style={{
                background: client.subscription_status === "active"
                  ? "rgba(45, 212, 191, 0.15)"
                  : "rgba(245, 158, 11, 0.15)",
                color: client.subscription_status === "active" ? "#2dd4bf" : "#f59e0b",
              }}
            >
              {client.subscription_status}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="px-6 py-3 border-b sticky top-[72px] z-40"
        style={{
          background: "rgba(9, 12, 20, 0.95)",
          borderColor: "rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {([
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "trends", label: "Trends", icon: LineChart },
            { id: "checkins", label: "Check-ins", icon: ClipboardList },
            { id: "photos", label: "Photos", icon: Camera },
            { id: "plans", label: "Plans", icon: Apple },
            { id: "insights", label: "Insights", icon: Lightbulb },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 transition-all"
              style={{
                background: activeTab === tab.id ? "rgba(45, 212, 191, 0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeTab === tab.id ? "rgba(45,212,191,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: activeTab === tab.id ? "#2dd4bf" : "#7e8a9e",
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Current Weight", value: `${client.current_weight || "-"} kg`, icon: Scale, delta: `-${weightLost} kg`, color: "#2dd4bf" },
                { label: "TSH Level", value: client.tsh_current || "-", icon: Activity, delta: tshImprovement > 0 ? `-${tshImprovement}%` : null, color: "#34d399" },
                { label: "Recovery Score", value: `${client.recovery_score || 0}%`, icon: Heart, delta: null, color: "#fb7185" },
                { label: "Current Streak", value: `${client.streak_current || 0} days`, icon: Zap, delta: `Best: ${client.streak_best || 0}`, color: "#f59e0b" },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="p-5 rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <metric.icon size={16} style={{ color: metric.color }} />
                    <span className="text-xs" style={{ color: "#7e8a9e" }}>{metric.label}</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "#e8eaf0" }}>
                    {metric.value}
                  </div>
                  {metric.delta && (
                    <div className="text-xs mt-1" style={{ color: "#2dd4bf" }}>
                      {metric.delta}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Client Info */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: "#e8eaf0" }}>Client Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Email", value: client.email },
                  { label: "Phone", value: client.phone || "-" },
                  { label: "Age", value: client.age ? `${client.age} years` : "-" },
                  { label: "Gender", value: client.gender || "-" },
                  { label: "Start Date", value: client.start_date ? new Date(client.start_date).toLocaleDateString() : "-" },
                  { label: "Target Weight", value: client.target_weight ? `${client.target_weight} kg` : "-" },
                  { label: "Thyroid Condition", value: client.thyroid_condition || "-" },
                  { label: "Medications", value: client.medications || "-" },
                  { label: "Allergies", value: client.allergies || "None" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-xs uppercase mb-1" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                      {item.label}
                    </div>
                    <div className="text-sm" style={{ color: "#e8eaf0" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Send Insight */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
                <MessageSquare size={16} style={{ color: "#2dd4bf" }} />
                Send Insight
              </h3>
              <div className="flex gap-3">
                <textarea
                  value={newInsight}
                  onChange={(e) => setNewInsight(e.target.value)}
                  placeholder="Write personalized feedback or encouragement..."
                  rows={3}
                  className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#e8eaf0",
                  }}
                />
                <motion.button
                  onClick={handleSendInsight}
                  disabled={isSending || !newInsight.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 rounded-xl self-end"
                  style={{
                    background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                    color: "#0a0d14",
                    opacity: !newInsight.trim() ? 0.5 : 1,
                    height: 44,
                  }}
                >
                  {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <div className="space-y-5">
            {[
              { title: "Weight (kg)", series: weightSeries, color: "#2dd4bf", unit: "" },
              { title: "Energy (/10)", series: energySeries, color: "#f59e0b", unit: "" },
              { title: "Sleep (/10)", series: sleepSeries, color: "#34d399", unit: "" },
            ].map((chart) => (
              <div
                key={chart.title}
                className="p-5 rounded-2xl"
                style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#e8eaf0" }}>{chart.title}</h3>
                {chart.series.length >= 2 ? (
                  <TrendChart points={chart.series} color={chart.color} unit={chart.unit} />
                ) : (
                  <p className="text-xs py-4" style={{ color: "#7e8a9e" }}>
                    Not enough check-in data yet — needs at least 2 entries.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "checkins" && (
          <div className="space-y-4">
            {checkins.length === 0 ? (
              <div className="text-center py-12" style={{ color: "#7e8a9e" }}>
                <Clock size={40} className="mx-auto mb-4" style={{ color: "#404858" }} />
                <p>No check-ins yet</p>
              </div>
            ) : (
              checkins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="p-5 rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="px-3 py-1 rounded-lg text-sm font-medium"
                        style={{ background: "rgba(45, 212, 191, 0.15)", color: "#2dd4bf" }}
                      >
                        Week {checkin.week_number}
                      </span>
                      <span className="text-xs" style={{ color: "#7e8a9e" }}>
                        {new Date(checkin.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                    {checkin.adherence_score && (
                      <span className="text-sm font-medium" style={{ color: "#2dd4bf" }}>
                        {checkin.adherence_score}% adherence
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "Weight", value: checkin.weight ? `${checkin.weight} kg` : "-", icon: Scale },
                      { label: "Energy", value: checkin.energy_level ? `${checkin.energy_level}/10` : "-", icon: Zap },
                      { label: "Sleep", value: checkin.sleep_score ? `${checkin.sleep_score}/10` : "-", icon: Moon },
                      { label: "Stress", value: checkin.stress_level ? `${checkin.stress_level}/10` : "-", icon: TrendingDown },
                      { label: "Mood", value: checkin.mood ? `${checkin.mood}/10` : "-", icon: Brain },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <item.icon size={14} style={{ color: "#7e8a9e" }} />
                        <div>
                          <div className="text-xs" style={{ color: "#7e8a9e" }}>{item.label}</div>
                          <div className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {checkin.notes && (
                    <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                      <div className="text-xs uppercase mb-1" style={{ color: "#7e8a9e" }}>Notes</div>
                      <p className="text-sm" style={{ color: "#c9cdd5" }}>{checkin.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "photos" && (
          <div className="space-y-6">
            {photos.length === 0 ? (
              <div className="text-center py-12" style={{ color: "#7e8a9e" }}>
                <Image size={40} className="mx-auto mb-4" style={{ color: "#404858" }} />
                <p>No progress photos yet</p>
              </div>
            ) : (
              <>
                <PhotoComparison clientId={client.id} photos={photos} checkins={checkins} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="p-5 rounded-2xl"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar size={14} style={{ color: "#7e8a9e" }} />
                        <span className="text-sm" style={{ color: "#7e8a9e" }}>
                          {photo.week_number ? `Week ${photo.week_number}` : ""} · {new Date(photo.upload_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[photo.front_photo, photo.side_photo, photo.back_photo].map((url, i) => (
                          <div
                            key={i}
                            className="aspect-[3/4] rounded-lg flex items-center justify-center overflow-hidden"
                            style={{ background: "rgba(255, 255, 255, 0.04)" }}
                          >
                            {url ? (
                              <img src={`/api/file?pathname=${encodeURIComponent(url)}`} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Image size={20} style={{ color: "#404858" }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "plans" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PlanEditor clientId={client.id} type="meal" plan={mealPlan} />
            <PlanEditor clientId={client.id} type="workout" plan={workoutPlan} />
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-12" style={{ color: "#7e8a9e" }}>
                <MessageSquare size={40} className="mx-auto mb-4" style={{ color: "#404858" }} />
                <p>No insights sent yet</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-5 rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs" style={{ color: "#7e8a9e" }}>
                      {new Date(insight.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {insight.is_read && (
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "#2dd4bf" }}>
                        <Check size={12} />
                        Read
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#c9cdd5" }}>
                    {insight.insight}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
