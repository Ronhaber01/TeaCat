'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const isFree = searchParams.get('free') === '1'
  const eventTitle = searchParams.get('eventTitle') || 'your event'
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
  }, [])

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-5 text-center">
      <div
        className={`transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Big check */}
        <div className="w-24 h-24 rounded-full bg-[#A3FF12]/20 border-2 border-[#A3FF12] flex items-center justify-center mx-auto mb-6">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#A3FF12" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-white font-black text-3xl mb-2">You're in 🎉</h1>
        <p className="text-gray-400 text-base mb-1">
          {isFree ? 'Free ticket claimed for' : 'Ticket confirmed for'}
        </p>
        <p className="text-white font-bold text-lg mb-6">{eventTitle}</p>

        {/* Email confirmation note */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A] mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#A3FF12" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-[#A3FF12] text-sm font-semibold">Confirmation email sent</p>
          </div>
          <p className="text-gray-500 text-xs">Your QR code is also waiting in My Tickets.</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link href="/tickets" className="btn-primary text-center">
            View my ticket →
          </Link>
          <Link href="/" className="btn-secondary text-center">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
