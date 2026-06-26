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
      <div style={{ height: '100svh', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
        {events.map((event) => {
          const soldOut = event.ticket_capacity !== null && event.tickets_sold >= (event.ticket_capacity ?? 0)
          const price = event.is_free
            ? 'Free'
            : event.price_max
            ? `$${event.price_min / 100} – $${event.price_max / 100}`
            : `From $${event.price_min / 100}`

          const location = [event.venue_name, event.neighborhood].filter(Boolean).join(' · ')

          return (
            <div key={event.id} className="relative flex-shrink-0" style={{ height: '100svh', scrollSnapAlign: 'start' }}>

              {/* Background flyer */}
              {event.flyer_url ? (
                <Image src={event.flyer_url} alt={event.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#7B2EFF]/60 to-[#111111]" />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 15%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.9) 100%)' }} />

              {/* ── Info card ── */}
              <div className="absolute left-4 right-4" style={{ bottom: '88px' }}>
                <div
                  className="rounded-2xl border border-white/8 overflow-hidden"
                  style={{ background: 'rgba(10,10,10,0.80)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
                >
                  {/* Upper section */}
                  <div className="px-4 pt-4 pb-4">

                    {/* Category badge */}
                    {event.category && (
                      <div className="mb-3">
                        <span className="inline-flex items-center bg-[#7B2EFF]/40 text-[#A3FF12] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
                          {event.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-white font-black text-[22px] leading-snug mb-4">{event.title}</h2>

                    {/* Meta rows — icon + text on same baseline */}
                    <div className="flex flex-col gap-2.5">

                      {/* Date & time */}
                      <div className="flex items-center gap-3">
                        <div className="w-4 flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                        <span className="text-gray-100 text-[13px] leading-none">
                          {format(new Date(event.starts_at), 'EEE, MMM d · h:mm a')}
                          {event.ends_at && (
                            <span className="text-gray-500"> – {format(new Date(event.ends_at), 'h:mm a')}</span>
                          )}
                        </span>
                      </div>

                      {/* Location */}
                      {location && (
                        <div className="flex items-center gap-3">
                          <div className="w-4 flex items-center justify-center flex-shrink-0">
                            <svg width="12" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                          </div>
                          <span className="text-gray-100 text-[13px] leading-none">{location}</span>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px mx-4 bg-white/8" />

                  {/* Price + CTA row */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Price</span>
                      <span className="text-[#A3FF12] font-black text-[18px] leading-none">{price}</span>
                    </div>
                    <Link
                      href={soldOut ? '#' : `/events/${event.id}/checkout`}
                      className={`px-5 py-2.5 rounded-full text-[13px] font-bold tracking-wide transition-all active:scale-95 ${
                        soldOut
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-[#7B2EFF] text-white shadow-lg shadow-[#7B2EFF]/40'
                      }`}
                    >
                      {soldOut ? 'Sold Out' : 'Get Tickets →'}
                    </Link>
                  </div>

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
