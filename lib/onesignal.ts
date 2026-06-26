// lib/onesignal.ts
// Centralized OneSignal manager. All OneSignal interactions go through here.
// Never import the OneSignal SDK directly outside this module.

const APP_ID = 'ab8df582-b1ac-43cf-b969-597798b94341'

let initialized = false

async function getSDK() {
  const mod = await import('@onesignal/onesignal-web-sdk')
  return mod.default
}

export async function initOneSignal(): Promise<void> {
  if (initialized || typeof window === 'undefined') return
  try {
    const OneSignal = await getSDK()
    await OneSignal.init({
      appId: APP_ID,
      serviceWorkerParam: { scope: '/' },
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
    })
    initialized = true
  } catch (err) {
    console.error('[OneSignal] init error', err)
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const OneSignal = await getSDK()
    const accepted = await OneSignal.Notifications.requestPermission()
    return !!accepted
  } catch {
    return false
  }
}

export async function identifyUser(userId: string, email?: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const OneSignal = await getSDK()
    OneSignal.login(userId)
    if (email) OneSignal.User.addEmail(email)
  } catch (err) {
    console.error('[OneSignal] identify error', err)
  }
}

export async function logoutOneSignal(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const OneSignal = await getSDK()
    OneSignal.logout()
  } catch {}
}
