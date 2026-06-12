'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode.react'
import { format } from 'date-fns'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase-browser'

type TicketWithEvent = {
  id: string
  event_id: string
  user_id: string
  ticket_code: string
  tier: string | null
  price_paid: number
  currency: string | null
  status: string | null
  checked_in_at: string | null
  created_at: string | null
  event: {
    id: string
    title: string
    venue_name: string | null
    neighborhood: string | null
    starts_at: string
    category: string | null
  } | null
}

export default function TicketsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [tickets, setTickets] = useState<TicketWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TicketWithEvent | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth?redirect=/tickets')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const fetchTickets = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*, event:events(id, title, venue_name, neighborhood, starts_at, category)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setTickets((data || []) as TicketWithEvent[])
      setLoading(false)
    }
    fetchTickets()
  }, [user])

  const now = new Date().toISOString()
  const upcoming = tickets.filter(t => t.status === 'active' && t.event && t.event.starts_at > now)
  const past = tickets.filter(t => t.status !== 'active' || !t.event || t.event.starts_at <= now)
  const shown = tab === 'upcoming' ? upcoming : past

  const currentSelected = selected && shown.find(t => t.id === selected.id) ? selected : shown[0] ?? null

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

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

      {shown.length === 0 ? (
        <EmptyTickets tab={tab} />
      ) : (
        <>
          {currentSelected && (
            <div className="mx-5 mb-6 p-6 rounded-3xl bg-[#1A1A1A] border border-[#2A2A2A] text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1" suppressHydrationWarning>
                {currentSelected.event?.neighborhood}{currentSelected.event?.starts_at ? ` · ${format(new Date(currentSelected.event.starts_at), 'EEE, MMM d · h:mm a')}` : ''}
              </p>
              <h2 className="text-white font-black text-xl mb-1 leading-tight">{currentSelected.event?.title}</h2>
              <p className="text-gray-500 text-sm mb-6">{currentSelected.event?.venue_name} · {currentSelected.tier || 'general'} ticket</p>

              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-[#7B2EFF]/20">
                  <QRCode
                    value={`teacat://ticket/${currentSelected.ticket_code}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#111111"
                    level="H"
                  />
                </div>
              </div>

              <p className="text-[#7B2EFF] font-black text-2xl tracking-widest mb-1 font-mono">
                {currentSelected.ticket_code}
              </p>
              <p className="text-gray-600 text-xs">Show this at the door</p>

              {currentSelected.checked_in_at && (
                <div className="mt-4 bg-[#A3FF12]/10 border border-[#A3FF12]/30 rounded-xl py-2 px-4">
                  <p className="text-[#A3FF12] text-sm font-bold" suppressHydrationWarning>
                    Checked in · {format(new Date(currentSelected.checked_in_at), 'h:mm a')}
                  </p>
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
                  currentSelected?.id === ticket.id
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
                      <span className="text-gray-400 text-xs" suppressHydrationWarning>
                        {ticket.event?.starts_at ? format(new Date(ticket.event.starts_at), 'EEE, MMM d') : ''}
                      </span>
                      <span className="text-[#2A2A2A]">·</span>
                      <span className={`text-xs font-semibold ${ticket.status === 'active' ? 'text-[#A3FF12]' : 'text-gray-600'}`}>
                        {ticket.status === 'active' ? 'Active' : 'Used'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">
                      {ticket.price_paid === 0 ? 'Free' : `$${(ticket.price_paid / 100).toFixed(0)}`}
                    </p>
                    <p className="text-gray-600 text-xs capitalize">{ticket.tier || 'general'}</p>
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
      <div className="text-5xl mb-4">🎟</div>
      <p className="text-white font-bold text-lg">No {tab} tickets</p>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        {tab === 'upcoming' ? "Find tonight's events and grab a ticket" : 'Your past events will show up here'}
      </p>
      {tab === 'upcoming' && (
        <a href="/explore" className="inline-block bg-[#7B2EFF] text-white font-bold px-6 py-3 rounded-2xl text-sm">
          Explore events
        </a>
      )}
    </div>
  )
}
