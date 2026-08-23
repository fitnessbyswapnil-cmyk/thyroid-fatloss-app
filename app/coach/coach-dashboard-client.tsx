"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Users, Activity, Clock, TrendingUp, Search,
  ChevronRight, MessageSquare, LogOut,
  Scale, Heart, Zap, BookOpen, AlertCircle, Check, Minus
} from "lucide-react"
import { PendingReview } from "@/app/actions/coach-reviews"
import type { CoachAlert } from "@/lib/coach/alerts"
import type { ClientSetup } from "@/lib/coach/assignment"
import { PendingReviewsQueue } from "@/components/coach/PendingReviewsQueue"
import { AddClientButton } from "@/components/coach/AddClientButton"

interface Client {
  id: string
  full_name: string
  email: string
  current_weight: number | null
  start_weight: number | null
  recovery_score: number | null
  wellness_score: number | null
  streak_current: number | null
  subscription_status: string
  plan_type: string
  created_at: string
}

interface Stats {
  totalClients: number
  activeClients: number
  pendingCheckins: number
  avgWeight: string
}

interface QuietClient {
  id: string
  full_name: string
  daysSince: number | null
}

/**
 * Who is opening the app at all, from lib/coach/engagement.ts run across the
 * roster. Deliberately two lists: a client who never started needs walking
 * through it, a client who stopped needs asking what changed. One "inactive"
 * number would hide which of the two you are looking at.
 */
export interface RosterEngagement {
  neverStarted: { id: string; full_name: string; daysSinceJoined: number | null; pushOff: boolean }[]
  goneQuiet: { id: string; full_name: string; daysSinceLog: number | null; active: number; total: number }[]
}

export function CoachDashboardClient({
  clients,
  pendingReviews = [],
  lastCheckIns = {},
  quietClients = [],
  waitingClients = [],
  alerts = [],
  engagement = { neverStarted: [], goneQuiet: [] },
  recentErrorCount = 0,
  setup = {},
  stats
}: {
  clients: Client[]
  pendingReviews: PendingReview[]
  lastCheckIns?: Record<string, string>
  quietClients?: QuietClient[]
  waitingClients?: { id: string; full_name: string; count: number }[]
  alerts?: CoachAlert[]
  engagement?: RosterEngagement
  recentErrorCount?: number
  setup?: Record<string, ClientSetup>
  stats: Stats
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "pending">("all")

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (selectedFilter === "active") {
      return matchesSearch && client.subscription_status === "active"
    }
    if (selectedFilter === "pending") {
      return matchesSearch && client.subscription_status === "paused"
    }
    return matchesSearch
  })

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const statCards = [
    { 
      label: "Total Clients", 
      value: stats.totalClients, 
      icon: Users, 
      color: "#2dd4bf",
      subtext: `${stats.activeClients} active`
    },
    { 
      label: "Pending Check-ins", 
      value: stats.pendingCheckins, 
      icon: Clock, 
      color: "#f59e0b",
      subtext: "This week"
    },
    {
      label: "To Review",
      value: pendingReviews.length,
      icon: Activity,
      color: "#34d399",
      subtext: "Submitted check-ins"
    },
    { 
      label: "Avg Weight", 
      value: `${stats.avgWeight} kg`, 
      icon: TrendingUp, 
      color: "#fb7185",
      subtext: "Current"
    },
  ]

  return (
    <div 
      className="min-h-screen"
      style={{ background: "#0e131c" }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "rgba(14, 19, 28, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1
              className="text-[15px] font-bold uppercase"
              style={{ color: "#e8eaf0", letterSpacing: "0.18em" }}
            >
              Thyrowell
            </h1>
            <span 
              className="px-2 py-1 rounded text-[10px] font-medium uppercase"
              style={{
                background: "rgba(129, 140, 248, 0.15)",
                color: "#818cf8",
                letterSpacing: "0.08em"
              }}
            >
              Coach workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/coach/library"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.05)", color: "#c9cdd5", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <BookOpen size={15} /> Library
            </Link>
            <AddClientButton />
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#7e8a9e" }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Pending Reviews Section */}
        {pendingReviews.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PendingReviewsQueue reviews={pendingReviews} />
          </motion.div>
        )}

        {/* App health — only appears when something actually failed, so it
            stays silent on a normal day rather than becoming background noise. */}
        {recentErrorCount > 0 && (
          <div
            className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(251,113,133,0.05)", border: "1px solid rgba(251,113,133,0.18)" }}
          >
            <AlertCircle size={15} className="shrink-0" style={{ color: "#fb7185" }} />
            <p className="text-[12px] flex-1" style={{ color: "#a9b2c1" }}>
              <span style={{ color: "#fb7185", fontWeight: 600 }}>
                {recentErrorCount} app error{recentErrorCount === 1 ? "" : "s"}
              </span>{" "}
              logged in the last 7 days — clients may have hit a failure. Check the
              <span style={{ color: "#e8eaf0" }}> error_logs</span> table or your Vercel logs.
            </p>
          </div>
        )}

        {/* Needs your call — rules over labs, energy, adherence and symptoms.
            Sits above everything else because these are time-sensitive. */}
        {alerts.length > 0 && (
          <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} style={{ color: "#fb7185" }} />
              <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>Needs your call</h3>
              <span className="text-xs" style={{ color: "#7e8a9e" }}>
                · {alerts.length} flag{alerts.length === 1 ? "" : "s"} across your roster
              </span>
            </div>
            <div className="space-y-2">
              {alerts.map((a, i) => {
                const tone =
                  a.severity === "urgent"
                    ? { color: "#fb7185", bg: "rgba(251,113,133,0.05)", border: "rgba(251,113,133,0.2)", label: "Urgent" }
                    : a.severity === "attention"
                    ? { color: "#f59e0b", bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.18)", label: "Review" }
                    : { color: "#34d399", bg: "rgba(52,211,153,0.05)", border: "rgba(52,211,153,0.18)", label: "Send a win" }
                return (
                  <Link
                    key={`${a.clientId}-${a.kind}-${i}`}
                    href={a.href}
                    className="flex items-start gap-3 p-3.5 rounded-2xl"
                    style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
                  >
                    <span
                      className="shrink-0 text-[9.5px] font-bold uppercase rounded-full px-2 py-1 mt-0.5"
                      style={{ color: tone.color, background: `${tone.color}1f`, letterSpacing: "0.06em" }}
                    >
                      {tone.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>
                        {a.clientName} — {a.title}
                      </p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: "#7e8a9e" }}>{a.detail}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 mt-1" style={{ color: tone.color }} />
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Waiting for your reply — clients with unread messages */}
        {waitingClients.length > 0 && (
          <motion.div
            className="mb-6 p-5 rounded-2xl"
            style={{ background: "rgba(45, 212, 191, 0.06)", border: "1px solid rgba(45, 212, 191, 0.2)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} style={{ color: "#2dd4bf" }} />
              <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>Waiting for your reply</h3>
              <span className="text-xs" style={{ color: "#7e8a9e" }}>· {waitingClients.length} client{waitingClients.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-2">
              {waitingClients.map((w) => (
                <Link
                  key={w.id}
                  href={`/coach/client/${w.id}/messages`}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255, 255, 255, 0.03)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{w.full_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}>
                    {w.count} new message{w.count === 1 ? "" : "s"}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Needs attention — quiet clients (active + onboarded, no check-in in 7+ days) */}
        {quietClients.length > 0 && (
          <motion.div
            className="mb-8 p-5 rounded-2xl"
            style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.2)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} style={{ color: "#f59e0b" }} />
              <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>Needs attention</h3>
              <span className="text-xs" style={{ color: "#7e8a9e" }}>· {quietClients.length} quiet client{quietClients.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-2">
              {quietClients.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(255, 255, 255, 0.03)" }}
                >
                  <Link href={`/coach/client/${q.id}`} className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate" style={{ color: "#e8eaf0" }}>{q.full_name}</span>
                    <span className="block text-xs mt-0.5" style={{ color: "#f59e0b" }}>
                      {q.daysSince === null ? "No check-in yet" : `${q.daysSince} days since last check-in`}
                    </span>
                  </Link>
                  <Link
                    href={`/coach/client/${q.id}/messages`}
                    className="shrink-0 text-[11px] font-semibold rounded-full px-3 py-1.5"
                    style={{ color: "#2dd4bf", border: "1px solid rgba(45,212,191,0.3)" }}
                  >
                    Gentle nudge
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* App engagement — quieter than the lists above on purpose: this is
            triage context for them, not its own alarm. Amber at most, and only
            on the label; nothing here is a failure. */}
        {(engagement.neverStarted.length > 0 || engagement.goneQuiet.length > 0) && (
          <div
            className="mb-8 p-5 rounded-2xl"
            style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} style={{ color: "#7e8a9e" }} />
              <h3 className="text-sm font-semibold" style={{ color: "#a9b2c1" }}>Using the app</h3>
              <span className="text-[11px]" style={{ color: "#5a6578" }}>
                · meals, workouts and check-ins across active clients
              </span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {engagement.neverStarted.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-bold uppercase mb-1"
                    style={{ color: "#f59e0b", letterSpacing: "0.07em" }}
                  >
                    Never started · {engagement.neverStarted.length}
                  </p>
                  <p className="text-[11px] mb-2.5" style={{ color: "#5a6578" }}>
                    Nothing logged since she joined — she likely needs it shown to her once.
                  </p>
                  <div className="space-y-1.5">
                    {engagement.neverStarted.map((c) => (
                      <Link
                        key={c.id}
                        href={`/coach/client/${c.id}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                        style={{ background: "rgba(255, 255, 255, 0.02)" }}
                      >
                        <span className="text-[13px] truncate" style={{ color: "#e8eaf0" }}>{c.full_name}</span>
                        <span className="text-[11px] shrink-0 tabular-nums" style={{ color: "#7e8a9e" }}>
                          {c.daysSinceJoined === null
                            ? "joined recently"
                            : `${c.daysSinceJoined}d since joining`}
                          {c.pushOff ? " · reminders off" : ""}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {engagement.goneQuiet.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-bold uppercase mb-1"
                    style={{ color: "#a9b2c1", letterSpacing: "0.07em" }}
                  >
                    Gone quiet · {engagement.goneQuiet.length}
                  </p>
                  <p className="text-[11px] mb-2.5" style={{ color: "#5a6578" }}>
                    Nothing logged lately — worth asking what changed.
                  </p>
                  <div className="space-y-1.5">
                    {engagement.goneQuiet.map((c) => (
                      <Link
                        key={c.id}
                        href={`/coach/client/${c.id}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                        style={{ background: "rgba(255, 255, 255, 0.02)" }}
                      >
                        <span className="text-[13px] truncate" style={{ color: "#e8eaf0" }}>{c.full_name}</span>
                        <span className="text-[11px] shrink-0 tabular-nums" style={{ color: "#7e8a9e" }}>
                          {c.daysSinceLog === null
                            ? `${c.active} of ${c.total} signals`
                            : `last logged ${c.daysSinceLog}d ago · ${c.active}/${c.total}`}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}15` }}
                >
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
              </div>
              <div 
                className="text-2xl font-bold mb-1 tabular-nums"
                style={{ 
                  color: "#e8eaf0",
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: "italic"
                }}
              >
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: "#7e8a9e" }}>
                {stat.label}
              </div>
              <div className="text-[10px] mt-1" style={{ color: "#404858" }}>
                {stat.subtext}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search 
              size={16} 
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "#7e8a9e" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#e8eaf0",
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "active", "pending"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className="px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: selectedFilter === filter 
                    ? "rgba(45, 212, 191, 0.15)" 
                    : "rgba(255, 255, 255, 0.04)",
                  color: selectedFilter === filter ? "#2dd4bf" : "#7e8a9e",
                  border: `1px solid ${selectedFilter === filter ? "rgba(45, 212, 191, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <div 
              className="text-center py-12 rounded-2xl"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              <Users size={40} className="mx-auto mb-4" style={{ color: "#404858" }} />
              <p style={{ color: "#7e8a9e" }}>No clients found</p>
            </div>
          ) : (
            filteredClients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/coach/client/${client.id}`}
                  className="block p-5 rounded-2xl transition-all hover:scale-[1.01]"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-medium text-lg"
                      style={{ 
                        background: "linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(34, 197, 94, 0.2) 100%)",
                        color: "#2dd4bf"
                      }}
                    >
                      {client.full_name?.charAt(0) || "?"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate" style={{ color: "#e8eaf0" }}>
                          {client.full_name}
                        </h3>
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-medium uppercase"
                          style={{
                            background: client.subscription_status === "active" 
                              ? "rgba(45, 212, 191, 0.15)" 
                              : "rgba(245, 158, 11, 0.15)",
                            color: client.subscription_status === "active" ? "#2dd4bf" : "#f59e0b",
                          }}
                        >
                          {client.subscription_status}
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-medium uppercase"
                          style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            color: "#7e8a9e",
                          }}
                        >
                          {client.plan_type}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: "#7e8a9e" }}>
                        {client.email}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#5a6578" }}>
                        {lastCheckIns[client.id]
                          ? `Last check-in: ${new Date(lastCheckIns[client.id]).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
                          : "No check-in yet"}
                      </p>

                      {/* What she has, and what she is still waiting for. Shown
                          on the row itself so an unassigned plan is visible
                          without opening the client. */}
                      {setup[client.id] && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {setup[client.id].items.map((item) => {
                            const tone =
                              item.state === "done"
                                ? { bg: "rgba(52,211,153,0.12)", fg: "#34d399" }
                                : item.state === "todo"
                                  ? { bg: "rgba(245,158,11,0.13)", fg: "#f59e0b" }
                                  : { bg: "rgba(255,255,255,0.04)", fg: "#5a6578" }
                            return (
                              <span
                                key={item.key}
                                className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md text-[10px] font-medium"
                                style={{ background: tone.bg, color: tone.fg }}
                                title={
                                  item.state === "blocked"
                                    ? "Waiting on her profile before you can write this"
                                    : item.state === "done" && item.at
                                      ? `Assigned ${new Date(item.at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
                                      : undefined
                                }
                              >
                                {item.state === "done"
                                  ? <Check size={10} strokeWidth={3} />
                                  : <Minus size={10} strokeWidth={3} />}
                                {item.label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <Scale size={12} style={{ color: "#7e8a9e" }} />
                          <span 
                            className="text-sm font-semibold tabular-nums"
                            style={{ color: "#e8eaf0" }}
                          >
                            {client.current_weight || "-"} kg
                          </span>
                        </div>
                        {client.start_weight && client.current_weight && (
                          <span className="text-[10px]" style={{ color: "#2dd4bf" }}>
                            -{(client.start_weight - client.current_weight).toFixed(1)} kg
                          </span>
                        )}
                      </div>
                      <ChevronRight size={18} style={{ color: "#404858" }} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 rounded-lg transition-colors"
                        style={{ 
                          background: "rgba(255, 255, 255, 0.04)",
                          color: "#7e8a9e" 
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          // TODO: Open message modal
                        }}
                      >
                        <MessageSquare size={16} />
                      </button>
                      <ChevronRight size={18} style={{ color: "#404858" }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
