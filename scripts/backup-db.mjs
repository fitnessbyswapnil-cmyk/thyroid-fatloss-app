#!/usr/bin/env node
/**
 * Upload an encrypted database dump to Vercel Blob and rotate old ones.
 *
 * Blob is private (reads require the token), and the file arriving here is
 * already GPG-encrypted, so client health data is protected by two independent
 * layers. Neither alone is trusted.
 *
 * Usage: node scripts/backup-db.mjs <encrypted-file>
 */
import { readFileSync, statSync } from 'node:fs'
import { basename } from 'node:path'
import { put, list, del } from '@vercel/blob'

const PREFIX = 'db-backups/'
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 30)
/** Never rotate below this many, however old they are — a long outage must not
 *  leave us with nothing while the job is failing unnoticed. */
const ALWAYS_KEEP = 7
/** A dump this small means pg_dump failed. Uploading it would rotate away good
 *  backups and replace them with garbage, which is worse than failing loudly. */
const MIN_BYTES = 1024

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/backup-db.mjs <encrypted-file>')
  process.exit(1)
}

const token = process.env.BLOB_READ_WRITE_TOKEN
if (!token) {
  console.error('✗ BLOB_READ_WRITE_TOKEN is not set')
  process.exit(1)
}

const size = statSync(file).size
if (size < MIN_BYTES) {
  console.error(`✗ ${basename(file)} is only ${size} bytes — the dump almost certainly failed.`)
  console.error('  Refusing to upload, so existing good backups are left alone.')
  process.exit(1)
}

const name = basename(file)
const pathname = `${PREFIX}${name}`

const blob = await put(pathname, readFileSync(file), {
  access: 'private',
  contentType: 'application/octet-stream',
  addRandomSuffix: false,
  allowOverwrite: true,
  token,
})
console.log(`✓ uploaded ${name} (${(size / 1024).toFixed(1)} KB)`)

// Rotate.
const { blobs } = await list({ prefix: PREFIX, token })
const sorted = [...blobs].sort(
  (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
)
const cutoff = Date.now() - RETENTION_DAYS * 86400_000
const stale = sorted
  .slice(ALWAYS_KEEP)
  .filter((b) => new Date(b.uploadedAt).getTime() < cutoff)

for (const b of stale) {
  await del(b.url, { token })
  console.log(`  rotated out ${b.pathname}`)
}

console.log(
  `✓ ${sorted.length - stale.length} backup(s) retained · newest ${name} · keeping ${RETENTION_DAYS}d (min ${ALWAYS_KEEP})`
)
if (blob.pathname !== pathname) console.log(`  stored at ${blob.pathname}`)
