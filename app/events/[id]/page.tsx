import { createClient } from '@/lib/supabase-server'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Event } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import SaveButton, { ShareButton, AttendeeSection, TicketOverlay } from './SaveButton'

function formatPrice(e: { is_free: boolean; price_min: number; price_max: number | null }): string {
  if (e.is_free) return 'Free'
  const min = e.price_min / 100
  const max = e.price_max ? e.price_max / 100 : null
  if (max !== null && max !== min) return `$${min} – $${max}`
  return `$${min}`
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: event }, { data: { user } }] = await Promise.all([
    supabase.from('events').select('*, host:hosts(*)').eq('id', params.id).single(),
    supabase.auth.getUser(),
  ])

  if (!event) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-5">
        <p className="text-white font-bold text-lg">Event not found</p>
        <Link href="/" className="mt-4 text-[#7B2EFF] font-semibold">Back home</Link>
      </div>
    )
  }

  const e = event as Event
  const startTime = new Date(e.starts_at)
  const soldOut = e.ticket_capacity !== null && e.tickets_sold >= e.ticket_capacity

  let hasTicket = false
  let ticketData: { ticket_code: string; tier: string | null } | null = null
  let attendees: { id: string; full_name: string | null; username: string | null; avatar_url: string | null }[] = []

  const { data: ticketRows } = await supabase
    .from('tickets')
    .select('user_id')
    .eq('event_id', e.id)
    .in('status', ['active', 'used'])
    .limit(50)

  if (ticketRows && ticketRows.length > 0) {
    const userIds = ticketRows.map((t: any) => t.user_id).filter(Boolean)
    const { data: userRows } = await supabase
      .from('users')
      .select('id, full_name, username, avatar_url, hide_from_attendee_list')
      .in('id', userIds)
    if (userRows) {
      attendees = (userRows as any[]).filter((u) => !u.hide_from_attendee_list)
    }
  }

  if (user) {
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, ticket_code, tier')
      .eq('event_id', e.id)
      .eq('user_id', user.id)
      .single()
    if (ticket) {
      hasTicket = true
      ticketData = { ticket_code: (ticket as any).ticket_code, tier: (ticket as any).tier }
    }
  }

  const price = formatPrice(e)
  const shareUrl = `https://teacat.nyc/events/${e.id}`

  return (
    <div className="min-h-screen bg-[#111111] pb-36">
      {hasTicket && ticketData && (
        <TicketOverlay ticket={ticketData} event={{ title: e.title, starts_at: e.starts_at }} />
      )}

      <div className="relative h-96 bg-[#2A2A2A]">
        {e.flyer_url ? (
          <Image src={e.flyer_url} alt={e.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#7B2EFF]/40 to-[#111111] flex items-center justify-center">
            <span className="text-white/20 font-black text-3xl text-center px-8">{e.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
        <div className="absolute top-14 left-5 right-5 flex items-center justify-between">
          <Link href="/" className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="flex items-center gap-2">
            <ShareButton title={e.title} url={shareUrl} />
            <SaveButton eventId={e.id} userId={user?.id} />
          </div>
        </div>
        {e.boost_active && (
          <div className="absolute bottom-32 right-5 bg-[#A3FF12] text-black text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Featured
          </div>
        )}
      </div>

      <div className="px-5 -mt-8 relative z-10">
        {e.category && (
          <span className="inline-block bg-[#7B2EFF]/20 border border-[#7B2EFF]/40 text-[#7B2EFF] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">{e.category}</span>
        )}
        <h1 className="text-white font-black text-3xl leading-tight mb-2">{e.title}</h1>
        {e.host && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#7B2EFF] flex items-center justify-center text-xs font-black text-white">{(e.host as any).name[0]}</div>
            <span className="text-gray-400 text-sm">{(e.host as any).name}</span>
            {(e.host as any).is_verified && <span className="text-[#A3FF12] text-xs">&#10003;</span>}
          </div>
        )}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] divide-y divide-[#2A2A2A] mb-6">
          <DetailRow icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B2EFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} label="Date & Time" value={format(startTime, 'EEEE, MMMM d · h:mm a')} />
          {e.venue_name && <DetailRow icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Venue" value={`${e.venue_name}${e.neighborhood ? ` · ${e.neighborhood}` : ''}`} />}
          {e.address && <DetailRow icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B2EFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>} label="Address" value={e.address} />}
          <DetailRow icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} label="Price" value={price} highlight={e.is_free} />
          {e.ticket_capacity && <DetailRow icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B2EFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} label="Capacity" value={soldOut ? 'Sold out' : `${e.ticket_capacity - e.tickets_sold} spots left`} highlight={!soldOut} />}
        </div>
        {e.vibe_tags && e.vibe_tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {e.vibe_tags.map((tag) => <span key={tag} className="bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 text-xs font-semibold px-3 py-1.5 rounded-full">#{tag}</span>)}
          </div>
        )}
        {e.description && (
          <div className="mb-6">
            <h3 className="text-white font-bold mb-2">About this event</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{e.description}</p>
          </div>
        )}
        <AttendeeSection attendees={attendees} />
      </div>

      <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full px-5 py-3 bg-[#111111]/90 backdrop-blur-sm" style={{ maxWidth: 430 }}>
        {hasTicket ? (
          <Link href="/tickets" className="btn-primary block text-center">View ticket &rarr;</Link>
        ) : soldOut ? (
          <button disabled className="btn-primary opacity-40 cursor-not-allowed">Sold Out</button>
        ) : !user ? (
          <Link href={`/auth?redirect=/events/${e.id}/checkout`} className="btn-primary block text-center">Sign in to get tickets &rarr;</Link>
        ) : (
          <Link href={`/events/${e.id}/checkout`} className="btn-primary block text-center shadow-lg shadow-[#7B2EFF]/30">
            {e.is_free ? 'Get Free Ticket →' : `Get Tickets · ${price}`}
          </Link>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function DetailRow({ icon, label, value, highlight }: { icon: ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="w-7 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <p className="text-gray-600 text-xs">{label}</p>
        <p className={`font-semibold text-sm ${highlight ? 'text-[#A3FF12]' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  )
}
