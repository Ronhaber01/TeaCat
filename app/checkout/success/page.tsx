'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { format } from 'date-fns'

type EventInfo = {
  title: string
  starts_at: string
  venue_name: string | null
}

export default function CheckoutSuccess() {
  const searchParams = useSearchParams()
  const isFree = searchParams.get('free') === '1'
  const eventId = searchParams.get('eventId')
  const eventTitleParam = searchParams.get('eventTitle')

  const [show, setShow] = useState(false)
  const [event, setEvent] = useState<EventInfo | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
  }, [])

  useEffect(() => {
    if (!eventId || isFree) return
    supabase
      .from('events')
      .select('title, starts_at, venue_name')
      .eq('id', eventId)
      .single()
      .then(({ data }) => { if (data) setEvent(data) })
  }, [eventId, isFree])

  const eventTitle = event?.title || eventTitleParam || 'your event'
  const eventDate = event?.starts_at
    ? format(new Date(event.starts_at), "EEE, MMM d 'at' h:mm a")
    : null

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-5 text-center">
      <div
        className={`w-full max-w-sm transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Check */}
        <div className="w-24 h-24 rounded-full bg-[#A3FF12]/20 border-2 border-[#A3FF12] flex items-center justify-center mx-auto mb-6">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#A3FF12" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-white font-black text-3xl mb-2">You're in 🎉</h1>
        <p className="text-gray-400 text-base mb-1">
          {isFree ? 'Free ticket claimed for' : 'Ticket confirmed for'}
        </p>
        <p className="text-white font-bold text-xl mb-2 leading-tight">{eventTitle}</p>
        {eventDate && (
          <p className="text-gray-500 text-sm mb-2">{eventDate}</p>
        )}
        {event?.venue_name && (
          <p className="text-gray-600 text-sm mb-6">{event.venue_name}</p>
        )}
        {!eventDate && <div className="mb-6" />}

        {/* Email notice */}
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A] mb-8 text-left">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <p className="text-white font-semibold text-sm">Check your email</p>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Your QR code has been sent to your email. You can also find it in your tickets anytime.
              </p>
            </div>
          </div>
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
