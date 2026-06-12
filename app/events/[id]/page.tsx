import { createClient } from '@/lib/supabase-server'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import type { Event } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import SaveButton from './SaveButton'

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: event }, { data: { user } }] = await Promise.all([
    supabase.from('events').select('*, host:hosts(*)').eq('id', params.id).single(),
    supabase.auth.getUser(),
  ])

  if (!event) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-5">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-white font-bold text-lg">Event not found</p>
        <Link href="/" className="mt-4 text-[#7B2EFF] font-semibold">← Back home</Link>
      </div>
    )
  }

  const e = event as Event
  const startTime = new Date(e.starts_at)
  const soldOut = e.ticket_capacity !== null && e.tickets_sold >= e.ticket_capacity

  // Check if user already has ticket
  let hasTicket = false
  if (user) {
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('event_id', e.id)
      .eq('user_id', user.id)
      .single()
    hasTicket = !!existing
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-36">
      {/* Flyer */}
      <div className="relative h-96 bg-[#2A2A2A]">
        {e.flyer_url ? (
          <Image src={e.flyer_url} alt={e.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#7B2EFF]/40 to-[#111111] flex items-center justify-center">
            <span className="text-white/20 font-black text-3xl text-center px-8">{e.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />

        {/* Nav row */}
        <div className="absolute top-14 left-5 right-5 flex items-center justify-between">
          <Link href="/" className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <SaveButton eventId={e.id} userId={user?.id} />
        </div>

        {e.boost_active && (
          <div className="absolute bottom-32 right-5 bg-[#A3FF12] text-black text-xs font-black px-3 py-1 rounded-full">
            🔥 Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 -mt-8 relative z-10">
        {e.category && (
          <span className="inline-block bg-[#7B2EFF]/20 border border-[#7B2EFF]/40 text-[#7B2EFF] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            {e.category}
          </span>
        )}

        <h1 className="text-white font-black text-3xl leading-tight mb-2">{e.title}</h1>

        {e.host && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#7B2EFF] flex items-center justify-center text-xs font-black text-white">
              {(e.host as any).name[0]}
            </div>
            <span className="text-gray-400 text-sm">{(e.host as any).name}</span>
            {(e.host as any).is_verified && <span className="text-[#A3FF12] text-xs">✓</span>}
          </div>
        )}

        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] divide-y divide-[#2A2A2A] mb-6">
          <DetailRow icon="📅" label="Date & Time" value={format(startTime, 'EEEE, MMMM d · h:mm a')} />
          {e.venue_name && <DetailRow icon="📍" label="Venue" value={`${e.venue_name}${e.neighborhood ? ` · ${e.neighborhood}` : ''}`} />}
          {e.address && <DetailRow icon="🗺️" label="Address" value={e.address} />}
          <DetailRow
            icon="💵"
            label="Price"
            value={e.is_free ? 'Free' : e.price_max ? `$${e.price_min / 100} – $${e.price_max / 100}` : `From $${e.price_min / 100}`}
            highlight={e.is_free}
          />
          {e.ticket_capacity && (
            <DetailRow
              icon="👥"
              label="Capacity"
              value={soldOut ? 'Sold out' : `${e.ticket_capacity - e.tickets_sold} spots left`}
              highlight={!soldOut}
            />
          )}
        </div>

        {e.vibe_tags && e.vibe_tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {e.vibe_tags.map((tag) => (
              <span key={tag} className="bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {e.description && (
          <div className="mb-6">
            <h3 className="text-white font-bold mb-2">About this event</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{e.description}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-[72px] left-1/2 -translate-x-1/2 w-full px-5 py-3 bg-[#111111]/90 backdrop-blur-sm" style={{ maxWidth: 430 }}>
        {hasTicket ? (
          <Link href="/tickets" className="btn-primary block text-center">
            ✓ You have a ticket · View QR →
          </Link>
        ) : soldOut ? (
          <button disabled className="btn-primary opacity-40 cursor-not-allowed">
            Sold Out
          </button>
        ) : !user ? (
          <Link href={`/auth?redirect=/events/${e.id}/checkout`} className="btn-primary block text-center">
            Sign in to get tickets →
          </Link>
        ) : (
          <Link
            href={`/events/${e.id}/checkout`}
            className="btn-primary block text-center shadow-lg shadow-[#7B2EFF]/30"
          >
            {e.is_free ? 'Get Free Ticket →' : `Get Tickets · From $${e.price_min / 100}`}
          </Link>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function DetailRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <span className="text-lg w-7 text-center flex-shrink-0">{icon}</span>
      <div>
        <p className="text-gray-600 text-xs">{label}</p>
        <p className={`font-semibold text-sm ${highlight ? 'text-[#A3FF12]' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  )
}
