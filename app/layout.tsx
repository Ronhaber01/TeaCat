import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'TeaCat — NYC Nightlife',
  description: 'Other apps sell tickets. TeaCat finds you tonight.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TeaCat',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#111111',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#111111] text-white" style={{ maxWidth: 430, margin: '0 auto' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
