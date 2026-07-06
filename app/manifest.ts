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
    background_color: '#090c14',
    theme_color: '#090c14',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: '/icon-dark-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
  }
}
