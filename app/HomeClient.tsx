'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EventCard from '@/components/EventCard'
import BottomNav from '@/components/BottomNav'
import SplashScreen from '@/components/SplashScreen'
import type { Event } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'

interface Props {
  events: Event[]
  featured: Event[]
  upcoming: Event[]
  activeCategory: string
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "Good morning, NYC"
  if (hour >= 12 && hour < 17) return "Tonight's looking good"
  if (hour >= 17 && hour < 21) return "What's happening"
  if (hour >= 21 || hour < 2) return "Still going?"
  return "Night owl mode"
}

function getSubGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "Plan your night"
  if (hour >= 12 && hour < 17) return "Doors open soon"
  if (hour >= 17 && hour < 21) return "Events starting now"
  return "The city doesn't sleep"
}

function getCategoryIcon(value: string) {
  switch (value) {
    case 'club':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {/* Saturday Night Fever dancer */}
          <circle cx="14" cy="4" r="2"/>
          <line x1="13" y1="7" x2="19" y2="2"/>
          <line x1="12" y1="9" x2="7" y2="12"/>
          <path d="M13 6 L12 14"/>
          <line x1="12" y1="14" x2="14" y2="21"/>
          <line x1="12" y1="14" x2="5" y2="19"/>
        </svg>
      )
    case 'house':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
      )
    case 'techno':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      )
    case 'rave':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round">
          {/* Audio waveform equalizer */}
          <line x1="4" y1="10" x2="4" y2="14"/>
          <line x1="8" y1="7" x2="8" y2="17"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
          <line x1="16" y1="7" x2="16" y2="17"/>
          <line x1="20" y1="10" x2="20" y2="14"/>
        </svg>
      )
    case 'live':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18a4 4 0 0 0 6-5.5L19 8a2 2 0 0 0-3-3L11.5 9.5A4 4 0 1 0 9 18z"/>
          <circle cx="9" cy="18" r="1" fill="#A3FF12" stroke="none"/>
        </svg>
      )
    case 'date':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      )
    case 'rooftop':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="20" x2="22" y2="20"/>
          <path d="M3 20V11l5-5 4 4 5-6 5 7v9"/>
        </svg>
      )
    case 'bar':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="22" x2="16" y2="22"/>
          <line x1="12" y1="11" x2="12" y2="22"/>
          <path d="M3 3l18 0L12 11 3 3z"/>
        </svg>
      )
    case 'community':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    default:
      return null
  }
}

export default function HomeClient({ events, featured, upcoming, activeCategory }: Props) {
  const router = useRouter()

  const handleCategory = (cat: string) => {
    router.push(cat === 'all' ? '/' : `/?category=${cat}`)
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-28">
      <SplashScreen />

      {/* Header */}
      <header className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-black text-white" suppressHydrationWarning>{getGreeting()}</h1>
            <p className="text-gray-500 text-sm mt-0.5" suppressHydrationWarning>{getSubGreeting()}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-1">
              <span className="text-[#7B2EFF] font-black text-lg tracking-tight">Tea</span>
              <span className="text-[#A3FF12] font-black text-lg tracking-tight">Cat</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Category Pills */}
      <div className="px-5 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`pill flex-shrink-0 flex items-center gap-1.5 ${activeCategory === cat.value ? 'pill-active' : 'pill-inactive'}`}
            >
              {getCategoryIcon(cat.value)}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Tonight */}
      {featured.length > 0 && (
        <section className="mb-8">
          <div className="px-5 flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Featured Tonight
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </h2>
            <Link href="/explore" className="text-[#7B2EFF] text-sm font-semibold">See all</Link>
          </div>
          <div className="flex gap-4 px-5 overflow-x-auto pb-2">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {/* Happening Tonight */}
      <section className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">
            {activeCategory === 'all' ? 'Happening Tonight' : CATEGORIES.find(c => c.value === activeCategory)?.label || 'Events'}
          </h2>
          <Link href="/explore" className="text-[#7B2EFF] text-sm font-semibold">Explore</Link>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState category={activeCategory} />
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} variant="list" />
            ))}
          </div>
        )}
      </section>

      {/* Boost CTA */}
      <div className="mx-5 mt-8 p-4 rounded-2xl bg-gradient-to-r from-[#7B2EFF]/20 to-[#A3FF12]/10 border border-[#7B2EFF]/30">
        <p className="text-white font-bold text-sm mb-1 flex items-center gap-1.5">
          You host events?
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B2EFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </p>
        <p className="text-gray-400 text-xs mb-3">0% platform fee. Boost your event for $20, get $15 in credits back.</p>
        <Link href="/host" className="inline-block bg-[#7B2EFF] text-white text-xs font-bold px-4 py-2 rounded-full">
          List your event →
        </Link>
      </div>

      <BottomNav />
    </div>
  )
}

function EmptyState({ category }: { category: string }) {
  return (
    <div className="text-center py-16">
      <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="20" x2="22" y2="20"/>
        <path d="M3 20V11l5-5 4 4 5-6 5 7v9"/>
        <path d="M9 20v-5h6v5"/>
      </svg>
      <p className="text-white font-bold text-lg">Nothing yet</p>
      <p className="text-gray-500 text-sm mt-1">
        {category !== 'all'
          ? `No ${category} events tonight — try another vibe`
          : 'No events tonight yet — check back soon'}
      </p>
    </div>
  )
}
