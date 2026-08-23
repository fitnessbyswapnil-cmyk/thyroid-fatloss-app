"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { UserPlus, X, Loader2, Check, Mail, KeyRound, Copy } from "lucide-react"
import { inviteClient, createClientLogin } from "@/app/actions/provision-client"

type Mode = "login" | "invite"

/**
 * Adding a client, two ways.
 *
 * "Create login" is the default because it is the one that always works. The
 * invite path depends on Supabase actually sending mail, and a coach who has
 * just been paid should never be stuck at that. Creating the login hands back
 * credentials to send over WhatsApp, which is where this business already
 * talks to its clients — and the password is temporary, so it stops working
 * the moment she chooses her own.
 */
export function AddClientButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invited, setInvited] = useState(false)
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const reset = () => {
    setEmail(""); setFullName(""); setError(null)
    setInvited(false); setCreds(null); setCopied(false)
  }
  const close = () => { setOpen(false); reset() }

  const handleSubmit = async () => {
    setSending(true)
    setError(null)

    if (mode === "invite") {
      const result = await inviteClient({ email, fullName })
      setSending(false)
      if (result.success) { setInvited(true); router.refresh() }
      else setError(result.error || "Failed to add client")
      return
    }

    const result = await createClientLogin({ email, fullName })
    setSending(false)
    if (result.success && result.password) {
      setCreds({ email: result.email!, password: result.password })
      router.refresh()
    } else {
      setError(result.error || "Failed to create login")
    }
  }

  // Written to be pasted straight into WhatsApp, not to be re-typed by the
  // coach at 11pm. The sign-in link is included because "go to the app" is the
  // step people get wrong.
  const shareText = creds
    ? `Hi ${fullName.trim().split(" ")[0] || "there"}, your ThyroWell account is ready.

Sign in: https://app.swapnilumbarkarfitness.in/auth/login
Email: ${creds.email}
Temporary password: ${creds.password}

You'll be asked to choose your own password the first time you sign in.`
    : ""

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Couldn't copy — select the text above and copy it manually.")
    }
  }

  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" } as const
  const canSubmit = email.trim() && fullName.trim()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14" }}
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
              style={{ background: "#0d111b", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>
                  {creds ? "Account ready" : "Add a client"}
                </h3>
                <button onClick={close} style={{ color: "#7e8a9e" }} aria-label="Close"><X size={18} /></button>
              </div>

              {creds ? (
                <div>
                  <p className="text-xs mb-4" style={{ color: "#7e8a9e", lineHeight: 1.6 }}>
                    Send these to {fullName.trim().split(" ")[0] || "her"} now — this password is shown
                    once and can&rsquo;t be looked up again. She&rsquo;ll pick her own on first sign-in.
                  </p>

                  <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(45,212,191,0.07)", border: "1px solid rgba(45,212,191,0.22)" }}>
                    <p className="text-[10px] uppercase mb-1" style={{ color: "#7e8a9e", letterSpacing: "0.1em" }}>Email</p>
                    <p className="text-sm font-mono mb-3 break-all" style={{ color: "#e8eaf0" }}>{creds.email}</p>
                    <p className="text-[10px] uppercase mb-1" style={{ color: "#7e8a9e", letterSpacing: "0.1em" }}>Temporary password</p>
                    <p className="text-lg font-mono tracking-wide" style={{ color: "#2dd4bf" }}>{creds.password}</p>
                  </div>

                  <button
                    onClick={copy}
                    className="w-full h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
                    style={{ background: copied ? "rgba(52,211,153,0.18)" : "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: copied ? "#34d399" : "#0a0d14" }}
                  >
                    {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy message for WhatsApp</>}
                  </button>
                  {error && <p className="text-xs mt-3" style={{ color: "#fb7185" }}>{error}</p>}
                  <button onClick={close} className="w-full mt-2.5 h-11 rounded-xl text-sm" style={{ color: "#7e8a9e" }}>
                    Done
                  </button>
                </div>
              ) : invited ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)" }}>
                    <Check size={28} style={{ color: "#2dd4bf" }} />
                  </div>
                  <p className="text-sm" style={{ color: "#c9cdd5" }}>Invite sent. She&rsquo;ll get a link to set up her account.</p>
                  <button onClick={close} className="mt-5 h-11 px-6 rounded-xl text-sm" style={{ color: "#7e8a9e" }}>Done</button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {([
                      { id: "login" as Mode, icon: KeyRound, label: "Create login", hint: "Works right away" },
                      { id: "invite" as Mode, icon: Mail, label: "Email invite", hint: "Needs email set up" },
                    ]).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setMode(m.id); setError(null) }}
                        className="p-3 rounded-xl text-left"
                        style={{
                          background: mode === m.id ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${mode === m.id ? "rgba(45,212,191,0.35)" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        <m.icon size={16} style={{ color: mode === m.id ? "#2dd4bf" : "#7e8a9e" }} />
                        <p className="text-[13px] font-medium mt-1.5" style={{ color: mode === m.id ? "#e8eaf0" : "#a9b2c1" }}>{m.label}</p>
                        <p className="text-[10.5px] mt-0.5" style={{ color: "#7e8a9e" }}>{m.hint}</p>
                      </button>
                    ))}
                  </div>

                  <p className="text-xs mb-5" style={{ color: "#7e8a9e", lineHeight: 1.6 }}>
                    {mode === "login"
                      ? "Creates the account and gives you a password to send her. Use this after payment is confirmed."
                      : "Emails her a sign-in link. Only works once your Supabase email sender is configured."}
                  </p>

                  <label className="block text-xs uppercase mb-1.5" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none mb-4" style={inputStyle} placeholder="Priya Sharma" />
                  <label className="block text-xs uppercase mb-1.5" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoCapitalize="none" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="priya@example.com" />

                  {error && <p className="text-xs mt-3" style={{ color: "#fb7185" }}>{error}</p>}

                  <motion.button
                    onClick={handleSubmit}
                    disabled={sending || !canSubmit}
                    whileTap={{ scale: 0.99 }}
                    className="w-full mt-5 h-12 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14", opacity: !canSubmit ? 0.5 : 1 }}
                  >
                    {sending
                      ? <Loader2 size={18} className="animate-spin" />
                      : mode === "login"
                        ? <><KeyRound size={16} /> Create login</>
                        : <><Mail size={16} /> Send invite</>}
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
