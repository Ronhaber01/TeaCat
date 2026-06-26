'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import SplashScreen from '@/components/SplashScreen'
import BottomNav from '@/components/BottomNav'
import { CATEGORIES, GENRES } from '@/lib/types'
import type { Event } from '@/lib/types'

// ─── SVG icons for each category pill ────────────────────────────────────────────
function getCategoryIcon(value: string, size = 14) {
const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: '#A3FF12', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
switch (value) {
case 'genres': return (
<svg {...s}>
<path d="M9 18V5l12-2v13"/>
<circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
</svg>
)
case 'club': return (
<svg {...s}>
<circle cx="12" cy="13" r="7"/>
<path d="M5.5 10.5C8 9 16 9 18.5 10.5"/>
<path d="M5.2 13C8 11.5 16 11.5 18.8 13"/>
<path d="M5.5 15.5C8 17 16 17 18.5 15.5"/>
<path d="M11.5 9.5L12.5 10.5L11.5 11.5L10.5 10.5Z"/>
<path d="M8 12L9 13L8 14L7 13Z"/>
<path d="M15 12L16 13L15 14L14 13Z"/>
<line x1="17" y1="5" x2="20.5" y2="2"/>
<line x1="19" y1="8" x2="22" y2="6"/>
</svg>
)
case 'bar': return (
<svg {...s}>
<path d="M8 22V12L4 3h16l-4 9v10"/>
<line x1="8" y1="22" x2="16" y2="22"/>
</svg>
)
case 'popup': return (
<svg {...s}>
<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
<polyline points="9 22 9 12 15 12 15 22"/>
</svg>
)
case 'live': return (
<svg {...s}>
<path d="M9 18V5l12-2v13"/>
<path d="M3 15c0-2 1.5-3 3-3s3 1 3 3-1.5 3-3 3-3-1-3-3z"/>
</svg>
)
case 'community': return (
<svg {...s}>
<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
<circle cx="9" cy="7" r="4"/>
<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</svg>
)
case 'rooftop': return (
<svg {...s}>
<line x1="2" y1="20" x2="22" y2="20"/>
<path d="M3 20V11l5-5 4 4 5-6 5 7v9"/>
</svg>
)
case 'rave': return (
<svg {...s} viewBox="0 0 24 24">
<line x1="4" y1="14" x2="4" y2="10"/><line x1="8" y1="17" x2="8" y2="7"/>
<line x1="12" y1="20" x2="12" y2="4"/><line x1="16" y1="17" x2="16" y2="7"/>
<line x1="20" y1="14" x2="20" y2="10"/>
</svg>
)
default: return null
}
}

interface Props {
events: Event[]
featured?: Event[]
upcoming?: Event[]
activeCategory?: string
}

export default function HomeClient({ events: initialEvents }: Props) {
const router = useRouter()
const [activeCategory, setActiveCategory] = useState('all')
const [activeGenre, setActiveGenre] = useState<string | null>(null)
const [showGenres, setShowGenres] = useState(false)
const [events, setEvents] = useState<Event[]>(initialEvents ?? [])

// Sync server-refreshed props back into local state
useEffect(() => { setEvents(initialEvents ?? []) }, [initialEvents])

// Filter events
const filtered = events.filter((e) => {
if (activeCategory === 'all') return true
if (activeCategory === 'genres') {
if (!activeGenre) return true
return (e.vibe_tags ?? []).includes(activeGenre)
}
return e.category === activeCategory
})

const handleCategoryClick = (value: string) => {
if (value === 'genres') {
setShowGenres(prev => !prev)
setActiveCategory('genres')
if (showGenres) {
setActiveGenre(null)
setShowGenres(false)
setActiveCategory('all')
}
} else {
setActiveCategory(value)
setShowGenres(false)
setActiveGenre(null)
}
}

const handleGenreClick = (genre: string) => {
setActiveGenre(prev => prev === genre ? null : genre)
}

const refresh = useCallback(async () => {
router.refresh()
await new Promise<void>(r => setTimeout(r, 1000))
}, [router])

const ptr = usePullToRefresh(refresh)

return (
<div className="min-h-screen bg-[#111111] pb-28">
<PullIndicator {...ptr} />
<SplashScreen />

{/* Header */}
<div className="px-5 pt-14 pb-4">
<div className="flex items-center justify-between mb-1">
<div>
<h1 className="text-white font-black text-2xl leading-tight">What's happening</h1>
<p className="text-gray-500 text-sm">New York City</p>
</div>
<Link href="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7B2EFF] to-[#A3FF12] flex items-center justify-center">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
<circle cx="12" cy="7" r="4"/>
</svg>
</Link>
</div>
</div>

{/* Category pills */}
<div className="px-5 mb-1">
<div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
{CATEGORIES.map((cat) => {
const isActive = activeCategory === cat.value || (cat.value === 'all' && activeCategory === 'all')
const isGenresActive = cat.value === 'genres' && (activeCategory === 'genres' || showGenres)
const active = isActive || isGenresActive
return (
<button
key={cat.value}
onClick={() => handleCategoryClick(cat.value)}
className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
active
? 'bg-[#7B2EFF] text-[#A3FF12] border border-[#7B2EFF]'
: 'bg-transparent text-[#A3FF12] border border-[#2A2A2A]'
}`}
>
{cat.value !== 'all' && getCategoryIcon(cat.value, 12)}
{cat.label}
{cat.value === 'genres' && (
<svg
width="10" height="10" viewBox="0 0 24 24" fill="none"
stroke={active ? '#A3FF12' : '#A3FF12'} strokeWidth={2.5}
strokeLinecap="round"
style={{ transform: showGenres ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
>
<polyline points="6 9 12 15 18 9"/>
</svg>
)}
</button>
)
})}
</div>
</div>
<p className="text-gray-600 text-[10px] font-semibold uppercase tracking-wider mb-2">Select a genre</p>
<div className="flex flex-wrap gap-2">
{GENRES.map((genre) => (
<button
key={genre}
onClick={() => handleGenreClick(genre)}
className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
activeGenre === genre
? 'bg-[#7B2EFF] text-[#A3FF12]'
: 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A]'
}`}
>
{genre}
</button>
))}
</div>
</div>
</div>
)}

{/* Events grid */}
<div className="px-5">
{filtered.length === 0 ? (
<div className="text-center py-16">
<svg className="mx-auto mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
<circle cx="12" cy="12" r="10"/>
<line x1="12" y1="8" x2="12" y2="13"/>
<circle cx="12" cy="16.5" r="0.5" fill="#A3FF12"/>
</svg>
<p className="text-white font-bold">Nothing in this category yet</p>
<p className="text-gray-500 text-sm mt-1">
{activeGenre ? `No ${activeGenre} events right now` : 'Check back soon'}
</p>
</div>
) : (
<div className="flex flex-col gap-4">
{filtered.map((event) => (
<EventCard key={event.id} event={event} />
))}
</div>
)}
</div>

<BottomNav />
</div>
)
}

// ─── EventCard ────────────────────────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
const soldOut = event.ticket_capacity !== null && event.tickets_sold >= (event.ticket_capacity ?? 0)
const price = event.is_free ? 'Free' : (event.price_max && event.price_max !== event.price_min)
? `$${event.price_min / 100} – $${event.price_max / 100}`
: `$${event.price_min / 100}`

return (
<Link href={`/events/${event.id}`} className="block group">
<div className="rounded-3xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] active:scale-[0.98] transition-transform">
{/* Flyer */}
<div className="relative aspect-[4/3]">
{event.flyer_url ? (
<Image src={event.flyer_url} alt={event.title} fill className="object-cover" unoptimized />
) : (
<div className="absolute inset-0 bg-gradient-to-br from-[#7B2EFF]/30 to-[#111111] flex items-center justify-center">
<span className="text-white/20 font-black text-4xl uppercase tracking-tighter">{event.title[0]}</span>
</div>
)}
{event.is_free && (
<div className="absolute top-3 left-3 bg-[#A3FF12] text-black text-xs font-black px-2 py-0.5 rounded-full">FREE</div>
)}
{soldOut && (
<div className="absolute top-3 right-3 bg-black/70 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">SOLD OUT</div>
)}
{event.boost_active && (
<div className="absolute bottom-3 right-3 bg-[#A3FF12] text-black text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1">
<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
</svg>
Featured
</div>
)}
</div>

{/* Info */}
<div className="p-4">
<h3 className="text-white font-black text-base leading-tight mb-1">{event.title}</h3>
{event.venue_name && (
<p className="text-gray-500 text-xs mb-0.5">{event.venue_name} · {event.neighborhood}</p>
)}
<p className="text-gray-600 text-xs mb-3">
{format(new Date(event.starts_at), 'EEE, MMM d · h:mm a')}
</p>
<div className="flex items-center justify-between">
<span className="text-[#A3FF12] font-bold text-sm">{price}</span>
<span className="text-xs text-gray-600 bg-[#111] px-2 py-1 rounded-lg border border-[#2A2A2A]">
{event.category?.toUpperCase() || 'EVENT'}
</span>
</div>
</div>
</div>
</Link>
)
}

// ─── Pull-to-refresh ──────────────────────────────────────────────────────────────
function usePullToRefresh(onRefresh: () => Promise<void>) {
const [ptr, setPtr] = useState({ progress: 0, refreshing: false })
const startY = useRef(0)
const pulling = useRef(false)
const prog = useRef(0)
const fn = useRef(onRefresh)
fn.current = onRefresh

useEffect(() => {
const T = 60
const onStart = (e: TouchEvent) => {
if (window.scrollY <= 0) { startY.current = e.touches[0].clientY; pulling.current = true }
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
}, [])

return ptr
}

function PullIndicator({ progress, refreshing }: { progress: number; refreshing: boolean }) {
if (!progress && !refreshing) return null
return (
<div
className="fixed left-1/2 pointer-events-none"
style={{
top: 12,
transform: `translateX(-50%) translateY(${refreshing ? 0 : (progress - 1) * 28}px)`,
opacity: Math.min(progress * 2, 1),
transition: refreshing ? 'transform 0.2s ease, opacity 0.2s ease' : 'none',
zIndex: 60,
}}
>
<div
className={`w-6 h-6 rounded-full border-2 ${refreshing ? 'animate-spin' : ''}`}
style={{
borderColor: '#7B2EFF',
borderTopColor: 'transparent',
transform: !refreshing ? `rotate(${progress * 270}deg)` : undefined,
}}
/>
</div>
)
}
