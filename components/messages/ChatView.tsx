"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import { listMessages, sendMessage, type Message } from "@/app/actions/messages"

/**
 * Coach ↔ client chat. Shared by the client screen and the coach's per-client
 * screen. Light polling keeps it fresh while open (no realtime dependency).
 */
export function ChatView({
  initial,
  clientId,
  title,
  backHref,
  asCoach = false,
}: {
  initial: Message[]
  clientId?: string
  title: string
  backHref: string
  asCoach?: boolean
}) {
  const [messages, setMessages] = useState<Message[]>(initial)
  const [text, setText] = useState("")
  const [sendError, setSendError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollDown() }, [messages.length])

  // Poll for new messages every 12s while the screen is open.
  //
  // listMessages is guarded and hands back [] for a failed read just as readily
  // as for an empty thread, so one poll landing in a tunnel used to wipe weeks
  // of history off the screen and leave "No messages yet" in its place. An empty
  // result now only ever keeps what is already there — a thread cannot shrink to
  // nothing mid-session, and a genuinely empty one is already right because it
  // started empty.
  //
  // The poll is also gated on the tab being visible. This app runs inside a
  // Capacitor shell that loads the live site over the network, so a chat screen
  // left open in the background was firing a request every 12 seconds against
  // the client's mobile data for as long as the app stayed alive — and on
  // resume the WebView had a queue of them to work through before it could
  // paint. Instead the poll pauses when hidden and fires once immediately on
  // becoming visible again, which is also strictly fresher: she sees new
  // messages the moment she opens the app rather than up to 12s later.
  useEffect(() => {
    const refresh = async () => {
      try {
        const fresh = await listMessages(clientId)
        if (!fresh.length) return
        // listMessages returns the whole thread, so the usual poll hands back
        // an identical array. Swapping it in anyway re-rendered every bubble in
        // a months-old conversation every 12 seconds for nothing. Same count
        // and same last id means nothing arrived; keep the existing array so
        // React has no work to do.
        setMessages((prev) =>
          prev.length === fresh.length && prev[prev.length - 1]?.id === fresh[fresh.length - 1]?.id
            ? prev
            : fresh
        )
      } catch {
        // Offline or a dropped request: keep the conversation on screen.
      }
    }

    const tick = () => {
      if (document.visibilityState !== "visible") return
      void refresh()
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh()
    }

    const t = setInterval(tick, 12000)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [clientId])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setText("")
    try {
      const res = await sendMessage(body, clientId)
      if (res.success) {
        setSendError(null)
        // Same rule as the poll — her message is on the server, so an empty or
        // failed re-read must not blank the thread she just wrote into.
        try {
          const fresh = await listMessages(clientId)
          if (fresh.length) setMessages(fresh)
        } catch {}
      } else {
        setText(body)
        setSendError("That didn't send. Your message is back in the box — try again.")
      }
    } catch {
      // The box was cleared the moment she pressed send, and the restore only
      // ran on a RETURNED failure. A thrown one deleted what she wrote.
      setText(body)
      setSendError("You may have lost signal. Your message is back in the box — try again.")
    } finally {
      setSending(false)
    }
  }

  // "mine" = messages from the current viewer's side
  const isMine = (m: Message) => (asCoach ? m.from_coach : !m.from_coach)

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: "#090c14" }}>
      <header className="shrink-0 px-5 py-3.5" style={{ background: "rgba(9,12,20,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={backHref} className="p-2 -ml-2 rounded-lg shrink-0" style={{ color: "#7e8a9e" }}><ArrowLeft size={20} /></Link>
          {/* Prototype-style identity block: avatar + presence dot + reply-time hint */}
          <div className="relative shrink-0">
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(45,212,191,0.14)", color: "#5eead4" }}>
              {(asCoach ? title.split("·").pop() : "C")?.trim().charAt(0).toUpperCase() || "C"}
            </div>
            <div className="absolute right-0 bottom-[1px] w-[11px] h-[11px] rounded-full" style={{ background: "#34d399", border: "2.5px solid #0a0d14" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold truncate" style={{ color: "#e8eaf0" }}>{title}</h1>
            <p className="text-[11.5px] mt-0.5" style={{ color: "#7e8a9e" }}>
              {asCoach ? "Your client · replies land in their app" : "Your coach · usually replies within a day"}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm mt-10" style={{ color: "#7e8a9e" }}>
              {asCoach ? "No messages yet — say hello to your client." : "No messages yet. Ask your coach anything 💚"}
            </p>
          )}
          {messages.map((m) => {
            const mine = isMine(m)
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[78%] px-3.5 py-2.5 text-[13.5px]" style={{
                  background: mine ? "rgba(45,212,191,0.13)" : "rgba(255,255,255,0.05)",
                  border: mine ? "1px solid rgba(45,212,191,0.22)" : "1px solid rgba(255,255,255,0.06)",
                  color: "#e8eaf0",
                  borderRadius: mine ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                  lineHeight: 1.5,
                }}>
                  <span className="whitespace-pre-wrap break-words">{m.body}</span>
                  <span className="block text-[10px] mt-1" style={{ color: mine ? "rgba(94,234,212,0.6)" : "#5a6578", textAlign: mine ? "right" : "left" }}>
                    {new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </main>

      {sendError && (
        <p className="px-4 pb-1.5 text-[11.5px]" style={{ color: "#f59e0b", lineHeight: 1.5 }} role="alert">{sendError}</p>
      )}
      <div className="shrink-0 px-4 py-3" style={{ background: "rgba(9,12,20,0.9)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 px-4 py-3 rounded-2xl text-sm resize-none focus:outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0", maxHeight: 120 }}
          />
          <button onClick={send} disabled={sending || !text.trim()} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#2dd4bf", color: "#04121a", opacity: text.trim() ? 1 : 0.5 }}>
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
