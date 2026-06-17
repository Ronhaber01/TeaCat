'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Event } from '@/lib/types'

interface Props {
  event: Event
  userId: string
  publishableKey: string
}

export default function CheckoutClient({ event, userId, publishableKey }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const isFree = event.is_free || event.price_min === 0

  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  useEffect(() => {
    if (isFree) { setLoading(false); return }

    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, tier: 'general' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setClientSecret(data.clientSecret)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load checkout'); setLoading(false) })
  }, [event.id, isFree])

  const stripeAppearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#7B2EFF',
      colorBackground: '#1A1A1A',
      colorText: '#ffffff',
      colorDanger: '#ff4444',
      borderRadius: '16px',
      fontFamily: 'Inter, sans-serif',
    },
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-10">
      <div className="px-5 pt-14 pb-6">
        <Link href={`/events/${event.id}`} className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-6 active:scale-90 transition-transform">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <h1 className="text-white font-black text-2xl mb-1">Get your ticket</h1>
        <p className="text-gray-500 text-sm">Tap to pay, show QR at the door.</p>
      </div>

      <div className="mx-5 mb-6 p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]">
        <h2 className="text-white font-bold text-base leading-tight mb-1">{event.title}</h2>
        <p className="text-gray-500 text-sm">{event.venue_name} · {event.neighborhood}</p>
        <p className="text-gray-600 text-xs mt-1">{format(new Date(event.starts_at), 'EEEE, MMMM d · h:mm a')}</p>
        <div className="mt-3 pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
          <span className="text-gray-400 text-sm">General · 1 ticket</span>
          <span className="text-white font-black text-lg">
            {isFree ? 'Free' : `$${(event.price_min / 100).toFixed(2)}`}
          </span>
        </div>
      </div>

      <div className="px-5">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 mb-4">
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && isFree && (
          <FreeTicketButton eventId={event.id} eventTitle={event.title} />
        )}

        {!loading && !error && !isFree && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
            <StripeForm event={event} userId={userId} />
          </Elements>
        )}
      </div>
    </div>
  )
}

function StripeForm({ event, userId }: { event: Event; userId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/events/${event.id}/checkout/success`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message || 'Payment failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
        }}
      />

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading
          ? 'Processing...'
          : `Pay $${(event.price_min / 100).toFixed(2)} → Get Ticket`}
      </button>

      <p className="text-gray-700 text-xs text-center">
        Secured by Stripe · No platform fee
      </p>
    </form>
  )
}

function FreeTicketButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const claim = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/claim-free-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    router.push('/tickets')
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button onClick={claim} disabled={loading} className="btn-primary disabled:opacity-50">
        {loading ? 'Claiming...' : 'Claim free ticket →'}
      </button>
      <p className="text-gray-700 text-xs text-center">No payment needed · Show QR at door</p>
    </div>
  )
}
