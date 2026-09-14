# ThyroWell performance baseline

Measured **14 Sep 2026** on production (`https://app.swapnilumbarkarfitness.in`, commit `93d9e0f`), before the UX simplification plan (`docs/plans/2026-09-14-ux-simplification.md`).

## Database round trips — `/api/dbping`

25 sequential queries from the production function.

| Function region | Min | p50 | p95 | Max |
|---|---|---|---|---|
| sin1 | 30 ms | 38 ms | 68 ms | 117 ms |

## Lighthouse 13.4.1, mobile, performance only

Headless Chrome on a Mac, Lighthouse's default simulated mobile throttling, signed in as a throwaway client on day 16 of the programme with Nisha's live meal and workout plans and no check-ins (the Week 0 home screen). One run per page, so expect ±10% between runs.

| Page | Score | FCP | LCP | TBT | Script transferred | Total transferred |
|---|---|---|---|---|---|---|
| `/dashboard` | 88 | 1.15 s | 2.80 s | 68 ms | 216 KB | 350 KB |
| `/dashboard/food` | 98 | 1.02 s | 2.34 s | 50 ms | 166 KB | 304 KB |
| `/dashboard/check-in` | 97 | 1.11 s | 2.61 s | 64 ms | 208 KB | 329 KB |
| `/dashboard/health` | 98 | — | 2.38 s | 41 ms | 172 KB | 298 KB |
| `/dashboard/progress` | 97 | — | 2.41 s | 51 ms | 169 KB | 295 KB |

## First Load JS per route — `next build`

Next 16 with Turbopack no longer prints this column, so it is calculated by `node scripts/measure-first-load.mjs` after a build: shared root chunks plus the route's entry chunks, deduplicated.

| Route | Raw | Gzip |
|---|---|---|
| `/dashboard` | 766 KB | 243 KB |
| `/dashboard/check-in` | 736 KB | 231 KB |
| `/dashboard/food` | 608 KB | 192 KB |
| `/dashboard/move` | 617 KB | 194 KB |
| `/dashboard/health` | 629 KB | 198 KB |
| `/dashboard/progress` | 611 KB | 192 KB |
| `/dashboard/progress-photos` | 957 KB | 292 KB |
| `/dashboard/learn` | 581 KB | 182 KB |
| `/dashboard/messages` | 596 KB | 188 KB |
| `/onboarding` | 984 KB | 299 KB |
| `/account` | 839 KB | 251 KB |
| `/coach` | 985 KB | 298 KB |
| `/coach/client/[id]` | 1,040 KB | 315 KB |
| `/coach/library` | 734 KB | 232 KB |
| `/auth/login` | 827 KB | 248 KB |
| empty page (`/terms`) | 578 KB | 180 KB |

## Lab-report OCR

`tesseract.js` 7 and `pdfjs-dist` 6 are imported dynamically in `lib/labs/extract.ts`, so they are **not** in any route's First Load JS above. They load when a client picks a report to upload:

| Chunk | Raw | Gzip |
|---|---|---|
| pdf.js | 420 KB | 124 KB |
| tesseract.js loader | 17 KB | 7 KB |

Tesseract then fetches its WASM core and English language data from a CDN at runtime (several MB, not part of the build). The Phase 5 saving is therefore on the upload path and in dependency weight, not on `/dashboard` first load; the before/after row goes in the section below.

## After each phase

| Phase | Change | `/dashboard` gzip | Notes |
|---|---|---|---|
| Baseline | — | 243 KB | |
| 1–4 | Three tabs, time-aware Today, derived logging, 3-step check-in | 243 KB | `/dashboard/progress` 192 → 202 KB (health section now included); `/dashboard/check-in` 231 KB unchanged |
| 5 | Removed tesseract.js 7 and pdfjs-dist 6 | 243 KB | No First Load change — both were dynamic imports. Removed from the upload path: 124 KB gzip pdf.js chunk plus tesseract's runtime WASM and language data (several MB from a CDN). 195 lockfile lines gone. |
