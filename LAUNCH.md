# ThyroWell — Launch Runbook

Code is done (`main` @ `2da4966`). Everything below is config + one real walkthrough.
Total time: ~25 min. Do it in this order, top to bottom.
Replace `<your-app-domain>` with your live ThyroWell URL everywhere it appears.

---

## PART A — Config (~15 min)

### 1. Vercel env vars
ThyroWell project → Settings → Environment Variables → **Production**, add:
- `NEXT_PUBLIC_SITE_URL` = `https://<your-app-domain>`  (no trailing slash)
- `NEXT_PUBLIC_PAYMENT_URL` = your enrollment payment link

While you're on this screen, **confirm these two are already present** (the Supabase/Vercel integration usually sets them — just check, don't re-create):
- `SUPABASE_SERVICE_ROLE_KEY` — without it, "Add client" invites (step 8) fail.
- `BLOB_READ_WRITE_TOKEN` — without it, plan PDFs (step 9) 403.

Then **redeploy** (Deployments → latest → Redeploy). Env changes do nothing until you redeploy.

### 2. Brevo SMTP key (do this in Brevo FIRST)
- Brevo → **SMTP & API** page → generate an **SMTP key** (NOT an API key — different credential).
- Note the **SMTP login** shown on that page and the key.
- Confirm your sender domain is **authenticated (DKIM)** and your sender address is verified, or invites land in spam.

### 3. Supabase SMTP
Supabase → Authentication → Emails → SMTP Settings → enable custom SMTP:
- Host: `smtp-relay.brevo.com`  (no leading/trailing space — Supabase won't trim it)
- Port: `587`
- Username: your Brevo SMTP login (from step 2)
- Password: the **SMTP key** (from step 2)
- Sender email: your verified domain sender · Sender name: ThyroWell
- Save.

### 4. Supabase redirect URLs
Supabase → Authentication → **URL Configuration**:
- Site URL = `https://<your-app-domain>`
- Redirect URLs → add `https://<your-app-domain>/auth/callback`

---

## PART B — Test the portal WITHOUT waiting on email (~5 min)

### 5. Seed a test client
Run from inside the ThyroWell repo (the `cd` matters — without it you'll get "cannot find module"):
```bash
cd ~/Documents/thyroid-fatloss-app
TEST_EMAIL="you@yourdomain.com" TEST_PASSWORD="TestPass123!" TEST_NAME="Test Client" \
  node --env-file=.env.local scripts/seed-test-client.mjs create
```
This makes a confirmed, active client so you can log in directly — no SMTP needed yet.

### 6. Walk the client journey
1. Open `/` — wellness copy, disclaimer in footer, Privacy/Terms links open.
2. "Get Started" → lands on `/request-access` (no signup form).
3. `/auth/login` with the seeded creds → lands on `/onboarding`.
4. Onboarding consent step → "Continue" disabled until you tick the box.
5. Finish onboarding → dashboard loads.
6. Bottom nav → Plans → "Your coach is preparing your plan."
7. Submit a weekly check-in → saves.
8. As coach (`/coach`) → open the client → Plans tab → save a meal plan (+ optional PDF).
9. Back as client → Plans → the saved plan + PDF open.
10. `/account` → "Download my data" → JSON downloads.

### 7. Clean up the test client
```bash
cd ~/Documents/thyroid-fatloss-app
TEST_EMAIL="you@yourdomain.com" node --env-file=.env.local scripts/seed-test-client.mjs delete
```

---

## PART C — The real end-to-end (proves SMTP + redirect config) (~5 min)

### 8. Invite yourself for real
As coach → "Add client" → invite an email you own.
- Email should **arrive** (check Brevo logs if not).
- The link should open `/auth/callback` → land you on `/onboarding`.

If this works, the portal is ready to put a paying client in front of.

---

## Troubleshooting — the four likely failures and their cause

| Symptom | Almost always means |
|---|---|
| Invite email never arrives | SMTP not saved, or you used an API key instead of an SMTP key, or sender not verified — check Brevo logs |
| Invite link errors / 404s | `/auth/callback` missing from Supabase Redirect URLs, OR `NEXT_PUBLIC_SITE_URL` missing / has a trailing slash |
| A page throws right after deploy | A required env var is missing — the `lib/env.ts` guard throws on purpose. Add the var, redeploy |
| Plan won't save / PDF 403 | `BLOB_READ_WRITE_TOKEN` missing in Vercel Production |

---

## Known gaps (not blockers — don't be alarmed)
- **Streak shows 0** for everyone — the column exists but nothing computes it yet. Honest, not a bug.
- **No automated tests** — the walkthrough above is the verification.

## Definition of ready
All of Part B passes **and** the real invite in Part C arrives and logs in. That's the gate. Then you can onboard your first high-ticket client through the real invite flow.
