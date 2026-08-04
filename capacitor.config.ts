import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native (Android/iOS) shell for ThyroWell.
 *
 * The app is server-rendered on Vercel, so the native shell loads the live site
 * (server.url). Upside: every Vercel deploy updates the app instantly — no
 * rebuild or re-submit needed. The bundled `capacitor-shell/` is only a loading
 * fallback shown before the site connects.
 */
const config: CapacitorConfig = {
  appId: 'in.swapnilumbarkarfitness.thyrowell',
  appName: 'ThyroWell',
  webDir: 'capacitor-shell',
  server: {
    url: 'https://app.swapnilumbarkarfitness.in',
    androidScheme: 'https',
  },
  backgroundColor: '#0a0d14',
}

export default config
