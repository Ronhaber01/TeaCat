'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import QRCode from 'qrcode.react'

type TicketResult = {
  id: string
  ticket_code: string
  tier: string
  price_paid: number
}

export default function CheckoutSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const paymentIntentId = searchParams.get('payment_intent')
  const redirectStatus = searchParams.get('redirect_status')

  useEffect(() => {
    if (redirectStatus !== 'succeeded' || !paymentIntentId) {
      setError('Payment was not completed. Please try again.')
      setLoading(false)
      return
    }

    fetch('/api/confirm-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, eventId: params.id }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ticket) setTicket(data.ticket)
        else setError(data.error || 'Failed to confirm your ticket')
      })
      .catch(() => setError('Network error — please contact support'))
      .finally(() => setLoading(false))
  }, [paymentIntentId, params.id, redirectStatus])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center text-white px-5">
        <div className="animate-spin w-10 h-10 border-4 border-[#7B2EFF] border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400">Confirming your ticket…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center text-white px-5 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-8">{error}</p>
        <button
          onClick={() => router.back()}
          className="bg-[#7B2EFF] text-white font-bold px-8 py-3 rounded-2xl"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-5 text-white">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-black mb-2">You’re in!</h1>
        <p className="text-gray-400">Your ticket is confirmed. Check your email too.</p>
      </div>

      {ticket && (
        <div className="bg-white p-5 rounded-3xl shadow-2xl shadow-[#7B2EFF]/30 mb-5">
          <QRCode
            value={`teacat://ticket/${ticket.ticket_code}`}
            size={220}
            bgColor="#ffffff"
            fgColor="#111111"
            level="H"
          />
        </div>
      )}

      {ticket && (
        <p className="text-[#7B2EFF] font-black text-2xl tracking-widest mb-2">
          {ticket.ticket_code}
        </p>
      )}
      <p className="text-gray-600 text-sm mb-10">Show this at the door</p>

      <button
        onClick={() => router.push('/tickets')}
        className="w-full max-w-sm bg-[#7B2EFF] text-white font-black py-4 rounded-2xl text-lg hover:bg-[#6B1EEF] transition-colors"
      >
        View my tickets →
      </button>
    </div>
  )
}
