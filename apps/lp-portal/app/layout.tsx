import type { Metadata, Viewport } from 'next'
import { Fraunces, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-fraunces',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'NEV LP Portal',
    template: '%s — NEV LP Portal',
  },
  description: 'New Era Ventures — Limited Partner Portal',
  openGraph: {
    title: 'NEV LP Portal',
    description: 'New Era Ventures — Limited Partner Portal',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0A0A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={[
        fraunces.variable,
        spaceGrotesk.variable,
        jetbrainsMono.variable,
      ].join(' ')}
    >
      <body>{children}</body>
    </html>
  )
}
