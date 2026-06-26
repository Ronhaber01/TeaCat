'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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

    try {
      const resp = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        setError(data?.error || 'Failed to send code. Please try again.')
        setLoading(false)
        return
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    router.push(`/auth/verify?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`)
  }

  return (
    <div className='min-h-screen bg-[#111111] flex flex-col px-5 pt-20 pb-10'>
      <div className='mb-12'>
        <Link href='/' className='flex items-center gap-1'>
          <span className='text-[#7B2EFF] font-black text-4xl tracking-tight'>Tea</span>
          <span className='text-[#A3FF12] font-black text-4xl tracking-tight'>Cat</span>
        </Link>
        <p className='text-gray-500 text-sm mt-2'>Other apps sell tickets. TeaCat finds you tonight.</p>
      </div>

      <h1 className='text-white font-black text-3xl mb-2'>{"Let's go"}</h1>
      <p className='text-gray-500 text-sm mb-8'>{"Enter your email and we'll send you a code. No password."}</p>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='email'
          placeholder='your@email.com'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          autoComplete='email'
          inputMode='email'
          className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-5 py-4 text-white text-lg placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors'
        />

        {error && <p className='text-red-400 text-sm px-1'>{error}</p>}

        <button
          type='submit'
          disabled={loading || !email.trim()}
          className='btn-primary disabled:opacity-40 disabled:cursor-not-allowed'
        >
          {loading ? 'Sending code...' : 'Get my code →'}
        </button>
      </form>

      <p className='text-gray-700 text-xs text-center mt-8 leading-relaxed'>
        By continuing you agree to our{' '}
        <Link href='/terms' className='text-gray-500 underline'>terms</Link>
        . No spam, ever.
      </p>
    </div>
  )
}
