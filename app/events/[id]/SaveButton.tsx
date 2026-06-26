'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

// ─── SaveButton ───────────────────────────────────────────────────────────────
export default function SaveButton({ eventId, userId }: { eventId: string; userId?: string }) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!userId) { window.location.href = `/auth?redirect=/events/${eventId}`; return }
    setLoading(true)
    const supabase = createClient()
    if (saved) {
      await supabase.from('saved_events').delete().eq('event_id', eventId).eq('user_id', userId)
      setSaved(false)
    } else {
      await supabase.from('saved_events').insert({ event_id: eventId, user_id: userId })
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
      <svg width="20" height="20" fill={saved ? '#A3FF12' : 'none'} viewBox="0 0 24 24" stroke={saved ? '#A3FF12' : '#fff'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}

// ─── ShareButton ──────────────────────────────────────────────────────────────
export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title, url }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(url) } catch {}
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button onClick={handleShare} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
      {copied ? (
        <span className="text-[#A3FF12] text-[10px] font-bold">Copied!</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      )}
    </button>
  )
}

// ─── AttendeeSection ──────────────────────────────────────────────────────────
type Attendee = { id: string; full_name: string | null; username: string | null; avatar_url: string | null }

function AvatarCircle({ a, size }: { a: Attendee; size: number }) {
  const name = a.full_name || a.username || '?'
  if (a.avatar_url) {
    return <img src={a.avatar_url} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size, border: '2px solid #7B2EFF' }} />
  }
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 bg-[#1A1A1A]" style={{ width: size, height: size, border: '2px solid #7B2EFF' }}>
      <span className="text-[#A3FF12] font-bold" style={{ fontSize: Math.floor(size * 0.38) }}>{name[0].toUpperCase()}</span>
    </div>
  )
}

export function AttendeeSection({ attendees, hasTicket, eventId, userId }: { attendees: Attendee[]; hasTicket: boolean; eventId: string; userId?: string }) {
  const [showModal, setShowModal] = useState(false)
  if (attendees.length === 0) return null

  const teaser = attendees.slice(0, 3)
  const rest = attendees.slice(3)

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-white font-bold">Going</h3>
        <span className="text-gray-500 text-sm">({attendees.length})</span>
      </div>

      {/* Avatar row */}
      <div className="flex gap-2 mb-4 pb-1">
        {teaser.map((a) => <AvatarCircle key={a.id} a={a} size={44} />)}
        {rest.length > 0 && (
          <div style={{ filter: hasTicket ? 'none' : 'blur(5px)', display: 'flex', gap: 8, overflow: 'hidden' }}>
            {(hasTicket ? rest : rest.slice(0, 4)).map((a) => <AvatarCircle key={a.id} a={a} size={44} />)}
          </div>
        )}
        {hasTicket && attendees.length > 7 && (
          <div className="rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, border: '2px solid #7B2EFF' }}>
            <span className="text-[#A3FF12] text-xs font-bold">+{attendees.length - 7}</span>
          </div>
        )}
      </div>

      {/* Paywall or See All */}
      {!hasTicket ? (
        <div className="rounded-2xl border border-[#2A2A2A] p-5 flex flex-col items-center gap-3 text-center" style={{ backdropFilter: 'blur(8px)', background: 'rgba(17,17,17,0.92)' }}>
          <div className="flex items-center justify-center gap-2">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B2EFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
<circle cx="12" cy="12" r="3"/>
</svg>
<p className="text-white font-bold">See who's coming to the party</p>
</div>
          <Link
            href={userId ? `/events/${eventId}/checkout` : `/auth?redirect=/events/${eventId}`}
            className="block w-full py-3 rounded-2xl text-white font-bold text-sm text-center"
            style={{ background: '#7B2EFF' }}
          >
            Get a ticket to unlock the list
          </Link>
        </div>
      ) : (
        <>
          <button onClick={() => setShowModal(true)} className="text-[#A3FF12] text-sm font-semibold">See all →</button>
          {showModal && (
            <div className="fixed inset-0 z-[60] bg-[#111111] flex flex-col">
              <div className="flex items-center px-5 pt-14 pb-4 border-b border-[#2A2A2A]">
                <h2 className="text-white font-black text-xl flex-1">Going ({attendees.length})</h2>
                <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-10">
                {attendees.map((a) => {
                  const name = a.full_name || a.username || 'Attendee'
                  const href = a.username ? `/profile?u=${a.username}` : null
                  const inner = (
                    <div className="flex items-center gap-3 py-3.5 border-b border-[#1A1A1A]">
                      <AvatarCircle a={a} size={44} />
                      <span className="text-white font-semibold text-sm flex-1">{name}</span>
                      {href && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
                    </div>
                  )
                  return href ? <Link key={a.id} href={href}>{inner}</Link> : <div key={a.id}>{inner}</div>
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── TicketOverlay ────────────────────────────────────────────────────────────
export function TicketOverlay({ ticket, event }: { ticket: { ticket_code: string; tier: string | null }; event: { title: string; starts_at: string } }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const dismiss = () => {
    document.body.style.overflow = ''
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div
      className="flex flex-col"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: '#111111', overflow: 'hidden' }}
    >
      {/* Gradient bar */}
      <div style={{ background: 'linear-gradient(to right, #7B2EFF, #A3FF12)', height: 4, flexShrink: 0, width: '100%' }} />

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4">
        <p className="text-[#A3FF12] font-bold text-sm tracking-widest uppercase">Your Ticket</p>
        <h2 className="text-white font-black text-xl text-center leading-tight">{event.title}</h2>
        <p className="text-gray-400 text-sm text-center">{format(new Date(event.starts_at), 'EEEE, MMMM d · h:mm a')}</p>
        <div className="bg-white p-4 rounded-2xl">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(ticket.ticket_code)}`}
            alt="QR Code"
            width={220}
            height={220}
            className="block"
          />
        </div>
        <p className="text-gray-500 text-xs text-center">Tap to scan at the door</p>
      </div>

      {/* Close button */}
      <div className="px-5 pb-12 flex-shrink-0">
        <button
          onClick={dismiss}
          className="w-full rounded-2xl text-white font-semibold text-sm border border-[#2A2A2A] active:scale-95 transition-transform"
          style={{ height: 48, background: 'transparent' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
