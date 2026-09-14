/**
 * First Load JS per app route, from a finished `next build`.
 *
 * Next 16 with Turbopack no longer prints the size column in the build output,
 * so this reads what the build wrote: the shared root chunks from
 * build-manifest.json plus each route's entry chunks from its client-reference
 * manifest, deduplicated, and reports raw and gzipped bytes.
 *
 * Run after a build:  node scripts/measure-first-load.mjs [/dashboard ...]
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

const NEXT = ".next"
const shared = JSON.parse(readFileSync(join(NEXT, "server/app/dashboard/page/build-manifest.json"), "utf8"))
const root = [...(shared.polyfillFiles || []), ...(shared.rootMainFiles || [])]

function manifests(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) manifests(p, out)
    else if (f === "page_client-reference-manifest.js") out.push(p)
  }
  return out
}

const size = new Map()
function bytes(file) {
  if (!size.has(file)) {
    const p = join(NEXT, file.replace(/^\/_next\//, ""))
    if (!existsSync(p)) return size.set(file, [0, 0]).get(file)
    const buf = readFileSync(p)
    size.set(file, [buf.length, gzipSync(buf).length])
  }
  return size.get(file)
}

const only = process.argv.slice(2)
const rows = []
for (const m of manifests(join(NEXT, "server/app"))) {
  const src = readFileSync(m, "utf8")
  const g = {}
  new Function("globalThis", src)(g)
  for (const [key, man] of Object.entries(g.__RSC_MANIFEST || {})) {
    const route = key.replace(/\/page$/, "") || "/"
    if (only.length && !only.includes(route)) continue
    const files = new Set(root)
    for (const list of Object.values(man.entryJSFiles || {})) for (const f of list) if (f.endsWith(".js")) files.add(f)
    let raw = 0, gz = 0
    for (const f of files) { const [r, z] = bytes(f); raw += r; gz += z }
    rows.push({ route, raw, gz })
  }
}
rows.sort((a, b) => a.route.localeCompare(b.route))
console.log("route".padEnd(42), "raw KB".padStart(8), "gzip KB".padStart(8))
for (const r of rows) console.log(r.route.padEnd(42), (r.raw / 1024).toFixed(0).padStart(8), (r.gz / 1024).toFixed(0).padStart(8))
