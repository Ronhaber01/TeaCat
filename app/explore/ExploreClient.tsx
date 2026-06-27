'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import type { Event } from '@/lib/types'
import { format } from 'date-fns'
import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
events: Event[]
initialQ: string
activeCategory: string
activeVibe: string
activeSituation: string
}

function getPrice(ev: Event): string {
if (ev.is_free) return 'Free'
const min = ev.price_min / 100
const max = ev.price_max ? ev.price_max / 100 : null
if (max !== null && max !== min) return '$' + min + ' – $' + max
return '$' + min
}

export default function ExploreClient({ events }: Props) {
const router = useRouter()
const [openDrawerId, setOpenDrawerId] = useState<string | null>(null)
const [drawerEvent, setDrawerEvent] = useState<Event | null>(null)
const [shareCopied, setShareCopied] = useState(false)
const [currentEventIdx, setCurrentEventIdx] = useState(0)
const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set())
const [saveToast, setSaveToast] = useState<string | null>(null)
const scrollRef = useRef<HTMLDivElement>(null)

useEffect(() => {
if (openDrawerId) {
const e = events.find(ev => ev.id === openDrawerId)
if (e) setDrawerEvent(e)
}
}, [openDrawerId, events])

useEffect(() => {
  if (!scrollRef.current) return
  const cards = scrollRef.current.querySelectorAll('[data-card-idx]')
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setCurrentEventIdx(Number(entry.target.getAttribute('data-card-idx')))
        }
      })
    },
    { root: scrollRef.current, threshold: 0.5 }
  )
  cards.forEach((card: Element) => observer.observe(card))
  return () => observer.disconnect()
}, [events])


useEffect(() => {
const el = scrollRef.current
if (!el) return
const onScroll = () => setOpenDrawerId(null)
el.addEventListener('scroll', onScroll, { passive: true })
return () => el.removeEventListener('scroll', onScroll)
}, [])

const shareUrl = (id: string) => 'https://teacat.nyc/events/' + id

const handleShareCurrent = async () => {
const currentEv = openDrawerId ? events.find(e => e.id === openDrawerId) : events[currentEventIdx]
const url = currentEv ? 'https://teacat.nyc/events/' + currentEv.id : 'https://teacat.nyc/explore'
const title = currentEv?.title || 'TeaCat – NYC nightlife'
if (typeof navigator !== 'undefined' && navigator.share) {
navigator.share({ title, url }).catch(() => {})
} else {
navigator.clipboard.writeText(url).catch(() => {})
setShareCopied(true)
setTimeout(() => setShareCopied(false), 2000)
}
}


const handleSaveEvent = (eventId: string, e: React.MouseEvent) => {
e.stopPropagation()
setSavedEvents(prev => {
const next = new Set(prev)
if (next.has(eventId)) {
next.delete(eventId)
setSaveToast('Removed')
} else {
next.add(eventId)
setSaveToast("We'll keep you posted")
if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
Notification.requestPermission()
}
}
return next
})
setTimeout(() => setSaveToast(null), 2000)
}

const refresh = useCallback(async () => {
router.refresh()
await new Promise<void>(r => setTimeout(r, 1000))
}, [router])

const ptr = usePullToRefreshEl(refresh, scrollRef)

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
<PullIndicator {...ptr} />
<button
onClick={handleShareCurrent}
className="fixed top-14 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
>
{shareCopied ? (
<span className="text-[#A3FF12] text-[9px] font-bold leading-none text-center">Copied!</span>
) : (
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
</svg>
)}
</button>
{saveToast && (
<div className="fixed pointer-events-none" style={{ top: 60, left: 16, zIndex: 11, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '4px 10px' }}>
<span className="text-white text-[10px] font-semibold">{saveToast}</span>
</div>
)}
<button
onClick={(e) => { e.stopPropagation(); if (events[currentEventIdx]) handleSaveEvent(events[currentEventIdx].id, e) }}
className="fixed z-10 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
style={{ top: 56, left: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
>
<svg width="16" height="16" viewBox="0 0 24 24" fill={savedEvents.has(events[currentEventIdx]?.id || '') ? '#A3FF12' : 'none'} stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
<path d="M13.73 21a2 2 0 0 1-3.46 0"/>
</svg>
</button>
<div
ref={scrollRef}
onScroll={(e) => { const el = e.currentTarget; setCurrentEventIdx(Math.round(el.scrollTop / Math.max(1, el.clientHeight))) }}
style={{ height: '100svh', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}
>
{events.map((event, cardIdx) => {
const price = getPrice(event)
const isOpen = openDrawerId === event.id

return (
<div
key={event.id}
data-card-idx={cardIdx}
className="relative flex-shrink-0"
style={{ height: '100svh', scrollSnapAlign: 'start' }}
>
{event.flyer_url ? (
<Image src={event.flyer_url} alt={event.title} fill className="object-cover" unoptimized />
) : (
<div className="absolute inset-0 bg-gradient-to-br from-[#7B2EFF]/60 to-[#111111]" />
)}
<div
className="absolute inset-x-0 bottom-0 pointer-events-none"
style={{ height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', zIndex: 1 }}
/>
<div
className="absolute inset-0"
style={{ zIndex: 2 }}
onClick={() => setOpenDrawerId(isOpen ? null : event.id)}
/>
<div
className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
style={{ bottom: '96px', zIndex: 3, opacity: isOpen ? 0 : 1, transition: 'opacity 150ms', maxWidth: 'calc(100vw - 32px)' }}
>
<div
className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2.5"
style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '12px' }}
>
<span className="text-white font-semibold text-sm">{event.title}</span>
<span className="text-[#A3FF12] text-sm font-bold">{price}</span>
</div>
</div>
</div>
)
})}
</div>
<div
className="fixed inset-x-0 bottom-0"
style={{ zIndex: 50, height: '55vh', background: 'rgba(0,0,0,0.92)', borderRadius: '24px 24px 0 0', transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 300ms ease-out', display: 'flex', flexDirection: 'column', pointerEvents: drawerOpen ? 'auto' : 'none' }}
onClick={(e) => e.stopPropagation()}
>
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
<div className="flex-1 overflow-y-auto px-5 pt-2 pb-8 flex flex-col gap-2">
<h2 className="text-white font-black text-xl leading-tight">{ev.title}</h2>

{(ev.venue_name || ev.neighborhood) && (
<p className="text-gray-400 text-sm">
{[ev.venue_name, ev.neighborhood].filter(Boolean).join(' · ')}
</p>
)}

<p className="text-gray-400 text-sm">
{format(new Date(ev.starts_at), 'EEE, MMM d · h:mm a')}
{ev.ends_at ? ' – ' + format(new Date(ev.ends_at), 'h:mm a') : ''}
</p>

<p className="text-[#A3FF12] font-bold text-lg">{price}</p>

{ticketsLeft !== null && !soldOut && (
<p className="text-gray-500 text-xs">{ticketsLeft} tickets left</p>
)}
{soldOut && <p className="text-red-400 text-xs font-semibold">Sold out</p>}

<div className="mt-auto flex flex-col gap-3 pt-3 pb-24">
<Link
href={soldOut ? '#' : '/events/' + ev.id + '/checkout'}
className="w-full flex items-center justify-center rounded-2xl font-bold text-white"
style={{ height: 52, background: soldOut ? '#374151' : '#7B2EFF', flexShrink: 0 }}
onClick={(e) => { if (soldOut) e.preventDefault() }}
>
{soldOut ? 'Sold Out' : 'Get Tickets'}
</Link>

</div>
</div>
)
})()}
</div>

<BottomNav />
</div>
)
}

function usePullToRefreshEl(onRefresh: () => Promise<void>, elRef: React.RefObject<HTMLElement | null>) {
const [ptr, setPtr] = useState({ progress: 0, refreshing: false })
const startY = useRef(0)
const pulling = useRef(false)
const prog = useRef(0)
const fn = useRef(onRefresh)
fn.current = onRefresh

useEffect(() => {
const T = 60
const onStart = (e: TouchEvent) => {
const el = elRef.current
if (el && el.scrollTop <= 0) { startY.current = e.touches[0].clientY; pulling.current = true }
}
const onMove = (e: TouchEvent) => {
if (!pulling.current) return
const d = e.touches[0].clientY - startY.current
if (d > 0) { prog.current = Math.min(d / T, 1); setPtr(x => x.refreshing ? x : { progress: prog.current, refreshing: false }) }
else { pulling.current = false; prog.current = 0; setPtr({ progress: 0, refreshing: false }) }
}
const onEnd = async () => {
if (!pulling.current) return
const p = prog.current; pulling.current = false; prog.current = 0; startY.current = 0
if (p >= 1) { setPtr({ progress: 1, refreshing: true }); await fn.current(); setPtr({ progress: 0, refreshing: false }) }
else setPtr({ progress: 0, refreshing: false })
}
window.addEventListener('touchstart', onStart, { passive: true })
window.addEventListener('touchmove', onMove, { passive: true })
window.addEventListener('touchend', onEnd)
return () => {
window.removeEventListener('touchstart', onStart)
window.removeEventListener('touchmove', onMove)
window.removeEventListener('touchend', onEnd)
}
}, [elRef])

return ptr
}

function PullIndicator({ progress, refreshing }: { progress: number; refreshing: boolean }) {
if (!progress && !refreshing) return null
return (
<div
className="fixed left-1/2 pointer-events-none"
style={{ top: 12, transform: `translateX(-50%) translateY(${refreshing ? 0 : (progress - 1) * 28}px)`, opacity: Math.min(progress * 2, 1), transition: refreshing ? 'transform 0.2s ease, opacity 0.2s ease' : 'none', zIndex: 60 }}
>
<div
className={`w-6 h-6 rounded-full border-2 ${refreshing ? 'animate-spin' : ''}`}
style={{ borderColor: '#7B2EFF', borderTopColor: 'transparent', transform: !refreshing ? `rotate(${progress * 270}deg)` : undefined }}
/>
</div>
)
}
