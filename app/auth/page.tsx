'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirect = searchParams.get('redirect') || '/'

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    setStep('code')
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: trimmed,
      type: 'email',
    })

    setLoading(false)
    if (error) {
      setError('Invalid or expired code. Try again.')
      return
    }

    router.push(redirect)
  }

  const Logo = () => (
    <div className="mb-12">
      <Link href="/" className="flex items-center gap-1">
        <span className="text-[#7B2EFF] font-black text-4xl tracking-tight">Tea</span>
        <span className="text-[#A3FF12] font-black text-4xl tracking-tight">Cat</span>
      </Link>
    </div>
  )

  if (step === 'code') {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col px-5 pt-20 pb-10">
        <Logo />
        <div className="flex flex-col items-start">
          <div className="text-5xl mb-6">&#128236;</div>
          <h1 className="text-white font-black text-3xl mb-3">Check your email</h1>
          <p className="text-gray-400 text-sm mb-6">
            We sent a 6-digit code to <span className="text-white">{email}</span>.
            Enter it below.
          </p>

          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4 w-full">
            <input
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-5 py-4 text-white text-2xl tracking-[0.5em] placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors text-center"
            />

            {error && <p className="text-red-400 text-sm px-1">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-gray-500 text-xs mt-6">
            Didn&apos;t get it?{' '}
            <button
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="text-[#7B2EFF] underline"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col px-5 pt-20 pb-10">
      <Logo />

      <h1 className="text-white font-black text-3xl mb-2">Let&apos;s go ἵ3</h1>
      <p className="text-gray-500 text-sm mb-8">
        Enter your email and we&apos;ll send you a code. No password.
      </p>

      <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          autoComplete="email"
          inputMode="email"
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-5 py-4 text-white text-lg placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors"
        />

        {error && <p className="text-red-400 text-sm px-1">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Get my code →'}
        </button>
      </form>

      <p className="text-gray-700 text-xs text-center mt-8 leading-relaxed">
        By continuing you agree to our terms. No spam, ever.
      </p>
    </div>
  )
}
