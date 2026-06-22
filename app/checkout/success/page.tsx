'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function CheckoutSuccessInner() {
  const searchParams = useSearchParams()
  const isFree = searchParams.get('free') === '1'
  const eventTitle = searchParams.get('eventTitle') || 'your event'
  const paymentIntentId = searchParams.get('payment_intent')
  const eventId = searchParams.get('eventId')
  const [show, setShow] = useState(false)
  const [ticketStatus, setTicketStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setTimeout(() => setShow(true), 100)

    if (isFree) {
      setTicketStatus('done')
      return
    }

    if (!paymentIntentId || !eventId) {
      setTicketStatus('error')
      setErrorMsg('Missing payment info. Your payment went through — check your tickets.')
      return
    }

    fetch('/api/confirm-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, eventId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error && !data.alreadyExisted) {
          setTicketStatus('error')
          setErrorMsg(data.error)
        } else {
          setTicketStatus('done')
        }
      })
      .catch(() => {
        setTicketStatus('error')
        setErrorMsg('Network error. Your payment went through — check your tickets.')
      })
  }, [paymentIntentId, eventId, isFree])

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-5 text-center">
      <div className={`transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {ticketStatus === 'loading' && !isFree ? (
          <>
            <div className="w-24 h-24 rounded-full bg-[#7B2EFF]/20 border-2 border-[#7B2EFF] flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-white font-black text-3xl mb-2">Confirming...</h1>
            <p className="text-gray-400 text-base">Locking in your ticket</p>
          </>
        ) : ticketStatus === 'error' ? (
          <>
            <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#ff4444" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-white font-black text-3xl mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
            <Link href="/tickets" className="btn-primary text-center block">Check my tickets →</Link>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full bg-[#A3FF12]/20 border-2 border-[#A3FF12] flex items-center justify-center mx-auto mb-6">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#A3FF12" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-white font-black text-3xl mb-2">You're in 🎉</h1>
            <p className="text-gray-400 text-base mb-1">
              {isFree ? 'Free ticket claimed for' : 'Ticket confirmed for'}
            </p>
            <p className="text-white font-bold text-lg mb-8">{eventTitle}</p>
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A] mb-8">
              <p className="text-gray-500 text-sm text-center">Check your email for the QR code, or view it in your tickets.</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Link href="/tickets" className="btn-primary text-center block">View my ticket →</Link>
              <Link href="/" className="btn-secondary text-center block">Back to home</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutSuccessInner />
    </Suspense>
  )
}
