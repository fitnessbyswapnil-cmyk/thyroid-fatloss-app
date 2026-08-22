"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Download, Trash2, Loader2, ShieldCheck, FileText, LogOut, AlertTriangle, X, LayoutDashboard, ChevronRight, Activity, MessageSquare, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { exportMyData, deleteMyAccount } from "@/app/actions/account"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"
import { ReminderToggle } from "@/components/dashboard/ReminderToggle"

export function SettingsView({
  fullName,
  email,
  consentAt,
  isActive = true,
  isCoach = false }: {
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

  const card = { background: "#FDFBF7", border: "1px solid #e2dbcd" } as const

  return (
    <div className="min-h-screen" style={{ background: "#F4F0E8", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 24px))" }}>
      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(253, 251, 247, 0.85)",  borderBottom: "1px solid #e2dbcd" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={backHref} className="p-2 -ml-2 rounded-lg" style={{ color: "#8b867c" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Newsreader', Georgia, serif",  color: "#1c1d20" }}>Settings</h1>
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
            style={{ background: "rgba(21, 94, 86,0.1)", border: "1px solid rgba(21, 94, 86,0.25)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(21, 94, 86,0.15)" }}>
              <LayoutDashboard size={20} style={{ color: "#155e56" }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: "#1c1d20" }}>Coach Panel</p>
              <p className="text-xs" style={{ color: "#8b867c" }}>Manage clients, plans & your exercise library</p>
            </div>
            <ChevronRight size={18} style={{ color: "#155e56" }} />
          </Link>
        )}

        {/* Coach chat */}
        <Link
          href="/dashboard/messages"
          className="flex items-center gap-3 p-5 rounded-2xl"
          style={{ background: "rgba(21, 94, 86,0.1)", border: "1px solid rgba(21, 94, 86,0.22)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(21, 94, 86,0.15)" }}>
            <MessageSquare size={20} style={{ color: "#155e56" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "#1c1d20" }}>Message your coach</p>
            <p className="text-xs" style={{ color: "#8b867c" }}>Questions, wins, anything — chat anytime</p>
          </div>
          <ChevronRight size={18} style={{ color: "#155e56" }} />
        </Link>

        {/* Reminder opt-in — the only channel that can reach a client who
            isn't already opening the app. */}
        <ReminderToggle />

        {/* Education library */}
        <Link
          href="/dashboard/learn"
          className="flex items-center gap-3 p-5 rounded-2xl"
          style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(184, 134, 63,0.14)" }}>
            <BookOpen size={20} style={{ color: "#b8863f" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "#1c1d20" }}>Learn</p>
            <p className="text-xs" style={{ color: "#8b867c" }}>Short thyroid lessons, unlocked week by week</p>
          </div>
          <ChevronRight size={18} style={{ color: "#8b867c" }} />
        </Link>

        {/* My Health & Labs — thyroid profile + lab tracking */}
        <Link
          href="/dashboard/health"
          className="flex items-center gap-3 p-5 rounded-2xl"
          style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(21, 94, 86,0.12)" }}>
            <Activity size={20} style={{ color: "#155e56" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: "#1c1d20" }}>My Health &amp; Labs</p>
            <p className="text-xs" style={{ color: "#8b867c" }}>Thyroid profile, medication & lab trends</p>
          </div>
          <ChevronRight size={18} style={{ color: "#8b867c" }} />
        </Link>

        {/* Profile */}
        <div className="p-6 rounded-2xl" style={card}>
          <h3 className="font-semibold mb-4" style={{ color: "#1c1d20" }}>Account</h3>
          <div className="space-y-3">
            <Row label="Name" value={fullName || "—"} />
            <Row label="Email" value={email} />
            <Row label="Health-data consent" value={consentAt ? `Given ${new Date(consentAt).toLocaleDateString()}` : "Not recorded"} />
          </div>
        </div>

        {/* Privacy & data */}
        <div className="p-6 rounded-2xl" style={card}>
          <h3 className="font-semibold mb-1 flex items-center gap-2" style={{ color: "#1c1d20" }}>
            <ShieldCheck size={16} style={{ color: "#155e56" }} /> Your data
          </h3>
          <p className="text-xs mb-4" style={{ color: "#8b867c" }}>Download everything we hold about you, or remove it entirely.</p>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full mb-3 h-12 rounded-xl font-medium inline-flex items-center justify-center gap-2"
            style={{ background: "#F1EDE1", border: "1px solid #e2dbcd", color: "#1c1d20" }}
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Download my data
          </button>

          <button
            onClick={() => setConfirmOpen(true)}
            className="w-full h-12 rounded-xl font-medium inline-flex items-center justify-center gap-2"
            style={{ background: "rgba(154, 59, 46,0.1)", border: "1px solid rgba(154, 59, 46,0.25)", color: "#A32B23" }}
          >
            <Trash2 size={18} /> Delete my account and data
          </button>

          {error && <p className="text-xs mt-3" style={{ color: "#A32B23" }}>{error}</p>}
        </div>

        {/* Legal */}
        <div className="p-6 rounded-2xl" style={card}>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="inline-flex items-center gap-2 text-sm" style={{ color: "#155e56" }}><FileText size={15} /> Privacy</Link>
            <Link href="/terms" className="inline-flex items-center gap-2 text-sm" style={{ color: "#155e56" }}><FileText size={15} /> Terms</Link>
          </div>
          <p className="text-xs mt-4" style={{ color: "#a09a8e" }}>
            ThyroWell is a wellness coaching program, not medical treatment or a substitute for your doctor. Individual results vary.
          </p>
        </div>

        <button onClick={handleSignOut} className="w-full h-12 rounded-xl font-medium inline-flex items-center justify-center gap-2" style={{ color: "#8b867c" }}>
          <LogOut size={18} /> Sign out
        </button>
      </main>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => !deleting && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#FDFBF7", border: "1px solid rgba(154, 59, 46,0.2)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} style={{ color: "#A32B23" }} />
                  <h3 className="font-semibold" style={{ color: "#1c1d20" }}>Delete everything?</h3>
                </div>
                <button onClick={() => !deleting && setConfirmOpen(false)} style={{ color: "#8b867c" }} aria-label="Close"><X size={18} /></button>
              </div>
              <p className="text-sm mb-4" style={{ color: "#5a564e" }}>
                This permanently deletes your account, check-ins, photos, plans, and all related data.
                This cannot be undone. Type <strong style={{ color: "#1c1d20" }}>DELETE</strong> to confirm.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-4"
                style={{ background: "#FDFBF7", border: "1px solid #e2dbcd", color: "#1c1d20" }}
                placeholder="DELETE"
              />
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className="w-full h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
                style={{ background: confirmText === "DELETE" ? "#A32B23" : "rgba(154, 59, 46,0.3)", color: "#fff", opacity: confirmText === "DELETE" ? 1 : 0.6 }}
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
      <span className="text-xs uppercase" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>{label}</span>
      <span className="text-sm" style={{ color: "#1c1d20" }}>{value}</span>
    </div>
  )
}
