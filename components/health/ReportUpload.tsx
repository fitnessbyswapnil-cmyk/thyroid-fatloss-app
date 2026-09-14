"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Check, Clock, FileUp, Loader2 } from "lucide-react"
import { preparePhoto } from "@/lib/photos/prepare"
import { markLabReportEntered, registerLabReport, type LabReport } from "@/app/actions/health"

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const
const when = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })

/**
 * Client: send a blood report to the coach — a photo of the paper, or the PDF
 * the lab emailed. No reading of the report happens on the phone; the coach
 * enters the values, because a misread thyroid number is worse than none.
 */
export function ReportUpload({ reports }: { reports: LabReport[] }) {
  const router = useRouter()
  const camera = useRef<HTMLInputElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const send = async (f: File | undefined) => {
    if (!f) return
    setBusy(true)
    setError(null)
    setSent(false)
    try {
      const isPdf = f.type === "application/pdf"
      const blob = isPdf ? f : (await preparePhoto(f)).blob
      const form = new FormData()
      form.append("file", blob, isPdf ? f.name : `report-${Date.now()}.jpg`)
      form.append("type", "lab-report")
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.pathname) throw new Error(json?.error || "Upload failed. Please try again.")
      const reg = await registerLabReport({ pathname: json.pathname, contentType: isPdf ? "application/pdf" : "image/jpeg" })
      if (!reg.success) throw new Error(reg.error || "Upload failed. Please try again.")
      setSent(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.")
    } finally {
      setBusy(false)
      if (camera.current) camera.current.value = ""
      if (file.current) file.current.value = ""
    }
  }

  return (
    <div className="p-5 rounded-2xl" style={card}>
      <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>Send your blood report</h3>
      <p className="text-[12.5px] mt-1" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>
        Take a clear photo of each page, or upload the PDF from the lab. Your coach adds the numbers to your trends.
      </p>

      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
      <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => send(e.target.files?.[0])} />

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button onClick={() => camera.current?.click()} disabled={busy} className="h-12 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "#2dd4bf", color: "#06231f" }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />} Take a photo
        </button>
        <button onClick={() => file.current?.click()} disabled={busy} className="h-12 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "rgba(255,255,255,0.06)", color: "#e8eaf0", border: "1px solid rgba(255,255,255,0.1)" }}>
          <FileUp size={16} /> Upload file
        </button>
      </div>

      {sent && <p className="text-xs mt-3 inline-flex items-center gap-1" style={{ color: "#2dd4bf" }}><Check size={13} /> Sent to your coach. Add another page if there is one.</p>}
      {error && <p className="text-xs mt-3" style={{ color: "#fb7185" }}>{error}</p>}

      {reports.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {reports.slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-center justify-between text-[12.5px] py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#a9b2c1" }}>Report · {when(r.uploaded_at)}</span>
              {r.entered_at ? (
                <span className="inline-flex items-center gap-1" style={{ color: "#2dd4bf" }}><Check size={13} /> Added to your trends</span>
              ) : (
                <span className="inline-flex items-center gap-1" style={{ color: "#f59e0b" }}><Clock size={13} /> With your coach</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] mt-3" style={{ color: "#5a6578" }}>For tracking only — always discuss results with your doctor.</p>
    </div>
  )
}

/** Coach: the client's uploaded reports, newest first, to open and enter. */
export function CoachReports({ reports }: { reports: LabReport[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const pending = reports.filter((r) => !r.entered_at).length

  const toggle = async (r: LabReport) => {
    setBusy(r.id)
    const res = await markLabReportEntered(r.id, !r.entered_at)
    setBusy(null)
    if (res.success) router.refresh()
  }

  return (
    <div className="p-5 rounded-2xl" style={pending ? { background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" } : card}>
      <h3 className="font-semibold" style={{ color: "#e8eaf0" }}>
        Uploaded reports {pending > 0 && <span className="text-[12px] font-medium" style={{ color: "#f59e0b" }}>· {pending} to enter</span>}
      </h3>
      {reports.length === 0 ? (
        <p className="text-[12.5px] mt-1" style={{ color: "#7e8a9e" }}>She has not uploaded a report yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <a href={`/api/file?pathname=${encodeURIComponent(r.pathname)}`} target="_blank" rel="noopener noreferrer" className="flex-1 underline underline-offset-2" style={{ color: "#e8eaf0" }}>
                {r.content_type === "application/pdf" ? "PDF" : "Photo"} · {when(r.uploaded_at)}
              </a>
              <button onClick={() => toggle(r)} disabled={busy === r.id} className="h-9 px-3 rounded-lg text-[12px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                style={r.entered_at ? { background: "rgba(45,212,191,0.12)", color: "#2dd4bf" } : { background: "#f59e0b", color: "#1a1204" }}>
                {busy === r.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {r.entered_at ? "Entered" : "Mark entered"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] mt-3" style={{ color: "#5a6578" }}>Open the report, add its values below, then mark it entered.</p>
    </div>
  )
}
