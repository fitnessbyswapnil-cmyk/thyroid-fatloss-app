import type { Metadata, Viewport } from 'next'
import { Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { RegisterSW } from '@/components/pwa/RegisterSW'
import './globals.css'

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
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#0a0d14]">
      <head>
        {/*
          Satoshi, the body font, comes from a third party — which means a fresh
          DNS lookup, a TLS handshake, the stylesheet, and only THEN the font
          files it names. That chain is render-blocking, and on Indian mobile
          data it is comfortably half a second before the first word appears.
          Instrument Serif does not pay this: next/font self-hosts and preloads
          it from our own origin.

          preconnect warms both hops while the HTML is still parsing, which
          removes the DNS and TLS cost from the critical path. The remaining
          round trips only go away by self-hosting the woff2 files, which is a
          separate decision because it means adding font files to the repo.
        */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${instrumentSerif.variable} font-sans antialiased`}>
        {children}
        <RegisterSW />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
