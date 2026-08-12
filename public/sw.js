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

// ── Web push ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'ThyroWell', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'ThyroWell'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // Same tag replaces rather than stacks, so a client never wakes to five
      // copies of the same nudge.
      tag: payload.tag || 'thyrowell',
      renotify: false,
      data: { url: payload.url || '/dashboard' },
    })
  )
})

// Focus an already-open tab if there is one, rather than piling up new ones.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(target)
          return c.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
