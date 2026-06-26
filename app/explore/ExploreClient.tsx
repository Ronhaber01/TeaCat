'use client'

import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import type { Event } from '@/lib/types'
import { format } from 'date-fns'
import { useState, useRef, useEffect } from 'react'

interface Props {
  events: Event[]
  initialQ: string
  activeCategory: string
  activeVibe: string
  activeSituation: string
}

function getPrice(ev: Event): string {
  if (ev.is_free) return 'Free'
  if (ev.price_max) return '$' + (ev.price_min / 100) + ' – $' + (ev.price_max / 100)
  return 'From $' + (ev.price_min / 100)
}

export default function ExploreClient({ events }: Props) {
  const [openDrawerId, setOpenDrawerId] = useState<string | null>(null)
  const [drawerEvent, setDrawerEvent] = useState<Event | null>(null)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (openDrawerId) {
      const e = events.find(ev => ev.id === openDrawerId)
      if (e) setDrawerEvent(e)
    }
  }, [openDrawerId, events])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setOpenDrawerId(null)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const shareUrl = (id: string) => 'https://teacat.nyc/events/' + id

  const copyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(id))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

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

  const drawerOpen = openDrawerId !== null

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        style={{ height: '100svh', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}
      >
        {events.map((event) => {
          const price = getPrice(event)
          const isOpen = openDrawerId === event.id

          return (
            <div
              key={event.id}
              className="relative flex-shrink-0"
              style={{ height: '100svh', scrollSnapAlign: 'start' }}
            >
              {/* Full bleed flyer */}
              {event.flyer_url ? (
                <Image src={event.flyer_url} alt={event.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#7B2EFF]/60 to-[#111111]" />
              )}

              {/* Bottom scrim for pill readability */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{ height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', zIndex: 1 }}
              />

              {/* Full-card tap target */}
              <div
                className="absolute inset-0"
                style={{ zIndex: 2 }}
                onClick={() => setOpenDrawerId(isOpen ? null : event.id)}
              />

              {/* Floating pill — fades when drawer opens */}
              <div
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                  bottom: '96px',
                  zIndex: 3,
                  opacity: isOpen ? 0 : 1,
                  transition: 'opacity 150ms',
                }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    maxWidth: 'calc(100vw - 48px)',
                  }}
                >
                  <span
                    className="text-white font-semibold text-sm truncate"
                    style={{ maxWidth: '55vw' }}
                  >
                    {event.title}
                  </span>
                  <span className="text-[#A3FF12] text-sm font-bold flex-shrink-0">{price}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Details drawer — fixed overlay, animates in/out */}
      <div
        className="fixed inset-x-0 bottom-0"
        style={{
          zIndex: 50,
          height: '45vh',
          background: 'rgba(0,0,0,0.92)',
          borderRadius: '24px 24px 0 0',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms ease-out',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: drawerOpen ? 'auto' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
        </div>

        {drawerEvent && (() => {
          const ev = drawerEvent
          const soldOut = ev.ticket_capacity !== null && ev.tickets_sold >= (ev.ticket_capacity ?? 0)
          const price = getPrice(ev)
          const ticketsLeft = ev.ticket_capacity !== null ? (ev.ticket_capacity ?? 0) - ev.tickets_sold : null
          const url = shareUrl(ev.id)

          return (
            <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col">
              <h2 className="text-white font-black text-xl leading-tight mt-1 mb-2">{ev.title}</h2>

              {(ev.venue_name || ev.neighborhood) && (
                <p className="text-gray-400 text-sm mb-1">
                  {[ev.venue_name, ev.neighborhood].filter(Boolean).join(' · ')}
                </p>
              )}

              <p className="text-gray-400 text-sm mb-1">
                {format(new Date(ev.starts_at), 'EEE, MMM d · h:mm a')}
                {ev.ends_at ? ' – ' + format(new Date(ev.ends_at), 'h:mm a') : ''}
              </p>

              <p className="text-[#A3FF12] font-bold text-lg mb-1">{price}</p>

              {ticketsLeft !== null && !soldOut && (
                <p className="text-gray-500 text-xs">{ticketsLeft} tickets left</p>
              )}
              {soldOut && <p className="text-red-400 text-xs font-semibold">Sold out</p>}

              <div className="mt-auto flex flex-col gap-3 pt-2">
                <Link
                  href={soldOut ? '#' : '/events/' + ev.id + '/checkout'}
                  className="w-full flex items-center justify-center rounded-2xl font-bold text-white"
                  style={{ height: 52, background: soldOut ? '#374151' : '#7B2EFF', flexShrink: 0 }}
                  onClick={(e) => { if (soldOut) e.preventDefault() }}
                >
                  {soldOut ? 'Sold Out' : 'Get Tickets'}
                </Link>

                {/* Share row */}
                <div className="flex items-start justify-around" style={{ flexShrink: 0 }}>
                  {/* Copy Link */}
                  <button onClick={() => copyLink(ev.id)} className="flex flex-col items-center gap-1.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span className="text-xs" style={{ color: copied ? '#A3FF12' : '#9CA3AF' }}>
                      {copied ? 'Copied!' : 'Copy Link'}
                    </span>
                  </button>

                  {/* SMS */}
                  <a href={'sms:?body=Check this out on TeaCat: ' + url} className="flex flex-col items-center gap-1.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="text-gray-400 text-xs">SMS</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={'https://wa.me/?text=Check this out on TeaCat: ' + url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    <span className="text-gray-400 text-xs">WhatsApp</span>
                  </a>

                  {/* More (native share sheet) */}
                  <button
                    className="flex flex-col items-center gap-1.5"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.share) {
                        navigator.share({ title: ev.title, url: url }).catch(() => {})
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span className="text-gray-400 text-xs">More</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      <BottomNav />
    </div>
  )
}
