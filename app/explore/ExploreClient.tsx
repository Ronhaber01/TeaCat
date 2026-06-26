'use client'

import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import type { Event } from '@/lib/types'
import { format } from 'date-fns'

interface Props {
  events: Event[]
  initialQ: string
  activeCategory: string
  activeVibe: string
  activeSituation: string
}

export default function ExploreClient({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center pb-28">
        <svg className="mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="20" x2="22" y2="20"/>
          <path d="M3 20V11l5-5 4 4 5-6 5 7v9"/>
          <path d="M9 20v-5h6v5"/>
        </svg>
        <p className="text-white font-bold text-lg">No events right now</p>
        <p className="text-gray-500 text-sm mt-1">Check back soon</p>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        style={{
          height: '100svh',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
        }}
      >
        {events.map((event) => {
          const soldOut = event.ticket_capacity !== null && event.tickets_sold >= (event.ticket_capacity ?? 0)
          const price = event.is_free
            ? 'Free'
            : event.price_max
            ? `$${event.price_min / 100} – $${event.price_max / 100}`
            : `From $${event.price_min / 100}`

          return (
            <div
              key={event.id}
              className="relative flex-shrink-0"
              style={{ height: '100svh', scrollSnapAlign: 'start' }}
            >
              {/* Background flyer */}
              {event.flyer_url ? (
                <Image
                  src={event.flyer_url}
                  alt={event.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#7B2EFF]/60 to-[#111111]" />
              )}

              {/* Dark gradient overlay — heavier at bottom */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.92) 100%)' }}
              />

              {/* ── Floating info label — sits in the middle of the card ── */}
              <div
                className="absolute left-4 right-4"
                style={{ bottom: '140px' }}
              >
                <div
                  className="rounded-2xl px-4 py-3 border border-white/10"
                  style={{
                    background: 'rgba(10, 10, 10, 0.72)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  {event.category && (
                    <span className="inline-block bg-[#7B2EFF]/50 text-[#A3FF12] text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider">
                      {event.category}
                    </span>
                  )}
                  <h2 className="text-white font-black text-xl leading-tight mb-1">{event.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.venue_name && (
                      <span className="text-gray-300 text-xs">{event.venue_name}</span>
                    )}
                    {event.neighborhood && (
                      <>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-400 text-xs">{event.neighborhood}</span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {format(new Date(event.starts_at), 'EEE, MMM d · h:mm a')}
                  </p>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-28">
                <div className="flex items-center justify-between">
                  <span className="text-[#A3FF12] font-black text-2xl">{price}</span>
                  <Link
                    href={soldOut ? '#' : `/events/${event.id}/checkout`}
                    className={`px-6 py-3 rounded-full text-sm font-bold transition-all active:scale-95 ${
                      soldOut
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-[#7B2EFF] text-white shadow-lg shadow-[#7B2EFF]/40'
                    }`}
                  >
                    {soldOut ? 'Sold Out' : 'Get Tickets'}
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
