"use client"

import { useMemo, useState } from "react"
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
import { Worklist } from "@/components/coach/Worklist"
import type { WorkRow } from "@/lib/coach/worklist"
import { AddClientButton } from "@/components/coach/AddClientButton"
import { useStaggeredEntrance } from "@/components/ui/stagger"

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
  worklist = [],
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
  worklist?: WorkRow[]
  stats: Stats
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "pending">("all")

  const rosterEntrance = useStaggeredEntrance(0.04, 10)

  // Re-lowercasing every client's name and email on every keystroke is work
  // the coach pays for while typing. Normalise once, filter against that.
  const searchable = useMemo(
    () => clients.map(c => ({
      client: c,
      haystack: `${c.full_name} ${c.email}`.toLowerCase(),
    })),
    [clients]
  )

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return searchable
      .filter(({ client, haystack }) => {
        if (q && !haystack.includes(q)) return false
        if (selectedFilter === "active") return client.subscription_status === "active"
        if (selectedFilter === "pending") return client.subscription_status === "paused"
        return true
      })
      .map(({ client }) => client)
  }, [searchable, searchQuery, selectedFilter])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

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

        {/* One list: every reason a client needs you, ranked, with the reason
            on the row. Replaces the separate reviews, alerts, replies, quiet
            and engagement sections, and the stat cards. */}
        <div className="mb-10">
          <Worklist rows={worklist} reviews={pendingReviews} />
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: "#e8eaf0" }}>All clients</h2>
          <span className="text-xs tabular-nums" style={{ color: "#7e8a9e" }}>{stats.activeClients} active of {stats.totalClients}</span>
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
              <motion.div key={client.id} {...rosterEntrance(i)}>
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
                      {/* Inside the card's Link, so this must both stop the
                          card navigating and do its own. A nested <Link> would
                          be invalid markup here. */}
                      <button
                        className="p-2 rounded-lg transition-colors"
                        style={{
                          background: "rgba(255, 255, 255, 0.04)",
                          color: "#7e8a9e"
                        }}
                        aria-label={`Message ${client.full_name || "client"}`}
                        title={`Message ${client.full_name || "client"}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          router.push(`/coach/client/${client.id}/messages`)
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
