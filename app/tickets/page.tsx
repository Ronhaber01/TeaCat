'use client'

import { useState } from 'react'
import QRCode from 'qrcode.react'
import { format } from 'date-fns'
import BottomNav from '@/components/BottomNav'
import type { Ticket } from '@/lib/types'

// Demo tickets for MVP display — replace with real Supabase query once auth is wired
const DEMO_TICKETS: (Ticket & { event: { title: string; venue_name: string; starts_at: string; neighborhood: string } })[] = [
  {
    id: '1',
    event_id: 'evt-1',
    user_id: 'user-1',
    ticket_code: 'TC-A9B2C3D4',
    tier: 'general',
    price_paid: 2000,
    currency: 'usd',
    stripe_payment_id: null,
    status: 'active',
    checked_in_at: null,
    created_at: new Date().toISOString(),
    event: {
      title: 'Mura Masa at Elsewhere',
      venue_name: 'Elsewhere',
      starts_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      neighborhood: 'Bushwick',
    },
  },
]

const PAST_DEMO: typeof DEMO_TICKETS = [
  {
    id: '2',
    event_id: 'evt-2',
    user_id: 'user-1',
    ticket_code: 'TC-E5F6G7H8',
    tier: 'vip',
    price_paid: 3500,
    currency: 'usd',
    stripe_payment_id: null,
    status: 'used',
    checked_in_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    event: {
      title: 'Honey Dijon at Output',
      venue_name: 'Output',
      starts_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      neighborhood: 'Williamsburg',
    },
  },
]

export default function TicketsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [selected, setSelected] = useState<typeof DEMO_TICKETS[0] | null>(DEMO_TICKETS[0] || null)

  const tickets = tab === 'upcoming' ? DEMO_TICKETS : PAST_DEMO

  return (
    <div className="min-h-screen bg-[#111111] pb-28">
      {/* Header */}
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black text-white">My Tickets 🎟️</h1>
      </header>

      {/* Tabs */}
      <div className="px-5 mb-6">
        <div className="flex bg-[#1A1A1A] rounded-2xl p-1 border border-[#2A2A2A]">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(null) }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                tab === t ? 'bg-[#7B2EFF] text-white' : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyTickets tab={tab} />
      ) : (
        <>
          {/* QR Code — big and front and center */}
          {selected && (
            <div className="mx-5 mb-6 p-6 rounded-3xl bg-[#1A1A1A] border border-[#2A2A2A] text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                {selected.event?.neighborhood} · {format(new Date(selected.event?.starts_at || ''), 'EEE, MMM d · h:mm a')}
              </p>
              <h2 className="text-white font-black text-xl mb-1 leading-tight">{selected.event?.title}</h2>
              <p className="text-gray-500 text-sm mb-6">{selected.event?.venue_name} · {selected.tier} ticket</p>

              {/* QR */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-[#7B2EFF]/20">
                  <QRCode
                    value={`teacat://ticket/${selected.ticket_code}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#111111"
                    level="H"
                  />
                </div>
              </div>

              <p className="text-[#7B2EFF] font-black text-2xl tracking-widest mb-1">{selected.ticket_code}</p>
              <p className="text-gray-600 text-xs">Show this at the door</p>

              {selected.status === 'used' && (
                <div className="mt-4 bg-[#A3FF12]/10 border border-[#A3FF12]/30 rounded-xl py-2 px-4">
                  <p className="text-[#A3FF12] text-sm font-bold">✓ Checked in · {format(new Date(selected.checked_in_at!), 'h:mm a')}</p>
                </div>
              )}
            </div>
          )}

          {/* Ticket list */}
          <div className="px-5 flex flex-col gap-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelected(ticket)}
                className={`w-full text-left rounded-2xl overflow-hidden border transition-all ${
                  selected?.id === ticket.id
                    ? 'border-[#7B2EFF] bg-[#7B2EFF]/10'
                    : 'border-[#2A2A2A] bg-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Ticket stub left */}
                  <div className="flex-shrink-0 w-1 h-16 rounded-full bg-[#7B2EFF]" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight line-clamp-1">{ticket.event?.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{ticket.event?.venue_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-400 text-xs">{format(new Date(ticket.event?.starts_at || ''), 'EEE, MMM d')}</span>
                      <span className="text-[#2A2A2A]">·</span>
                      <span className={`text-xs font-semibold ${ticket.status === 'active' ? 'text-[#A3FF12]' : 'text-gray-600'}`}>
                        {ticket.status === 'active' ? '● Active' : '✓ Used'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">${(ticket.price_paid / 100).toFixed(0)}</p>
                    <p className="text-gray-600 text-xs capitalize">{ticket.tier}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}

function EmptyTickets({ tab }: { tab: string }) {
  return (
    <div className="text-center px-5 py-16">
      <div className="text-5xl mb-4">🎟️</div>
      <p className="text-white font-bold text-lg">No {tab} tickets</p>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        {tab === 'upcoming' ? 'Find tonight\'s events and grab a ticket' : 'Your past events will show up here'}
      </p>
      {tab === 'upcoming' && (
        <a href="/explore" className="inline-block bg-[#7B2EFF] text-white font-bold px-6 py-3 rounded-2xl text-sm">
          Explore events →
        </a>
      )}
    </div>
  )
}
