/**
 * Minimal service worker — its only jobs are (1) make the app installable on
 * Android (Chrome requires a fetch handler) and (2) show a friendly offline
 * page for navigations. It deliberately does NOT cache app pages or API
 * responses, so clients never see stale plans, check-ins, or auth state.
 */
const CACHE = 'thyrowell-shell-v1'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop any older shell caches
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  // Only intervene on full-page navigations: try the network, and if the
  // device is offline, show the offline page. Everything else passes through.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)))
  }
})
