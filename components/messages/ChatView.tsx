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
    <div className="flex flex-col h-[100dvh]" style={{ background: "#090c14" }}>
      <header className="shrink-0 px-6 py-4" style={{ background: "rgba(9,12,20,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href={backHref} className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>{title}</h1>
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
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm" style={{
                  background: mine ? "#2dd4bf" : "rgba(255,255,255,0.06)",
                  color: mine ? "#04121a" : "#e8eaf0",
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                }}>
                  <span className="whitespace-pre-wrap break-words">{m.body}</span>
                  <span className="block text-[10px] mt-1" style={{ color: mine ? "rgba(4,18,26,0.55)" : "#7e8a9e" }}>
                    {new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </main>

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
