"use client"

/**
 * Free, in-browser report reading. PDFs are read via their text layer
 * (pdf.js); JPEG/PNG photos fall back to on-device OCR (tesseract.js).
 * Heavy libraries are dynamically imported so they only load when a client
 * actually uploads a report. The file itself never leaves the device.
 */

/** Reconstruct reading-order lines from pdf.js text items (grouped by Y). */
function itemsToLines(items: Array<{ str: string; transform: number[] }>): string {
  const rows = new Map<number, Array<{ x: number; str: string }>>()
  for (const it of items) {
    if (!it.str?.trim()) continue
    const y = Math.round(it.transform[5] / 4) * 4 // 4px Y-tolerance buckets
    const x = it.transform[4]
    if (!rows.has(y)) rows.set(y, [])
    rows.get(y)!.push({ x, str: it.str })
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0]) // PDF Y grows upward → top rows first
    .map(([, cells]) => cells.sort((a, b) => a.x - b.x).map((c) => c.str).join(" "))
    .join("\n")
}

async function pdfToText(file: File, onStatus: (s: string) => void): Promise<string> {
  onStatus("Reading PDF…")
  const pdfjs = await import("pdfjs-dist")
  // Bundle the worker locally (no CDN dependency).
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  let text = ""
  const pages = Math.min(doc.numPages, 12)
  for (let p = 1; p <= pages; p++) {
    onStatus(`Reading PDF… page ${p}/${pages}`)
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    text += itemsToLines(content.items as never) + "\n"
  }
  return text
}

async function imageToText(file: File, onStatus: (s: string) => void): Promise<string> {
  onStatus("Scanning photo… this can take ~30s on a phone")
  const Tesseract = await import("tesseract.js")
  const result = await Tesseract.recognize(file, "eng", {
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        onStatus(`Scanning photo… ${Math.round(m.progress * 100)}%`)
      }
    },
  })
  return result.data.text || ""
}

export async function extractReportText(file: File, onStatus: (s: string) => void): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const text = await pdfToText(file, onStatus)
    // Scanned-image PDFs have no text layer — tell the caller honestly.
    if (text.replace(/\s/g, "").length > 60) return text
    onStatus("This PDF looks scanned — no text layer found")
    return ""
  }
  return imageToText(file, onStatus)
}
