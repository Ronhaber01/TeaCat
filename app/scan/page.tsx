'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

type ScanResult = {
  valid: boolean
  reason: string
  eventName?: string
  tier?: string
} | null

export default function ScanPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [result, setResult] = useState<ScanResult>(null)
  const [checking, setChecking] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [scanCount, setScanCount] = useState(0)
  const [libReady, setLibReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)
  const lastCodeRef = useRef('')
  const checkingRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth?redirect=/scan')
  }, [user, authLoading, router])

  // Load jsQR from CDN — works in iOS Safari unlike BarcodeDetector
  useEffect(() => {
    if ((window as any).jsQR) { setLibReady(true); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
    s.onload = () => setLibReady(true)
    s.onerror = () => setCameraError('Could not load QR library. Please reload.')
    document.head.appendChild(s)
  }, [])

  const validate = useCallback(async (code: string) => {
    const ticketCode = code.replace('teacat://ticket/', '').trim()
    if (!ticketCode || ticketCode === lastCodeRef.current || checkingRef.current) return
    lastCodeRef.current = ticketCode
    checkingRef.current = true
    setChecking(true)

    try {
      const res = await fetch('/api/validate-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode }),
      })
      const data = await res.json()
      const r: ScanResult = data.error
        ? { valid: false, reason: data.error }
        : { valid: data.valid, reason: data.reason, eventName: data.eventName, tier: data.tier }
      setResult(r)
      if (r?.valid) setScanCount(n => n + 1)
    } catch {
      setResult({ valid: false, reason: 'Network error — try again' })
    }

    setChecking(false)

    // Reset after 1.5s — checkingRef stays true until then so no re-scan during display
    setTimeout(() => {
      setResult(null)
      lastCodeRef.current = ''
      checkingRef.current = false
    }, 1500)
  }, [])

  // Start camera + scan loop — runs once, video element never unmounts
  useEffect(() => {
    if (!libReady || !user) return

    let stopped = false
    let timer: ReturnType<typeof setTimeout>

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        scanningRef.current = true

        const tick = () => {
          if (!scanningRef.current || stopped) return
          const video = videoRef.current
          const canvas = canvasRef.current
          const jsQR = (window as any).jsQR
          if (video && canvas && jsQR && video.readyState === 4 && !checkingRef.current) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
              if (code?.data) validate(code.data)
            }
          }
          timer = setTimeout(tick, 150)
        }
        tick()
      } catch (err: any) {
        if (!stopped) setCameraError(err.message || 'Camera access denied')
      }
    }

    startCamera()

    return () => {
      stopped = true
      scanningRef.current = false
      clearTimeout(timer)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [libReady, user, validate])

  if (authLoading) {
    return (
      <div className='fixed inset-0 bg-black flex items-center justify-center'>
        <div className='w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  const showOverlay = checking || !!result
  const overlayBg = checking ? 'bg-black/95' : result?.valid ? 'bg-green-500' : 'bg-red-600'

  return (
    <div className='fixed inset-0 bg-black'>
      {/* Camera — always mounted so stream never dies */}
      <video ref={videoRef} className='absolute inset-0 w-full h-full object-cover' playsInline muted />
      <canvas ref={canvasRef} className='hidden' />

      {/* Result overlay — sits on top, video stays alive underneath */}
      {showOverlay && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 ${overlayBg}`}>
          {checking ? (
            <>
              <div className='w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin' />
              <p className='text-white text-2xl font-bold'>Checking...</p>
            </>
          ) : (
            <>
              <div className='text-9xl'>{result?.valid ? '\u2705' : '\u274C'}</div>
              <p className='text-white text-5xl font-black text-center leading-tight'>{result?.reason}</p>
              {result?.eventName && (
                <p className='text-white/80 text-2xl text-center'>{result.eventName}</p>
              )}
              {result?.tier && (
                <p className='text-white/60 text-xl capitalize'>{result.tier} ticket</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Scanner UI — only shown when not in result/checking state */}
      {!showOverlay && (
        <>
          <div className='absolute top-0 left-0 right-0 z-10 px-5 pt-14 pb-6 flex items-center justify-between bg-gradient-to-b from-black to-transparent'>
            <div>
              <h1 className='text-white font-black text-xl'>\uD83C\uDFAB Door Scanner</h1>
              <p className='text-gray-400 text-sm'>{scanCount} admitted tonight</p>
            </div>
            <button onClick={() => router.push('/host')} className='text-gray-300 text-sm font-semibold py-2 px-4 bg-white/10 rounded-full active:scale-95 transition-transform'>
              Done
            </button>
          </div>

          {!cameraError && (
            <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
              <div className='relative w-64 h-64'>
                <div className='absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-purple-400 rounded-tl-xl' />
                <div className='absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-purple-400 rounded-tr-xl' />
                <div className='absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-purple-400 rounded-bl-xl' />
                <div className='absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-purple-400 rounded-br-xl' />
              </div>
            </div>
          )}

          {cameraError && (
            <div className='absolute inset-0 flex items-center justify-center p-8'>
              <div className='bg-black/90 border border-red-500/30 rounded-2xl p-6 text-center max-w-xs'>
                <p className='text-red-400 text-lg font-bold mb-2'>Camera Error</p>
                <p className='text-gray-400 text-sm'>{cameraError}</p>
                <button onClick={() => window.location.reload()} className='mt-4 text-purple-400 text-sm font-semibold'>Reload page</button>
              </div>
            </div>
          )}

          <div className='absolute bottom-0 left-0 right-0 px-5 py-8 text-center bg-gradient-to-t from-black to-transparent'>
            <p className='text-gray-400 text-sm'>Point camera at attendee&apos;s QR code</p>
          </div>
        </>
      )}
    </div>
  )
}
