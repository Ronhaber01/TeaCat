'use client'

import { useEffect } from 'react'
import { initOneSignal } from '@/lib/onesignal'

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
    initOneSignal()
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  return <>{children}</>
}
