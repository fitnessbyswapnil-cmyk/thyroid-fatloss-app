"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Users, Activity, Clock, TrendingUp, Search,
  ChevronRight, MessageSquare, LogOut, Home,
  Scale, Heart, Zap, BookOpen, AlertCircle
} from "lucide-react"
import { PendingReview } from "@/app/actions/coach-reviews"
import type { CoachAlert } from "@/lib/coach/alerts"
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

export function CoachDashboardClient({
  clients,
  pendingReviews = [],
  lastCheckIns = {},
  quietClients = [],
  waitingClients = [],
  alerts = [],
  recentErrorCount = 0,
  stats
}: {
  clients: Client[]
  pendingReviews: PendingReview[]
  lastCheckIns?: Record<string, string>
  quietClients?: QuietClient[]
  waitingClients?: { id: string; full_name: string; count: number }[]
  alerts?: CoachAlert[]
  recentErrorCount?: number
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
      color: "#155e56",
      subtext: `${stats.activeClients} active`
    },
    { 
      label: "Pending Check-ins", 
      value: stats.pendingCheckins, 
      icon: Clock, 
      color: "#97671b",
      subtext: "This week"
    },
    {
      label: "To Review",
      value: pendingReviews.length,
      icon: Activity,
      color: "#155e56",
      subtext: "Submitted check-ins"
    },
    { 
      label: "Avg Weight", 
      value: `${stats.avgWeight} kg`, 
      icon: TrendingUp, 
      color: "#A32B23",
      subtext: "Current"
    },
  ]

  return (
    <div 
      className="min-h-screen"
      style={{ background: "#F4F0E8" }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "rgba(253, 251, 247, 0.85)", 
          borderBottom: "1px solid #e2dbcd" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 
              className="text-xl font-bold"
              style={{ 
                fontFamily: "'Newsreader', Georgia, serif", 
                color: "#1c1d20"
              }}
            >
              ThyroWell Coach
            </h1>
            <span 
              className="px-2 py-1 rounded text-[10px] font-medium uppercase"
              style={{ 
                background: "rgba(21, 94, 86, 0.15)",
                color: "#155e56",
                letterSpacing: "0.08em"
              }}
            >
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/coach/library"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#F1EDE1", color: "#3c3a34", border: "1px solid #e2dbcd" }}
            >
              <BookOpen size={15} /> Library
            </Link>
            <AddClientButton />
            <Link
              href="/dashboard"
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#8b867c" }}
            >
              <Home size={20} />
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#8b867c" }}
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
            style={{ background: "rgba(154, 59, 46, 0.12)", border: "1px solid rgba(154, 59, 46,0.18)" }}
          >
            <AlertCircle size={15} className="shrink-0" style={{ color: "#A32B23" }} />
            <p className="text-[12px] flex-1" style={{ color: "#5a564e" }}>
              <span style={{ color: "#A32B23", fontWeight: 600 }}>
                {recentErrorCount} app error{recentErrorCount === 1 ? "" : "s"}
              </span>{" "}
              logged in the last 7 days — clients may have hit a failure. Check the
              <span style={{ color: "#1c1d20" }}> error_logs</span> table or your Vercel logs.
            </p>
          </div>
        )}

        {/* Needs your call — rules over labs, energy, adherence and symptoms.
            Sits above everything else because these are time-sensitive. */}
        {alerts.length > 0 && (
          <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} style={{ color: "#A32B23" }} />
              <h3 className="font-semibold" style={{ color: "#1c1d20" }}>Needs your call</h3>
              <span className="text-xs" style={{ color: "#8b867c" }}>
                · {alerts.length} flag{alerts.length === 1 ? "" : "s"} across your roster
              </span>
            </div>
            <div className="space-y-2">
              {alerts.map((a, i) => {
                const tone =
                  a.severity === "urgent"
                    ? { color: "#A32B23", bg: "rgba(154, 59, 46, 0.12)", border: "rgba(154, 59, 46,0.2)", label: "Urgent" }
                    : a.severity === "attention"
                    ? { color: "#97671b", bg: "rgba(151, 103, 27, 0.13)", border: "rgba(151, 103, 27,0.18)", label: "Review" }
                    : { color: "#155e56", bg: "rgba(21, 94, 86, 0.13)", border: "rgba(21, 94, 86,0.18)", label: "Send a win" }
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
                      <p className="text-sm font-semibold" style={{ color: "#1c1d20" }}>
                        {a.clientName} — {a.title}
                      </p>
                      <p className="text-[11.5px] mt-0.5" style={{ color: "#8b867c" }}>{a.detail}</p>
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
            style={{ background: "rgba(21, 94, 86, 0.13)", border: "1px solid rgba(21, 94, 86, 0.2)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} style={{ color: "#155e56" }} />
              <h3 className="font-semibold" style={{ color: "#1c1d20" }}>Waiting for your reply</h3>
              <span className="text-xs" style={{ color: "#8b867c" }}>· {waitingClients.length} client{waitingClients.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-2">
              {waitingClients.map((w) => (
                <Link
                  key={w.id}
                  href={`/coach/client/${w.id}/messages`}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "#FDFBF7" }}
                >
                  <span className="text-sm font-medium" style={{ color: "#1c1d20" }}>{w.full_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(21, 94, 86,0.15)", color: "#155e56" }}>
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
            style={{ background: "rgba(151, 103, 27, 0.13)", border: "1px solid rgba(151, 103, 27, 0.2)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} style={{ color: "#97671b" }} />
              <h3 className="font-semibold" style={{ color: "#1c1d20" }}>Needs attention</h3>
              <span className="text-xs" style={{ color: "#8b867c" }}>· {quietClients.length} quiet client{quietClients.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-2">
              {quietClients.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "#FDFBF7" }}
                >
                  <Link href={`/coach/client/${q.id}`} className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate" style={{ color: "#1c1d20" }}>{q.full_name}</span>
                    <span className="block text-xs mt-0.5" style={{ color: "#97671b" }}>
                      {q.daysSince === null ? "No check-in yet" : `${q.daysSince} days since last check-in`}
                    </span>
                  </Link>
                  <Link
                    href={`/coach/client/${q.id}/messages`}
                    className="shrink-0 text-[11px] font-semibold rounded-full px-3 py-1.5"
                    style={{ color: "#155e56", border: "1px solid rgba(21, 94, 86,0.3)" }}
                  >
                    Gentle nudge
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
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
                background: "#FDFBF7",
                border: "1px solid #e2dbcd" }}
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
                  color: "#1c1d20",
                  fontFamily: "'Newsreader', Georgia, serif" }}
              >
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: "#8b867c" }}>
                {stat.label}
              </div>
              <div className="text-[10px] mt-1" style={{ color: "#cfc7b6" }}>
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
              style={{ color: "#8b867c" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{
                background: "#FDFBF7",
                border: "1px solid #e2dbcd",
                color: "#1c1d20" }}
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
                    ? "rgba(21, 94, 86, 0.15)" 
                    : "#FDFBF7",
                  color: selectedFilter === filter ? "#155e56" : "#8b867c",
                  border: `1px solid ${selectedFilter === filter ? "rgba(21, 94, 86, 0.3)" : "#e2dbcd"}` }}
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
                background: "#F4F0E8",
                border: "1px solid #ffffff" }}
            >
              <Users size={40} className="mx-auto mb-4" style={{ color: "#cfc7b6" }} />
              <p style={{ color: "#8b867c" }}>No clients found</p>
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
                    background: "#FDFBF7",
                    border: "1px solid #e2dbcd" }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-medium text-lg"
                      style={{ 
                        background: "linear-gradient(135deg, rgba(21, 94, 86, 0.2) 0%, rgba(21, 94, 86, 0.2) 100%)",
                        color: "#155e56"
                      }}
                    >
                      {client.full_name?.charAt(0) || "?"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate" style={{ color: "#1c1d20" }}>
                          {client.full_name}
                        </h3>
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-medium uppercase"
                          style={{
                            background: client.subscription_status === "active" 
                              ? "rgba(21, 94, 86, 0.15)" 
                              : "rgba(151, 103, 27, 0.15)",
                            color: client.subscription_status === "active" ? "#155e56" : "#97671b" }}
                        >
                          {client.subscription_status}
                        </span>
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-medium uppercase"
                          style={{
                            background: "#e2dbcd",
                            color: "#8b867c" }}
                        >
                          {client.plan_type}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: "#8b867c" }}>
                        {client.email}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#a09a8e" }}>
                        {lastCheckIns[client.id]
                          ? `Last check-in: ${new Date(lastCheckIns[client.id]).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`
                          : "No check-in yet"}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <Scale size={12} style={{ color: "#8b867c" }} />
                          <span 
                            className="text-sm font-semibold tabular-nums"
                            style={{ color: "#1c1d20" }}
                          >
                            {client.current_weight || "-"} kg
                          </span>
                        </div>
                        {client.start_weight && client.current_weight && (
                          <span className="text-[10px]" style={{ color: "#155e56" }}>
                            -{(client.start_weight - client.current_weight).toFixed(1)} kg
                          </span>
                        )}
                      </div>
                      <ChevronRight size={18} style={{ color: "#cfc7b6" }} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 rounded-lg transition-colors"
                        style={{ 
                          background: "#FDFBF7",
                          color: "#8b867c" 
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          // TODO: Open message modal
                        }}
                      >
                        <MessageSquare size={16} />
                      </button>
                      <ChevronRight size={18} style={{ color: "#cfc7b6" }} />
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
