import type { Metadata, Viewport } from 'next'
import { Instrument_Serif } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { RegisterSW } from '@/components/pwa/RegisterSW'
import { AndroidBackButton } from '@/components/native/AndroidBackButton'
import './globals.css'

/**
 * Satoshi, self-hosted.
 *
 * It used to come from Fontshare, which meant a DNS lookup, a TLS handshake,
 * a stylesheet, and only THEN the font files it named — a render-blocking
 * chain of round trips before the first word appeared, and the slowest part of
 * the page for a client on Indian mobile data.
 *
 * Serving the woff2 files from our own origin collapses that to zero extra
 * connections: they come from the same edge PoP as the HTML, and next/font
 * emits the @font-face and the preload itself. Fontshare's licence permits
 * self-hosting.
 *
 * Three weights, not four. Fontshare only serves 400/500/700 for Satoshi, so
 * anything asking for 600 resolves to 700 rather than silently synthesising a
 * faux-bold. `display: swap` keeps text visible in the fallback while it loads.
 */
const satoshi = localFont({
  src: [
    { path: '../public/fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/Satoshi-Medium.woff2',  weight: '500', style: 'normal' },
    { path: '../public/fonts/Satoshi-Bold.woff2',    weight: '700', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
})

// Instrument Serif for score numbers and key metrics
const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ThyroWell | Premium Wellness Coaching',
  description:
    'Personalized wellness coaching for women navigating thyroid health. Sustainable habits for nutrition, movement, sleep, and energy — with a coach in your corner.',
  applicationName: 'ThyroWell',
  manifest: '/manifest.webmanifest',
  // iOS home-screen app behaviour: launch full-screen (no Safari chrome),
  // dark status bar, and "ThyroWell" under the icon.
  appleWebApp: {
    capable: true,
    title: 'ThyroWell',
    statusBarStyle: 'black-translucent',
  },
  other: {
    // Next renders `appleWebApp.capable` as the modern, unprefixed
    // <meta name="mobile-web-app-capable">, and no longer emits the Apple one.
    // iOS below 17.4 reads ONLY the apple- prefixed tag, and without it "Add to
    // Home Screen" opens inside Safari with the address bar still there — which
    // is the difference between something that feels like an app and something
    // that feels like a bookmark.
    //
    // It also gates web push on iPhone: notifications only work from a
    // home-screen install, so a client whose install is not standalone gets no
    // reminders at all, however well the cron behaves.
    'apple-mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0d14',
  width: 'device-width',
  initialScale: 1,

  /**
   * viewportFit 'cover' is what makes env(safe-area-inset-*) return real
   * numbers on a notched iPhone. Twenty places in this app read those insets —
   * the bottom nav pill, every page's bottom padding, the loading skeletons —
   * and without this they all silently fall back to their default, which means
   * the app letterboxes with black bars top and bottom once it is installed to
   * the Home Screen. That is the difference between looking native and looking
   * like a web page in a box.
   */
  viewportFit: 'cover',

  /**
   * maximumScale and userScalable are deliberately gone.
   *
   * They were there to stop iOS zooming on input focus, which they never did —
   * iOS has ignored both for that case since iOS 10, and the real fix (a 16px
   * floor on every field) now lives in globals.css. What they DID do was block
   * pinch-zoom entirely, for a client base of women in their forties reading
   * lab values on a phone. Taking someone's ability to zoom is not a
   * reasonable price for a bug it never fixed.
   */
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#0a0d14]">
      <body className={`${satoshi.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        {children}
        <RegisterSW />
        <AndroidBackButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
