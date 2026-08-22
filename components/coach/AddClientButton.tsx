"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { UserPlus, X, Loader2, Check, Mail } from "lucide-react"
import { inviteClient } from "@/app/actions/provision-client"

export function AddClientButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setEmail(""); setFullName(""); setError(null); setDone(false) }
  const close = () => { setOpen(false); reset() }

  const handleSubmit = async () => {
    setSending(true)
    setError(null)
    const result = await inviteClient({ email, fullName })
    setSending(false)
    if (result.success) {
      setDone(true)
      router.refresh()
      setTimeout(close, 1800)
    } else {
      setError(result.error || "Failed to add client")
    }
  }

  const inputStyle = { background: "#ffffff", border: "1px solid #e2dbcd", color: "#1c1d20" } as const

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)", color: "#fdfbf7" }}
      >
        <UserPlus size={16} /> Add client
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={close}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold" style={{ color: "#1c1d20" }}>Add a client</h3>
                <button onClick={close} style={{ color: "#8b867c" }} aria-label="Close"><X size={18} /></button>
              </div>

              {done ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(21, 94, 86,0.15)" }}>
                    <Check size={28} style={{ color: "#155e56" }} />
                  </div>
                  <p className="text-sm" style={{ color: "#3c3a34" }}>Invite sent. They'll get a magic link to set up their account.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs mb-5" style={{ color: "#8b867c" }}>
                    Sends a magic-link invite and activates their access. Use this after payment is confirmed in your funnel.
                  </p>
                  <label className="block text-xs uppercase mb-1.5" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-4" style={inputStyle} placeholder="Priya Sharma" />
                  <label className="block text-xs uppercase mb-1.5" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="priya@example.com" />
                  {error && <p className="text-xs mt-3" style={{ color: "#9a3b2e" }}>{error}</p>}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={sending || !email.trim()}
                    whileTap={{ scale: 0.99 }}
                    className="w-full mt-5 h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)", color: "#fdfbf7", opacity: !email.trim() ? 0.5 : 1 }}
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <><Mail size={16} /> Send invite</>}
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
