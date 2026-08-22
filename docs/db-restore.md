# Restoring the database

Backups run nightly at 18:00 UTC (23:30 IST) via
`.github/workflows/db-backup.yml`. Each one is a `pg_dump` of the `public`
schema plus the `auth.users` / `auth.identities` rows, gzipped, encrypted with
GPG AES256, and stored in **private** Vercel Blob under `db-backups/`.

Thirty days are kept, and at least the 7 most recent survive regardless of age
so a long unnoticed outage can't leave you with nothing.

## What you need

- `BACKUP_PASSPHRASE` — the GPG passphrase (GitHub repository secret)
- `BLOB_READ_WRITE_TOKEN` — to read the file back out of Blob
- `psql` and `gpg` locally

Both are required. Blob is private, so the token alone gets you the file and
the passphrase alone gets you nothing without it. Losing the passphrase means
the backups are unrecoverable — there is no reset.

## 1. List what's available

```bash
cd ~/Documents/thyroid-fatloss-app && set -a && . ./.env.local && set +a && node -e 'import("@vercel/blob").then(async({list})=>{const{blobs}=await list({prefix:"db-backups/",token:process.env.BLOB_READ_WRITE_TOKEN});blobs.sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt)).forEach(b=>console.log(b.uploadedAt.slice(0,10),(b.size/1024).toFixed(0)+"KB",b.pathname))})'
```

## 2. Download one

Replace the date with the backup you want.

```bash
cd ~/Documents/thyroid-fatloss-app && set -a && . ./.env.local && set +a && node -e 'import("@vercel/blob").then(async({head})=>{const b=await head("db-backups/thyrowell-2026-08-22.sql.gz.gpg",{token:process.env.BLOB_READ_WRITE_TOKEN});const r=await fetch(b.downloadUrl);require("fs").writeFileSync("/tmp/restore.sql.gz.gpg",Buffer.from(await r.arrayBuffer()));console.log("saved /tmp/restore.sql.gz.gpg")})'
```

## 3. Decrypt

You will be prompted for the passphrase.

```bash
gpg --decrypt --output /tmp/restore.sql.gz /tmp/restore.sql.gz.gpg && gunzip -f /tmp/restore.sql.gz && echo "ready: /tmp/restore.sql"
```

## 4. Restore

**Restore into a new or empty project first and check it before touching
anything live.** Loading a dump over a working database will overwrite it.

```bash
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" -f /tmp/restore.sql
```

Then delete the plaintext:

```bash
rm -f /tmp/restore.sql /tmp/restore.sql.gz /tmp/restore.sql.gz.gpg
```

## Known limits

- The `auth` rows restore user records, but Supabase-managed auth DDL is not
  included — it would conflict with a fresh project's own. Users may need a
  password reset after restoring into a new project.
- Storage buckets and Blob files are not covered. This is the Postgres
  database only.
- Scheduled GitHub workflows are disabled automatically after 60 days with no
  repository activity. If you stop pushing for two months, check the job is
  still enabled.

## This also keeps the project awake

Supabase pauses free-tier projects after ~7 days of inactivity. This job
connects nightly, which counts as activity — so it doubles as the keep-alive.
The Vercel reminder cron at 03:30 UTC touches the database too, so two
independent systems keep it alive; either one alone is sufficient.
