'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const callbackError = searchParams.get('error')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col px-5 pt-20 pb-10">
        <div className="mb-12">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-[#7B2EFF] font-black text-4xl tracking-tight">Tea</span>
            <span className="text-[#A3FF12] font-black text-4xl tracking-tight">Cat</span>
          </Link>
        </div>
        <div className="flex flex-col items-start">
          <div className="text-5xl mb-6">&#128236;</div>
          <h1 className="text-white font-black text-3xl mb-3">Check your inbox</h1>
          <p className="text-gray-400 text-sm mb-2">
            We sent a sign-in link to <span className="text-white">{email}</span>.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            Didn&apos;t get it? Check spam or{' '}
            <button onClick={() => setSent(false)} className="text-[#7B2EFF] underline">
              try again
            </button>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col px-5 pt-20 pb-10">
      <div className="mb-12">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-[#7B2EFF] font-black text-4xl tracking-tight">Tea</span>
          <span className="text-[#A3FF12] font-black text-4xl tracking-tight">Cat</span>
        </Link>
        <p className="text-gray-500 text-sm mt-2">Other apps sell tickets. TeaCat finds you tonight.</p>
      </div>

      <h1 className="text-white font-black text-3xl mb-2">Let&apos;s go &#127749;</h1>
      <p className="text-gray-500 text-sm mb-8">Enter your email and we&apos;ll send you a sign-in link. No password.</p>

      {callbackError && (
        <p className="text-red-400 text-sm mb-4 px-1">Sign-in link expired or already used. Try again.</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
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
        </div>

        {error && (
          <p className="text-red-400 text-sm px-1">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending link...' : 'Get my link &rarr;'}
        </button>
      </form>

      <p className="text-gray-700 text-xs text-center mt-8 leading-relaxed">
        By continuing you agree to our terms. No spam, ever.
      </p>
    </div>
  )
}
