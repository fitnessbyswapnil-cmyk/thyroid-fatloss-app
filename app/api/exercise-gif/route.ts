import { type NextRequest, NextResponse } from 'next/server'
import { get, put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

/**
 * Exercise demo GIF proxy + permanent cache.
 *
 * Client/coach plan views load demos via <img src="/api/exercise-gif?id=0001">.
 * The GIFs come from ExerciseDB, whose free plan serves them from an
 * authenticated /image endpoint (no public URL, and bulk download trips the
 * quota). So we fetch each GIF lazily ON FIRST VIEW, store it to our own Blob,
 * and serve from Blob forever after — only a few dozen demos are ever assigned,
 * which stays far under the free quota, and each is a one-time fetch.
 *
 * Requires RAPIDAPI_KEY in the server environment (add it in Vercel → Settings
 * → Environment Variables, same value as .env.local).
 */
const HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com'
const KEY = process.env.RAPIDAPI_KEY
const CACHE = 'private, max-age=604800, immutable'

export async function GET(request: NextRequest) {
  // Any signed-in app user (client or coach) may view demos.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = (request.nextUrl.searchParams.get('id') || '').trim()
  if (!/^[A-Za-z0-9_-]{1,24}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  const pathname = `exercise-demos/${id}.gif`

  // 1) Serve the cached copy if we already fetched this one.
  try {
    const cached = await get(pathname, { access: 'private' })
    if (cached && cached.stream) {
      return new NextResponse(cached.stream, {
        headers: { 'Content-Type': cached.blob?.contentType || 'image/gif', 'Cache-Control': CACHE },
      })
    }
  } catch { /* not cached yet — fall through to fetch */ }

  // 2) Cache miss: fetch once from ExerciseDB, store, serve.
  if (!KEY) return NextResponse.json({ error: 'RAPIDAPI_KEY not configured on server' }, { status: 500 })
  const headers = { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': HOST }
  const candidates = [
    `/image?exerciseId=${id}&resolution=360`,
    `/image?exerciseId=${id}&resolution=180`,
    `/image?exerciseId=${id}`,
  ]
  let buf: Buffer | null = null
  let ct = 'image/gif'
  for (const path of candidates) {
    try {
      const r = await fetch(`https://${HOST}${path}`, { headers })
      const c = r.headers.get('content-type') || ''
      if (r.ok && c.includes('image')) {
        buf = Buffer.from(await r.arrayBuffer())
        ct = c
        break
      }
    } catch { /* try next candidate */ }
  }
  if (!buf || buf.length < 500) {
    return new NextResponse('Demo unavailable', { status: 404 })
  }

  // Store for next time (best effort — serving still works if this fails).
  try { await put(pathname, buf, { access: 'private', contentType: ct }) } catch { /* ignore */ }

  return new NextResponse(buf, { headers: { 'Content-Type': ct, 'Cache-Control': CACHE } })
}
