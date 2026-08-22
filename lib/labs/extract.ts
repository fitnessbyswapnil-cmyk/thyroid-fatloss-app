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

/**
 * Render a page to a bitmap so OCR has something to read. Scale 2 is the
 * cheapest setting at which lab-report body text stays legible to Tesseract;
 * below that, decimal points in values start disappearing, which is the worst
 * possible failure — a wrong number rather than no number.
 */
async function pageToBlob(page: { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: unknown) => { promise: Promise<void> } }): Promise<Blob | null> {
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement("canvas")
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const canvasContext = canvas.getContext("2d")
  if (!canvasContext) return null
  await page.render({ canvasContext, canvas, viewport }).promise
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))
}

async function pdfToText(
  file: File,
  onStatus: (s: string) => void
): Promise<{ text: string; usedOcr: boolean }> {
  onStatus("Reading PDF…")
  const pdfjs = await import("pdfjs-dist")
  // Bundle the worker locally (no CDN dependency).
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages = Math.min(doc.numPages, 12)

  let text = ""
  for (let p = 1; p <= pages; p++) {
    onStatus(`Reading PDF… page ${p}/${pages}`)
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    text += itemsToLines(content.items as never) + "\n"
  }
  if (text.replace(/\s/g, "").length > 60) return { text, usedOcr: false }

  // No text layer: the PDF is a scan. This used to give up and ask the client
  // to type every value in by hand, which for a scanned report meant the
  // feature did not work at all. Render the pages and read them instead.
  const ocrPages = Math.min(doc.numPages, 4)
  onStatus(`This report is a scan — reading it page by page (about ${ocrPages * 15}s)`)
  const Tesseract = await import("tesseract.js")
  const worker = await Tesseract.createWorker("eng")
  try {
    let ocr = ""
    for (let p = 1; p <= ocrPages; p++) {
      onStatus(`Reading scanned page ${p}/${ocrPages}…`)
      const blob = await pageToBlob(await doc.getPage(p) as never)
      if (!blob) continue
      const { data } = await worker.recognize(blob)
      ocr += (data.text || "") + "\n"
    }
    return { text: ocr, usedOcr: true }
  } finally {
    await worker.terminate()
  }
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

export interface ExtractResult {
  text: string
  /** True when the text came from OCR, which is likelier to misread a digit. */
  usedOcr: boolean
}

export async function extractReportText(file: File, onStatus: (s: string) => void): Promise<ExtractResult> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return pdfToText(file, onStatus)
  }
  return { text: await imageToText(file, onStatus), usedOcr: true }
}
