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
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollDown = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  useEffect(() => { scrollDown() }, [messages.length])

  // Poll for new messages every 12s while the screen is open.
  useEffect(() => {
    const t = setInterval(async () => {
      const fresh = await listMessages(clientId)
      setMessages(fresh)
    }, 12000)
    return () => clearInterval(t)
  }, [clientId])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setText("")
    const res = await sendMessage(body, clientId)
    if (res.success) setMessages(await listMessages(clientId))
    else setText(body)
    setSending(false)
  }

  // "mine" = messages from the current viewer's side
  const isMine = (m: Message) => (asCoach ? m.from_coach : !m.from_coach)

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: "#fdfbf7" }}>
      <header className="shrink-0 px-5 py-3.5" style={{ background: "rgba(253, 251, 247, 0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid #e2dbcd" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={backHref} className="p-2 -ml-2 rounded-lg shrink-0" style={{ color: "#8b867c" }}><ArrowLeft size={20} /></Link>
          {/* Prototype-style identity block: avatar + presence dot + reply-time hint */}
          <div className="relative shrink-0">
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(21, 94, 86,0.14)", color: "#4a8a80" }}>
              {(asCoach ? title.split("·").pop() : "C")?.trim().charAt(0).toUpperCase() || "C"}
            </div>
            <div className="absolute right-0 bottom-[1px] w-[11px] h-[11px] rounded-full" style={{ background: "#155e56", border: "2.5px solid #fdfbf7" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold truncate" style={{ color: "#1c1d20" }}>{title}</h1>
            <p className="text-[11.5px] mt-0.5" style={{ color: "#8b867c" }}>
              {asCoach ? "Your client · replies land in their app" : "Your coach · usually replies within a day"}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm mt-10" style={{ color: "#8b867c" }}>
              {asCoach ? "No messages yet — say hello to your client." : "No messages yet. Ask your coach anything 💚"}
            </p>
          )}
          {messages.map((m) => {
            const mine = isMine(m)
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[78%] px-3.5 py-2.5 text-[13.5px]" style={{
                  background: mine ? "rgba(21, 94, 86,0.13)" : "#f4f0e8",
                  border: mine ? "1px solid rgba(21, 94, 86,0.22)" : "1px solid #e2dbcd",
                  color: "#1c1d20",
                  borderRadius: mine ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                  lineHeight: 1.5,
                }}>
                  <span className="whitespace-pre-wrap break-words">{m.body}</span>
                  <span className="block text-[10px] mt-1" style={{ color: mine ? "rgba(94,234,212,0.6)" : "#a09a8e", textAlign: mine ? "right" : "left" }}>
                    {new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="shrink-0 px-4 py-3" style={{ background: "rgba(28, 29, 32, 0.45)", borderTop: "1px solid #e2dbcd", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder="Type a message…"
            className="flex-1 px-4 py-3 rounded-2xl text-sm resize-none focus:outline-none"
            style={{ background: "#f4f0e8", border: "1px solid #e2dbcd", color: "#1c1d20", maxHeight: 120 }}
          />
          <button onClick={send} disabled={sending || !text.trim()} className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#155e56", color: "#fdfbf7", opacity: text.trim() ? 1 : 0.5 }}>
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
