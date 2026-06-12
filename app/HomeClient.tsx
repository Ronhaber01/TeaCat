'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import EventCard from '@/components/EventCard'
import BottomNav from '@/components/BottomNav'
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
  if (hour >= 5 && hour < 12) return "Good morning, NYC 🌤️"
  if (hour >= 12 && hour < 17) return "Tonight's looking good 🌆"
  if (hour >= 17 && hour < 21) return "What's happening 🔥"
  if (hour >= 21 || hour < 2) return "Still going? 🌙"
  return "Night owl mode 🦉"
}

function getSubGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return "Plan your night"
  if (hour >= 12 && hour < 17) return "Doors open soon"
  if (hour >= 17 && hour < 21) return "Events starting now"
  return "The city doesn't sleep"
}

export default function HomeClient({ events, featured, upcoming, activeCategory }: Props) {
  const router = useRouter()

  const handleCategory = (cat: string) => {
    router.push(cat === 'all' ? '/' : `/?category=${cat}`)
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-28">
      {/* Header */}
      <header className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-black text-white">{getGreeting()}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{getSubGreeting()}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {/* Logo pill */}
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
              className={`pill flex-shrink-0 ${activeCategory === cat.value ? 'pill-active' : 'pill-inactive'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Tonight */}
      {featured.length > 0 && (
        <section className="mb-8">
          <div className="px-5 flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white">
              Featured Tonight <span className="text-[#A3FF12]">🔥</span>
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

      {/* Boost CTA for hosts */}
      <div className="mx-5 mt-8 p-4 rounded-2xl bg-gradient-to-r from-[#7B2EFF]/20 to-[#A3FF12]/10 border border-[#7B2EFF]/30">
        <p className="text-white font-bold text-sm mb-1">You host events? 🎉</p>
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
      <div className="text-5xl mb-4">🌃</div>
      <p className="text-white font-bold text-lg">Nothing yet</p>
      <p className="text-gray-500 text-sm mt-1">
        {category !== 'all'
          ? `No ${category} events tonight — try another vibe`
          : 'No events tonight yet — check back soon'}
      </p>
    </div>
  )
}
