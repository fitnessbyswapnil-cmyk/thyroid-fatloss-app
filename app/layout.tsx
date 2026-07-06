import type { Metadata, Viewport } from 'next'
import { Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
  generator: 'v0.app',
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
        {/* Satoshi font from Fontshare */}
        <link 
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body className={`${instrumentSerif.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
