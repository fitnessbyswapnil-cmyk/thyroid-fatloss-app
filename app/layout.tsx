import type { Metadata, Viewport } from 'next'
import { Instrument_Sans, Newsreader } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { RegisterSW } from '@/components/pwa/RegisterSW'
import './globals.css'

// Self-hosted through next/font rather than a stylesheet link: one less
// render-blocking request, which matters on the mid-range Android phones this
// is actually used on.
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-loaded',
  display: 'swap' })

// Newsreader carries the display moments — the greeting, "11 kg down".
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif-loaded',
  display: 'swap' })

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
    statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)' },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)' },
      {
        url: '/icon.svg',
        type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png' } }

export const viewport: Viewport = {
  themeColor: '#F6F3ED',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false }

export default function RootLayout({
  children }: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-[#fdfbf7]">
      <head>
      </head>
      <body className={`${instrumentSans.variable} ${newsreader.variable} font-sans antialiased`}>
        {children}
        <RegisterSW />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
