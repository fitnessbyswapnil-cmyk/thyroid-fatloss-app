/**
 * One-off probe: prints the RAW shape of the ExerciseDB /exercises response so
 * we can map fields correctly. Reads RAPIDAPI_KEY from .env.local.
 *   node --env-file=.env.local scripts/inspect-exercisedb.mjs
 */
const KEY = process.env.RAPIDAPI_KEY
const HOST = process.env.RAPIDAPI_HOST || 'exercisedb.p.rapidapi.com'
if (!KEY) { console.error('Missing RAPIDAPI_KEY'); process.exit(1) }

async function hit(path) {
  const res = await fetch(`https://${HOST}${path}`, {
    headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': HOST },
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = null }
  return { status: res.status, json, text }
}

const paths = ['/exercises?limit=10&offset=0', '/exercises?limit=1300&offset=0', '/status']
for (const p of paths) {
  const { status, json, text } = await hit(p)
  console.log(`\n=== GET ${p}  → HTTP ${status} ===`)
  if (!json) { console.log('  (non-JSON) ', text.slice(0, 300)); continue }
  if (Array.isArray(json)) {
    console.log(`  ARRAY of ${json.length}`)
    if (json[0]) console.log('  first item keys:', Object.keys(json[0]))
    if (json[0]) console.log('  first item:', JSON.stringify(json[0]).slice(0, 400))
  } else if (json && typeof json === 'object') {
    console.log('  OBJECT top-level keys:', Object.keys(json))
    if (json.metadata) console.log('  metadata:', JSON.stringify(json.metadata))
    const arr = json.data || json.exercises || json.results
    if (Array.isArray(arr)) {
      console.log(`  data[] length: ${arr.length}`)
      if (arr[0]) console.log('  data[0] keys:', Object.keys(arr[0]))
      if (arr[0]) console.log('  data[0]:', JSON.stringify(arr[0]).slice(0, 400))
    } else {
      console.log('  body:', JSON.stringify(json).slice(0, 400))
    }
  }
}
