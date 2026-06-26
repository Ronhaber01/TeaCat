'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { scheduleOneSignalInit } from '@/lib/onesignal'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level: captured before the browser auto-dismisses it
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredInstallPrompt
}

export function clearDeferredInstallPrompt(): void {
  deferredInstallPrompt = null
}

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredInstallPrompt = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', handler)
    scheduleOneSignalInit()
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="lazyOnload"
      />
      {children}
    </>
  )
}
