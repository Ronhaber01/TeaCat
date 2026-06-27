'use client'

import { Suspense } from 'react'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import OnboardingFlow from '@/components/OnboardingFlow'
import { identifyUser } from '@/lib/onesignal'

function VerifyContent() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const redirect = searchParams.get('redirect') || '/'

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  const handleChange = (index: number, val: string) => {
    if (val.length === 6 && /^\d{6}$/.test(val)) {
      const digits = val.split('')
      setCode(digits)
      inputRefs.current[5]?.focus()
      verifyCode(val)
      return
    }
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every((d) => d !== '')) verifyCode(next.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  const verifyCode = async (token: string) => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    setLoading(false)
    if (error) {
      setError('Wrong code. Try again.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      return
    }
    if (data?.user) identifyUser(data.user.id, data.user.email)
    const onboarded = localStorage.getItem('teacat_onboarded')
    if (!onboarded) {
      setShowOnboarding(true)
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  const onOnboardingComplete = () => {
    localStorage.setItem('teacat_onboarded', 'true')
    router.push(redirect)
    router.refresh()
  }

  const resendCode = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  if (showOnboarding) return <OnboardingFlow onComplete={onOnboardingComplete} />

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col px-5 pt-20 pb-10">
      <Link href="/auth" className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-10 active:scale-90 transition-transform">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
      <h1 className="text-white font-black text-3xl mb-2">Check your email</h1>
      <p className="text-gray-500 text-sm mb-10">
        We sent a 6-digit code to <span className="text-white font-semibold">{email}</span>
      </p>
      <div className="flex gap-3 justify-between mb-6">
        {code.map((digit, i) => (
          <input key={i} ref={(el) => { inputRefs.current[i] = el }}
            type="text" inputMode="numeric" maxLength={6} value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoComplete="one-time-code"
            className={`w-12 h-14 text-center text-2xl font-black rounded-2xl border bg-[#1A1A1A] text-white focus:outline-none transition-all ${digit ? 'border-[#7B2EFF]' : 'border-[#2A2A2A]'} ${loading ? 'opacity-50' : ''}`}
            disabled={loading} />
        ))}
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm mt-2">Verifying...</p>
        </div>
      )}
      <button onClick={resendCode} disabled={resent}
        className="text-gray-600 text-sm mt-4 active:text-[#7B2EFF] transition-colors disabled:opacity-50">
        {resent ? 'Code resent!' : "Didn't get it? Resend code"}
      </button>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
      <VerifyContent />
    </Suspense>
  )
}
