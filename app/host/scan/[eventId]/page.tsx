'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

type Result = { valid: boolean; reason: string } | null

export default function ScanPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string

  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [manualCode, setManualCode] = useState('')
  const [result, setResult] = useState<Result>(null)
  const [checking, setChecking] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [scanCount, setScanCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const scanningRef = useRef(false)
  const lastCodeRef = useRef('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/host')
    }
  }, [user, authLoading, router])

  const validate = useCallback(async (code: string) => {
    const ticketCode = code.replace('teacat://ticket/', '').trim()
    if (!ticketCode || ticketCode === lastCodeRef.current) return
    lastCodeRef.current = ticketCode

    setChecking(true)
    setResult(null)

    try {
      const res = await fetch('/api/validate-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketCode, eventId }),
      })
      const data = await res.json()
      setResult(data.error ? { valid: false, reason: data.error } : { valid: data.valid, reason: data.reason })
      setScanCount((n) => n + 1)
    } catch {
      setResult({ valid: false, reason: 'Network error' })
    }

    setChecking(false)

    setTimeout(() => {
      setResult(null)
      lastCodeRef.current = ''
    }, 3000)
  }, [eventId])

  useEffect(() => {
    if (mode !== 'camera') return

    const startCamera = async () => {
      try {
        if (!('BarcodeDetector' in window)) {
          setCameraError('QR scanning not supported in this browser. Use manual entry.')
          setMode('manual')
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setCameraReady(true)
        }

        // @ts-ignore
        detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] })
        scanningRef.current = true

        const scan = async () => {
          if (!scanningRef.current || !videoRef.current || !detectorRef.current) return
          if (videoRef.current.readyState === 4) {
            try {
              const codes = await detectorRef.current.detect(videoRef.current)
              if (codes.length > 0) {
                validate(codes[0].rawValue)
              }
            } catch {}
          }
          if (scanningRef.current) requestAnimationFrame(scan)
        }
        requestAnimationFrame(scan)
      } catch (err: any) {
        setCameraError(err.message || 'Camera access denied')
        setMode('manual')
      }
    }

    startCamera()

    return () => {
      scanningRef.current = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [mode, validate])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      validate(manualCode.trim())
      setManualCode('')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col">
      <div className="px-5 pt-14 pb-4 flex items-center gap-4 flex-shrink-0">
        <Link href={`/host/events/${eventId}`} className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-black text-lg">Door Scanner 🎟️</h1>
          <p className="text-gray-500 text-xs">{scanCount} scanned tonight</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setMode(mode === 'camera' ? 'manual' : 'camera')}
            className="text-[#7B2EFF] text-sm font-semibold"
          >
            {mode === 'camera' ? 'Manual' : 'Camera'}
          </button>
        </div>
      </div>

      {(checking || result) && (
        <div className={`mx-5 mb-4 p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
          checking
            ? 'bg-[#1A1A1A] border-[#2A2A2A]'
            : result?.valid
            ? 'bg-[#A3FF12]/10 border-[#A3FF12]'
            : 'bg-red-500/10 border-red-500'
        }`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-2xl ${
            checking ? 'bg-[#2A2A2A]' : result?.valid ? 'bg-[#A3FF12]/20' : 'bg-red-500/20'
          }`}>
            {checking ? (
              <div className="w-6 h-6 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
            ) : result?.valid ? '✅' : '❌'}
          </div>
          <div>
            <p className={`font-black text-xl ${
              checking ? 'text-gray-400' : result?.valid ? 'text-[#A3FF12]' : 'text-red-400'
            }`}>
              {checking ? 'Checking...' : result?.reason}
            </p>
          </div>
        </div>
      )}

      {mode === 'camera' && (
        <div className="flex-1 relative mx-5 mb-4 rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] min-h-64">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {cameraReady && !result && !checking && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 rounded-2xl border-2 border-[#7B2EFF]/70">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#7B2EFF] rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#7B2EFF] rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#7B2EFF] rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#7B2EFF] rounded-br-xl" />
              </div>
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <p className="text-gray-400 text-sm">{cameraError}</p>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="px-5 flex-1">
          <p className="text-gray-400 text-sm mb-4">Paste or type the ticket code from the attendee's QR:</p>
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="teacat://ticket/... or paste UUID"
              autoFocus
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#7B2EFF] font-mono text-sm"
            />
            <button type="submit" disabled={!manualCode.trim() || checking} className="btn-primary disabled:opacity-40">
              {checking ? 'Checking...' : 'Validate ticket →'}
            </button>
          </form>
        </div>
      )}

      {mode === 'camera' && (
        <p className="text-gray-600 text-xs text-center px-5 pb-6">
          Point camera at attendee's QR code. Auto-scans instantly.
        </p>
      )}
    </div>
  )
}
