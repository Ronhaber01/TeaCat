import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import OneSignalProvider from '@/components/OneSignalProvider'

export const metadata: Metadata = {
  title: 'TeaCat — NYC Nightlife',
  description: 'Other platforms sell tickets. TeaCat finds your next adventure.',
  manifest: '/manifest.json',
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
  themeColor: '#7B2EFF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#111111] text-white" style={{ maxWidth: 430, margin: '0 auto' }}>
        <AuthProvider>
          <OneSignalProvider>
            {children}
          </OneSignalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
