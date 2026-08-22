import type { MetadataRoute } from 'next'

// PWA manifest — lets clients "Add to Home Screen" and use ThyroWell app-like
// (standalone window, dark theme). No service worker/offline layer yet.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ThyroWell',
    short_name: 'ThyroWell',
    description: 'Personalized wellness coaching for women navigating thyroid health.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F6F3ED',
    theme_color: '#F6F3ED',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ] }
}
