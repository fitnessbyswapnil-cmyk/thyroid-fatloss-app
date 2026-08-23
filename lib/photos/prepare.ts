"use client"

/**
 * Shrink a photo in the browser before it is uploaded.
 *
 * A progress photo off a modern Android is 2-5 MB, and three of them went into a
 * single server action — which Next.js caps at 1 MB unless told otherwise. So
 * the guided flow, the one reached from inside the check-in, could not complete
 * an upload with real photographs at all. The Week 0 copy tells her "today's the
 * only day you can capture your starting point"; failing there is expensive in a
 * way most upload bugs are not.
 *
 * Downscaling also costs her far less mobile data, which matters more here than
 * the pixels do: nobody compares body composition at 4000px.
 */

/** Long edge in pixels. Comfortably enough to see posture and outline. */
const MAX_EDGE = 1440
const QUALITY = 0.82

export interface PreparedPhoto {
  blob: Blob
  /** Bytes before shrinking, so the saving can be reported honestly. */
  originalBytes: number
}

export async function preparePhoto(input: Blob): Promise<PreparedPhoto> {
  const originalBytes = input.size

  // Anything the browser cannot decode is passed through untouched rather than
  // dropped — an unshrunk photo is better than a lost one.
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return { blob: input, originalBytes }
  }

  try {
    const bitmap = await createImageBitmap(input)
    const { width, height } = bitmap
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height))

    // Already small enough — re-encoding would only lose quality.
    if (scale >= 1 && originalBytes <= 900_000) {
      bitmap.close?.()
      return { blob: input, originalBytes }
    }

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close?.()
      return { blob: input, originalBytes }
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()

    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    )
    if (!out || out.size >= originalBytes) return { blob: input, originalBytes }
    return { blob: out, originalBytes }
  } catch {
    return { blob: input, originalBytes }
  }
}

/**
 * Upload one photo through the API route rather than a server action.
 *
 * Route handlers accept a far larger body than the 1 MB server-action default,
 * and one request per photo means a failure costs her one retake rather than
 * all three.
 */
export async function uploadPhoto(blob: Blob, angle: string): Promise<string> {
  const prepared = await preparePhoto(blob)
  const form = new FormData()
  form.append("file", prepared.blob, `${angle}-${Date.now()}.jpg`)
  // The route names this field `type` and builds the blob path from it,
  // keeping the `${user.id}/progress-<angle>/` prefix that /api/file's
  // ownership check relies on.
  form.append("type", `progress-${angle}`)

  const res = await fetch("/api/upload", { method: "POST", body: form })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail?.error || `Could not upload your ${angle} photo. Please try again.`)
  }
  const json = await res.json()
  const path = json?.pathname
  if (!path) throw new Error(`Could not upload your ${angle} photo. Please try again.`)
  return path as string
}
