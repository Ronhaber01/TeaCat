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

              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.88) 100%)' }}
              />

              {/* Event info at bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-28">
                {event.category && (
                  <span className="inline-block bg-[#7B2EFF]/40 border border-[#7B2EFF]/60 text-[#A3FF12] text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                    {event.category}
                  </span>
                )}
                <h2 className="text-white font-black text-2xl leading-tight mb-1">{event.title}</h2>
                {event.venue_name && (
                  <p className="text-gray-300 text-sm mb-0.5">
                    {event.venue_name}{event.neighborhood ? ` · ${event.neighborhood}` : ''}
                  </p>
                )}
                <p className="text-gray-300 text-sm mb-3">
                  {format(new Date(event.starts_at), 'EEE, MMM d · h:mm a')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[#A3FF12] font-bold text-lg">{price}</span>
                  <Link
                    href={soldOut ? '#' : `/events/${event.id}/checkout`}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${
                      soldOut
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-[#7B2EFF] text-white shadow-lg shadow-[#7B2EFF]/30'
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
