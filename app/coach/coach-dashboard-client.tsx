"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  Users, Activity, Clock, TrendingUp, Search, 
  ChevronRight, MessageSquare, LogOut, Home,
  Scale, Heart, Zap
} from "lucide-react"
import { PendingReview } from "@/app/actions/coach-reviews"
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
  avgRecovery: string
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
  stats
}: {
  clients: Client[]
  pendingReviews: PendingReview[]
  lastCheckIns?: Record<string, string>
  quietClients?: QuietClient[]
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
      label: "Avg Recovery", 
      value: `${stats.avgRecovery}%`, 
      icon: Activity, 
      color: "#34d399",
      subtext: "All clients"
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
      style={{ background: "#090c14" }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: "rgba(9, 12, 20, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 
              className="text-xl font-bold"
              style={{ 
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: "italic",
                color: "#e8eaf0"
              }}
            >
              ThyroWell Coach
            </h1>
            <span 
              className="px-2 py-1 rounded text-[10px] font-medium uppercase"
              style={{ 
                background: "rgba(45, 212, 191, 0.15)",
                color: "#2dd4bf",
                letterSpacing: "0.08em"
              }}
            >
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AddClientButton />
            <Link
              href="/dashboard"
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#7e8a9e" }}
            >
              <Home size={20} />
            </Link>
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
                <Link
                  key={q.id}
                  href={`/coach/client/${q.id}`}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors"
                  style={{ background: "rgba(255, 255, 255, 0.03)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{q.full_name}</span>
                  <span className="text-xs" style={{ color: "#f59e0b" }}>
                    {q.daysSince === null ? "No check-in yet" : `${q.daysSince} days since last check-in`}
                  </span>
                </Link>
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
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <Heart size={12} style={{ color: "#7e8a9e" }} />
                          <span 
                            className="text-sm font-semibold tabular-nums"
                            style={{ color: "#e8eaf0" }}
                          >
                            {client.recovery_score || 0}%
                          </span>
                        </div>
                        <span className="text-[10px]" style={{ color: "#7e8a9e" }}>
                          Recovery
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <Zap size={12} style={{ color: "#7e8a9e" }} />
                          <span 
                            className="text-sm font-semibold tabular-nums"
                            style={{ color: "#e8eaf0" }}
                          >
                            {client.streak_current || 0}
                          </span>
                        </div>
                        <span className="text-[10px]" style={{ color: "#7e8a9e" }}>
                          Streak
                        </span>
                      </div>
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
