# ThyroWell — UX Simplification

**Status:** Phases 0–8 shipped 14 Sep 2026 (commits 834b88b → Phase 8). Real-device Android testing still to do.
**Owner:** Swapnil
**Goal:** cut the app's surface area so a tired 45-year-old woman on a mid-range Android can use it correctly on the first try without asking the coach.

---

## How to run this

Run **one phase per Claude Code session**. For each phase: plan mode, review, implement, `/diff`, `./node_modules/.bin/next build`, test on a real Android device, push, `/clear`.

Phases 1–5 are client-side and ordered by impact. Phases 6–8 are coach-side. Phase 0 is measurement and runs first.

---

## Global constraints — apply to every phase

- `pnpm` only. Never `npm` or `yarn` — it creates `package-lock.json` and breaks Vercel deploys.
- Next.js 16.3: middleware is `proxy.ts`, server-action cache invalidation uses `updateTag()`. Read `node_modules/next/dist/docs/` before touching framework code.
- Any DB change goes in a **new numbered migration** in `supabase/migrations` (next is 030), with RLS policies in the same file. Never edit an applied migration.
- Android WebView traps: never put a `<button>` inside a `<Link>`. Never use `AnimatePresence mode="wait"` on step flows.
- No doctor-referral or medical warnings in client-facing copy. No self-serve account deletion.
- No client health data, PDFs or DB dumps into the repo.
- Every phase must pass `./node_modules/.bin/next build` before push.
- **Do not delete data.** Removing a screen means removing the route, not dropping the table.

---

## Phase 0 — Baseline measurement

- Call `/api/dbping` with `CRON_SECRET`, record function region and query timings.
- Lighthouse mobile on `/dashboard`, `/dashboard/food`, `/dashboard/check-in`: LCP, TBT, total JS transferred.
- `next build` First Load JS per route.
- Write it all into `docs/perf-baseline.md`.

**Acceptance:** `docs/perf-baseline.md` exists with real numbers, not estimates.

## Phase 1 — Collapse eight destinations into three

Tabs become **Today** (meals, movement, daily log, check-in prompt when due, coach feedback, lesson card), **Progress** (trends, milestones, photos, labs, thyroid profile) and **Coach** (messages). Account moves to a header icon. `/dashboard/food` and `/dashboard/move` stay as drill-downs reached from Today; `/dashboard/health` content moves inside Progress; lessons surface as a card on Today.

**Acceptance:** three tabs plus an account icon; every Food/Move action within two taps of Today; old routes still render. **Don't** merge the Food/Move code into Today.

## Phase 2 — Make Today single-focus and time-aware

One primary block above the fold, by device-local time and state: check-in due → check-in card; unread coach feedback → feedback; before 11:00 → next meal; 11:00–18:00 → movement; after 18:00 → daily log; log complete → "done for today". Everything else in a secondary area; weight, scores and streak out of the primary block.

**Acceptance:** one primary action above the fold at 360×640; at 21:00 the daily log shows without scrolling; Week 0 keeps its simpler version.

## Phase 3 — One source of truth for logging

`meal_logs` is the source for meals and `exercise_logs` for exercises; `daily_logs.meals_followed` and `workout_done` are derived. Steps stay a direct tap. The three-tap card shows derived state; taps write through to the underlying tables. Backfill existing rows; drop nothing.

**Acceptance:** ticking a meal in meal detail updates the Today count immediately; finishing the Move walkthrough leaves exercises ticked; no fact can be entered twice with conflicting values.

## Phase 4 — Weekly check-in: seven steps to three

Default flow: weight → how the week felt (tap scale) → one optional line. Measurements only in the first week of a month. Symptoms behind "add more detail". Draft saved after every step. Error boundary offers "resume", not "start fresh".

**Acceptance:** completable in under 45 seconds without a keyboard; a killed app resumes at the same step; old check-ins still render in coach review. **Don't** remove table fields.

## Phase 5 — Remove browser-side OCR

Client photographs or uploads the report → stored via `/api/upload` → coach notified → coach enters values. Remove `tesseract.js`; remove pdf.js unless the coach needs it rendered. `/api/file` ownership checks still apply.

**Acceptance:** `tesseract.js` gone from `package.json` and build output; `/dashboard` First Load JS delta recorded; coach can enter values and trends render.

## Phase 6 — One coach worklist

One urgency-sorted list on `/coach`, each row naming its reason in plain words. Engagement becomes a filter; pending reviews become rows. `lib/coach/alerts.ts` and `engagement.ts` stay as the scoring inputs.

**Acceptance:** one list above the fold; every row names its reason without a tap; nothing that raised an alert disappears.

## Phase 7 — Client detail on one page

One scrollable page with anchors: profile, trends, 14-day strip, check-ins, photos, plans, health. Messages stay a route with an unread-count entry in the header. Check-in and photo review open as overlays.

**Acceptance:** reviewing a check-in and writing feedback never leaves client detail; push-on-feedback still fires.

## Phase 8 — Plan editor: template-first

"New plan" opens the template picker first, blank at the bottom. After saving, prompt once to save as a template. Show template usage counts. `plan_revisions` unchanged.

**Acceptance:** a plan from a template in under 5 minutes of editing; existing plans and revisions load.

---

## Deliberately not in this plan

- The scoring system on Today (see open questions).
- Onboarding vs the three-screen tour overlap.
- Legacy tables (`daily_habits`, `email_reminders`, `meal_tracking`, `workout_tracking`, `testimonials`).
- Email/SMTP, magic links, iOS.
- Hosting, R2, cron migration.

## Open questions for Swapnil

1. **The score** — transparent and forgiving, non-decreasing, or dropped in favour of the streak?
2. **Onboarding vs tour** — which one goes?
3. **Check-in day** — fixed weekday, or per client from her start date?
4. **Photos** — prompt weekly, fortnightly or monthly?

### Answers (14 Sep 2026)

1. **Score:** removed from Today. Streak and weight stay in the secondary area; trends stay on Progress.
2. **Onboarding vs tour:** out of scope; both kept, tour copy updated to the three tabs.
3. **Check-in day:** per client, due 7 days after her last check-in (or start date) — the rule `/api/cron/reminders` already uses.
4. **Photos:** monthly — week 4+ and newest photo set 28+ days old.
5. **Doctor wording:** keep the Terms, Privacy, onboarding consent and landing disclaimers; keep "discuss with your doctor" on health and lab screens and wherever tablet timing appears. Remove doctor-referral lines only from meal and workout plan content and from Settings.
