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
    // Splash and status bar are ink: the app opens on the greeting, which is
    // the one dark surface in the system, so the launch does not flash paper
    // and then darken.
    background_color: '#17181C',
    theme_color: '#17181C',
    icons: [
      { src: '/icons/mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ] }
}
