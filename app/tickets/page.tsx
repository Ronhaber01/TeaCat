'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode.react'
import { format } from 'date-fns'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase-browser'
import type { Ticket } from '@/lib/types'
import Link from 'next/link'

type TicketWithEvent = Ticket & {
  event: {
    title: string
    venue_name: string | null
    starts_at: string
    neighborhood: string | null
  }
}

export default function TicketsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [selected, setSelected] = useState<TicketWithEvent | null>(null)
  const [allTickets, setAllTickets] = useState<TicketWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAuthed(false)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('tickets')
        .select('*, event:events(title, venue_name, starts_at, neighborhood)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setAllTickets(data as TicketWithEvent[])
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()
  const upcoming = allTickets.filter(
    (t) => new Date(t.event?.starts_at) >= now && t.status === 'active'
  )
  const past = allTickets.filter(
    (t) => new Date(t.event?.starts_at) < now || t.status !== 'active'
  )
  const tickets = tab === 'upcoming' ? upcoming : past

  // Auto-select first ticket whenever the visible list changes
  useEffect(() => {
    setSelected((prev) => {
      if (prev && tickets.find((t) => t.id === prev.id)) return prev
      return tickets[0] || null
    })
  }, [tab, allTickets])

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-5 text-center pb-28">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-white font-bold text-lg">Sign in to see your tickets</p>
        <Link href="/login" className="btn-primary mt-6 inline-block">Sign in →</Link>
        <BottomNav />
      </div>
    )
  }

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
              onClick={() => setTab(t)}
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
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#7B2EFF] border-t-transparent animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyTickets tab={tab} />
      ) : (
        <>
          {/* QR Code — big and front and center */}
          {selected && (
            <div className="mx-5 mb-6 p-6 rounded-3xl bg-[#1A1A1A] border border-[#2A2A2A] text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                {selected.event?.neighborhood} ·{' '}
                {format(new Date(selected.event?.starts_at || ''), 'EEE, MMM d · h:mm a')}
              </p>
              <h2 className="text-white font-black text-xl mb-1 leading-tight">
                {selected.event?.title}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {selected.event?.venue_name} · {selected.tier} ticket
              </p>

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

              <p className="text-[#7B2EFF] font-black text-2xl tracking-widest mb-1">
                {selected.ticket_code}
              </p>
              <p className="text-gray-600 text-xs">Show this at the door</p>

              {selected.status === 'used' && selected.checked_in_at && (
                <div className="mt-4 bg-[#A3FF12]/10 border border-[#A3FF12]/30 rounded-xl py-2 px-4">
                  <p className="text-[#A3FF12] text-sm font-bold">
                    ✓ Checked in ·{' '}
                    {format(new Date(selected.checked_in_at), 'h:mm a')}
                  </p>
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
                  <div className="flex-shrink-0 w-1 h-16 rounded-full bg-[#7B2EFF]" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight line-clamp-1">
                      {ticket.event?.title}
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">{ticket.event?.venue_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-400 text-xs">
                        {format(new Date(ticket.event?.starts_at || ''), 'EEE, MMM d')}
                      </span>
                      <span className="text-[#2A2A2A]">·</span>
                      <span
                        className={`text-xs font-semibold ${
                          ticket.status === 'active' ? 'text-[#A3FF12]' : 'text-gray-600'
                        }`}
                      >
                        {ticket.status === 'active' ? '● Active' : '✓ Used'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">
                      {ticket.price_paid === 0
                        ? 'Free'
                        : `$${(ticket.price_paid / 100).toFixed(0)}`}
                    </p>
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
        {tab === 'upcoming'
          ? "Find tonight's events and grab a ticket"
          : 'Your past events will show up here'}
      </p>
      {tab === 'upcoming' && (
        <Link
          href="/explore"
          className="inline-block bg-[#7B2EFF] text-white font-bold px-6 py-3 rounded-2xl text-sm"
        >
          Explore events →
        </Link>
      )}
    </div>
  )
}
