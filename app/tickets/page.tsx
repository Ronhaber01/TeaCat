'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase-browser'

type TicketWithEvent = {
  id: string
  event_id: string
  user_id: string
  ticket_code: string
  tier: string | null
  price_paid: number | null
  status: string
  checked_in_at: string | null
  created_at: string
  event: {
    title: string
    venue_name: string
    starts_at: string
    neighborhood: string
  } | null
}

export default function TicketsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [tickets, setTickets] = useState<TicketWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TicketWithEvent | null>(null)
  const [notLoggedIn, setNotLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setNotLoggedIn(true); setLoading(false); return }
      supabase
        .from('tickets')
        .select('*, event:events(title, venue_name, starts_at, neighborhood)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          const list = (data || []) as TicketWithEvent[]
          setTickets(list)
          if (list.length > 0) setSelected(list[0])
          setLoading(false)
        })
    })
  }, [])

  const now = new Date()
  const upcoming = tickets.filter(t => t.event && new Date(t.event.starts_at) >= now)
  const past = tickets.filter(t => t.event && new Date(t.event.starts_at) < now)
  const shown = tab === 'upcoming' ? upcoming : past

  if (notLoggedIn) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-5 text-center pb-28">
        <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
        <p className="text-white font-bold text-lg mb-2">Sign in to see your tickets</p>
        <Link href="/auth" className="btn-primary mt-4">Sign in →</Link>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-28">
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black text-white">My Tickets</h1>
      </header>

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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <EmptyTickets tab={tab} />
      ) : (
        <>
          {selected && (
            <div className="mx-5 mb-6 p-6 rounded-3xl bg-[#1A1A1A] border border-[#2A2A2A] text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                {selected.event?.neighborhood} · {selected.event?.starts_at ? format(new Date(selected.event.starts_at), 'EEE, MMM d · h:mm a') : ''}
              </p>
              <h2 className="text-white font-black text-xl mb-1 leading-tight">{selected.event?.title}</h2>
              <p className="text-gray-500 text-sm mb-6">{selected.event?.venue_name} · {selected.tier || 'general'} ticket</p>

              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-[#7B2EFF]/20">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selected.ticket_code}`}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
              </div>

              <p className="text-[#7B2EFF] font-black text-2xl tracking-widest mb-1">{selected.ticket_code}</p>
              <p className="text-gray-600 text-xs">Show this at the door</p>

              {selected.status === 'used' && selected.checked_in_at && (
                <div className="mt-4 bg-[#A3FF12]/10 border border-[#A3FF12]/30 rounded-xl py-2 px-4">
                  <p className="text-[#A3FF12] text-sm font-bold">✓ Checked in · {format(new Date(selected.checked_in_at), 'h:mm a')}</p>
                </div>
              )}
            </div>
          )}

          <div className="px-5 flex flex-col gap-3">
            {shown.map((ticket) => (
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
                  <div className="flex-shrink-0 w-1 h-16 rounded-full bg-[#7B2EFF]" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight line-clamp-1">{ticket.event?.title}</h3>
                    <p className="text-gray-500 text-xs mt-0.5">{ticket.event?.venue_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-400 text-xs">
                        {ticket.event?.starts_at ? format(new Date(ticket.event.starts_at), 'EEE, MMM d') : ''}
                      </span>
                      <span className="text-[#2A2A2A]">·</span>
                      <span className={`text-xs font-semibold ${ticket.status === 'active' ? 'text-[#A3FF12]' : 'text-gray-600'}`}>
                        {ticket.status === 'active' ? '● Active' : '✓ Used'}
                      </span>
                    </div>
                  </div>
                  {ticket.price_paid != null && ticket.price_paid > 0 && (
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">${(ticket.price_paid / 100).toFixed(0)}</p>
                      <p className="text-gray-600 text-xs capitalize">{ticket.tier || 'general'}</p>
                    </div>
                  )}
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
      <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
      <p className="text-white font-bold text-lg">No {tab} tickets</p>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        {tab === 'upcoming' ? "Find tonight's events and grab a ticket" : 'Your past events will show up here'}
      </p>
      {tab === 'upcoming' && (
        <Link href="/explore" className="inline-block bg-[#7B2EFF] text-white font-bold px-6 py-3 rounded-2xl text-sm">
          Explore events →
        </Link>
      )}
    </div>
  )
}
