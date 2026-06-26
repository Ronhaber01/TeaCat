'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

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
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    // Pass email + redirect to verify page
    router.push(`/auth/verify?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`)
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col px-5 pt-20 pb-10">
      {/* Logo */}
      <div className="mb-12">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-[#7B2EFF] font-black text-4xl tracking-tight">Tea</span>
          <span className="text-[#A3FF12] font-black text-4xl tracking-tight">Cat</span>
        </Link>
        <p className="text-gray-500 text-sm mt-2">Other apps sell tickets. TeaCat finds you tonight.</p>
      </div>

      <h1 className="text-white font-black text-3xl mb-2">Let's go 🌃</h1>
      <p className="text-gray-500 text-sm mb-8">Enter your email and we'll text you a code. No password.</p>

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
          {loading ? 'Sending code...' : 'Get my code →'}
        </button>
      </form>

      <p className="text-gray-700 text-xs text-center mt-8 leading-relaxed">
        By continuing you agree to our terms. No spam, ever.
      </p>
    </div>
  )
}
