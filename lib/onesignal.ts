// lib/onesignal.ts
// OneSignal integration using CDN SDK (no npm package needed).
// The SDK script is injected by OneSignalProvider via next/script.
// All calls use window.OneSignalDeferred so they queue safely before the SDK loads.

const APP_ID = 'ab8df582-b1ac-43cf-b969-597798b94341'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>
    OneSignal?: any
  }
}

function run(fn: (sdk: any) => void): void {
  if (typeof window === 'undefined') return
  if (window.OneSignal) {
    fn(window.OneSignal)
  } else {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(fn)
  }
}

export function scheduleOneSignalInit(): void {
  if (typeof window === 'undefined') return
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      await OneSignal.init({
        appId: APP_ID,
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        notifyButton: { enable: false },
      })
    } catch (err) {
      console.error('[OneSignal] init error', err)
    }
  })
}

export function requestNotificationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    run(async (OneSignal) => {
      try {
        const accepted = await OneSignal.Notifications.requestPermission()
        resolve(!!accepted)
      } catch {
        resolve(false)
      }
    })
  })
}

export function identifyUser(userId: string, email?: string): void {
  run((OneSignal) => {
    try {
      OneSignal.login(userId)
      if (email) OneSignal.User.addEmail(email)
    } catch (err) {
      console.error('[OneSignal] identify error', err)
    }
  })
}

export function logoutOneSignal(): void {
  run((OneSignal) => {
    try { OneSignal.logout() } catch {}
  })
}
