"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Download, Trash2, Loader2, ShieldCheck, FileText, LogOut, AlertTriangle, X, LayoutDashboard, ChevronRight, Activity, MessageSquare, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { exportMyData, deleteMyAccount } from "@/app/actions/account"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"

export function SettingsView({
  fullName,
  email,
  consentAt,
  isActive = true,
  isCoach = false,
}: {
  fullName: string
  email: string
  consentAt: string | null
  isActive?: boolean
  isCoach?: boolean
}) {
  const router = useRouter()
  const backHref = isActive ? "/dashboard" : "/enroll"
  const [exporting, setExporting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    const result = await exportMyData()
    setExporting(false)
    if (!result.success) { setError(result.error || "Export failed"); return }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `thyrowell-my-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const result = await deleteMyAccount()
    if (!result.success) { setDeleting(false); setError(result.error || "Deletion failed"); return }
    router.push("/")
    router.refresh()
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const

  return (
    <div className="min-h-screen" style={{ background: "#090c14", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 24px))" }}>
      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(9,12,20,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={backHref} className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {/* Coach panel entry — only visible to coach/admin accounts. In the
            installed app there's no address bar, so this is how the coach
            reaches /coach. */}
        {isCoach && (
          <Link
            href="/coach"
            className="flex items-center gap-3 p-5 rounded-2xl"
            style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.25)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.15)" }}>
              <LayoutDashboard size={20} style={{ color: "#2dd4bf" }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: "#e8eaf0" }}>Coach Panel</p>
              <p className="text-xs" style={{ color: "#7e8a9e" }}>Manage clients, plans & your exercise library</p>
            </div>
            <ChevronRight size={18} style={{ color: "#2dd4bf" }} />
          </Link>
        )}

        {/* Coach chat */}
        <Link
          href="/dashboard/messages"
          className="flex items-center gap-3 p-5 rounded-2xl"
          style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.22)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.15)" }}>
            <MessageSquare size={20} style={{ color: "#2dd4bf" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "#e8eaf0" }}>Message your coach</p>
            <p className="text-xs" style={{ color: "#7e8a9e" }}>Questions, wins, anything — chat anytime</p>
          </div>
          <ChevronRight size={18} style={{ color: "#2dd4bf" }} />
        </Link>

        {/* Education library */}
        <Link
          href="/dashboard/learn"
          className="flex items-center gap-3 p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.14)" }}>
            <BookOpen size={20} style={{ color: "#a78bfa" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "#e8eaf0" }}>Learn</p>
            <p className="text-xs" style={{ color: "#7e8a9e" }}>Short thyroid lessons, unlocked week by week</p>
          </div>
          <ChevronRight size={18} style={{ color: "#7e8a9e" }} />
        </Link>

        {/* My Health & Labs — thyroid profile + lab tracking */}
        <Link
          href="/dashboard/health"
          className="flex items-center gap-3 p-5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.12)" }}>
            <Activity size={20} style={{ color: "#2dd4bf" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "#e8eaf0" }}>My Health &amp; Labs</p>
            <p className="text-xs" style={{ color: "#7e8a9e" }}>Thyroid profile, medication & lab trends</p>
          </div>
          <ChevronRight size={18} style={{ color: "#7e8a9e" }} />
        </Link>

        {/* Profile */}
        <div className="p-6 rounded-2xl" style={card}>
          <h3 className="font-semibold mb-4" style={{ color: "#e8eaf0" }}>Account</h3>
          <div className="space-y-3">
            <Row label="Name" value={fullName || "—"} />
            <Row label="Email" value={email} />
            <Row label="Health-data consent" value={consentAt ? `Given ${new Date(consentAt).toLocaleDateString()}` : "Not recorded"} />
          </div>
        </div>

        {/* Privacy & data */}
        <div className="p-6 rounded-2xl" style={card}>
          <h3 className="font-semibold mb-1 flex items-center gap-2" style={{ color: "#e8eaf0" }}>
            <ShieldCheck size={16} style={{ color: "#2dd4bf" }} /> Your data
          </h3>
          <p className="text-xs mb-4" style={{ color: "#7e8a9e" }}>Download everything we hold about you, or remove it entirely.</p>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full mb-3 h-12 rounded-xl font-medium inline-flex items-center justify-center gap-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" }}
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Download my data
          </button>

          <button
            onClick={() => setConfirmOpen(true)}
            className="w-full h-12 rounded-xl font-medium inline-flex items-center justify-center gap-2"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fb7185" }}
          >
            <Trash2 size={18} /> Delete my account and data
          </button>

          {error && <p className="text-xs mt-3" style={{ color: "#fb7185" }}>{error}</p>}
        </div>

        {/* Legal */}
        <div className="p-6 rounded-2xl" style={card}>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="inline-flex items-center gap-2 text-sm" style={{ color: "#2dd4bf" }}><FileText size={15} /> Privacy</Link>
            <Link href="/terms" className="inline-flex items-center gap-2 text-sm" style={{ color: "#2dd4bf" }}><FileText size={15} /> Terms</Link>
          </div>
          <p className="text-xs mt-4" style={{ color: "#5a6578" }}>
            ThyroWell is a wellness coaching program, not medical treatment or a substitute for your doctor. Individual results vary.
          </p>
        </div>

        <button onClick={handleSignOut} className="w-full h-12 rounded-xl font-medium inline-flex items-center justify-center gap-2" style={{ color: "#7e8a9e" }}>
          <LogOut size={18} /> Sign out
        </button>
      </main>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => !deleting && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#0d111b", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} style={{ color: "#fb7185" }} />
                  <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>Delete everything?</h3>
                </div>
                <button onClick={() => !deleting && setConfirmOpen(false)} style={{ color: "#7e8a9e" }} aria-label="Close"><X size={18} /></button>
              </div>
              <p className="text-sm mb-4" style={{ color: "#a9b2c1" }}>
                This permanently deletes your account, check-ins, photos, plans, and all related data.
                This cannot be undone. Type <strong style={{ color: "#e8eaf0" }}>DELETE</strong> to confirm.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" }}
                placeholder="DELETE"
              />
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="w-full h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
                style={{ background: confirmText === "DELETE" ? "#ef4444" : "rgba(239,68,68,0.3)", color: "#fff", opacity: confirmText === "DELETE" ? 1 : 0.6 }}
              >
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Permanently delete
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isActive && <BottomNavPill />}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>{label}</span>
      <span className="text-sm" style={{ color: "#e8eaf0" }}>{value}</span>
    </div>
  )
}
