'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import EventCard from '@/components/EventCard'
import BottomNav from '@/components/BottomNav'
import type { Event } from '@/lib/types'
import { CATEGORIES, VIBES, SITUATIONS } from '@/lib/types'

interface Props {
  events: Event[]
  initialQ: string
  activeCategory: string
  activeVibe: string
  activeSituation: string
}

export default function ExploreClient({
  events,
  initialQ,
  activeCategory,
  activeVibe,
  activeSituation,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [q, setQ] = useState(initialQ)

  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams()
    const current = { q, category: activeCategory, vibe: activeVibe, situation: activeSituation, ...updates }
    if (current.q) params.set('q', current.q)
    if (current.category && current.category !== 'all') params.set('category', current.category)
    if (current.vibe) params.set('vibe', current.vibe)
    if (current.situation) params.set('situation', current.situation)
    startTransition(() => router.push(`/explore?${params.toString()}`))
  }

  const handleSearch = (val: string) => {
    setQ(val)
    const params = new URLSearchParams()
    if (val) params.set('q', val)
    if (activeCategory !== 'all') params.set('category', activeCategory)
    if (activeVibe) params.set('vibe', activeVibe)
    if (activeSituation) params.set('situation', activeSituation)
    startTransition(() => router.push(`/explore?${params.toString()}`))
  }

  const toggleFilter = (type: 'category' | 'vibe' | 'situation', value: string) => {
    const map = { category: activeCategory, vibe: activeVibe, situation: activeSituation }
    const current = map[type]
    const next = current === value ? '' : value
    if (type === 'category') {
      updateFilters({ category: next || 'all' })
    } else {
      updateFilters({ [type]: next })
    }
  }

  const hasFilters = activeCategory !== 'all' || activeVibe || activeSituation || q

  return (
    <div className="min-h-screen bg-[#111111] pb-28">
      {/* Header */}
      <header className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black text-white mb-4">Explore NYC 🗽</h1>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search events, venues, neighborhoods..."
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#7B2EFF] transition-colors"
          />
          {q && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Category pills */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => toggleFilter('category', cat.value)}
              className={`pill flex-shrink-0 ${activeCategory === cat.value ? 'pill-active' : 'pill-inactive'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vibe filters */}
      <div className="px-5 mb-3">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">Vibe</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {VIBES.map((v) => (
            <button
              key={v.value}
              onClick={() => toggleFilter('vibe', v.value)}
              className={`pill flex-shrink-0 text-xs ${activeVibe === v.value ? 'pill-active' : 'pill-inactive'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Situation filters */}
      <div className="px-5 mb-6">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">Going as</p>
        <div className="flex gap-2">
          {SITUATIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => toggleFilter('situation', s.value)}
              className={`pill flex-shrink-0 text-xs ${activeSituation === s.value ? 'pill-active' : 'pill-inactive'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <div className="px-5 mb-4">
          <button
            onClick={() => { setQ(''); router.push('/explore') }}
            className="text-[#7B2EFF] text-sm font-semibold"
          >
            ✕ Clear all filters
          </button>
        </div>
      )}

      {/* Results */}
      <div className="px-5">
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-4">
          {events.length} {events.length === 1 ? 'event' : 'events'} found
        </p>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-white font-bold text-lg">No events found</p>
            <p className="text-gray-500 text-sm mt-1">Try different filters or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} variant="grid" />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
