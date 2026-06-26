'use client'

import { useState, useEffect } from 'react'
import { getDeferredInstallPrompt, clearDeferredInstallPrompt } from './OneSignalProvider'
import { requestNotificationPermission } from '@/lib/onesignal'

interface Props {
  onComplete: () => void
}

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState<'install' | 'notify'>('install')
  const [platform, setPlatform] = useState<'ios' | 'other' | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua)
    setPlatform(ios ? 'ios' : 'other')
    setIsStandalone(
      (navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    )
    setCanInstall(getDeferredInstallPrompt() !== null)
  }, [])

  const handleInstall = async () => {
    const prompt = getDeferredInstallPrompt()
    if (prompt) {
      await prompt.prompt()
      await prompt.userChoice
      clearDeferredInstallPrompt()
    }
    setStep('notify')
  }

  const handleNotify = async () => {
    await requestNotificationPermission()
    onComplete()
  }

  const showInstallStep = !isStandalone && (canInstall || platform === 'ios')

  if (step === 'install' && showInstallStep) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col px-6 pt-16 pb-10" style={{ background: '#111111' }}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
            style={{ background: '#7B2EFF', boxShadow: '0 0 40px rgba(123,46,255,0.35)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-white font-black text-3xl mb-3">You are in.</h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            Add TeaCat to your home screen for one-tap access. No browser needed.
          </p>
          {platform === 'ios' && (
            <div className="mt-6 rounded-2xl p-4 text-left w-full" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
              <p className="text-white text-sm font-semibold mb-2">On iPhone:</p>
              <p className="text-gray-400 text-sm">1. Tap the share icon at the bottom of Safari</p>
              <p className="text-gray-400 text-sm mt-1">2. Select "Add to Home Screen"</p>
              <p className="text-gray-400 text-sm mt-1">3. Tap "Add"</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {canInstall && (
            <button onClick={handleInstall}
              className="w-full font-bold text-white rounded-2xl"
              style={{ height: 56, background: '#7B2EFF', fontSize: 16 }}>
              Add to Home Screen
            </button>
          )}
          <button onClick={() => setStep('notify')}
            style={{ height: 48, color: '#6B7280', fontSize: 14, background: 'transparent' }}
            className="w-full font-medium rounded-2xl">
            {platform === 'ios' ? 'I did it, continue' : 'Skip for now'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col px-6 pt-16 pb-10" style={{ background: '#111111' }}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: '#111111', border: '2px solid #A3FF12', boxShadow: '0 0 40px rgba(163,255,18,0.2)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <h1 className="text-white font-black text-3xl mb-3">Never miss a drop.</h1>
        <p className="text-gray-400 text-base leading-relaxed max-w-xs">
          Get notified when new events drop near you, when tickets run low, and the night before your event.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={handleNotify}
          className="w-full font-bold text-black rounded-2xl"
          style={{ height: 56, background: '#A3FF12', fontSize: 16 }}>
          Turn On Notifications
        </button>
        <button onClick={onComplete}
          style={{ height: 48, color: '#6B7280', fontSize: 14, background: 'transparent' }}
          className="w-full font-medium">
          Maybe later
        </button>
      </div>
    </div>
  )
}
