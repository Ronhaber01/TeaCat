'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { User, Ticket, SavedEvent } from '@/lib/types'

const TABS = ['History', 'Saved', 'Crew'] as const
type Tab = typeof TABS[number]

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('History')
  const [profile, setProfile] = useState<User | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [saved, setSaved] = useState<SavedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?redirect=/profile')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [profileRes, ticketsRes, savedRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase
          .from('tickets')
          .select('*, event:events(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('saved_events')
          .select('*, event:events(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setProfile(profileRes.data as User | null)
      setTickets((ticketsRes.data || []) as Ticket[])
      setSaved((savedRes.data || []) as SavedEvent[])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const displayName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'You'
  const initials = displayName[0].toUpperCase()
  const tcScore = profile?.tc_score ?? 0
  const scoreLevel = tcScore >= 500 ? 'Legend' : tcScore >= 200 ? 'Regular' : 'Newbie'

  return (
    <div className="min-h-screen bg-[#111111] pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7B2EFF] to-[#A3FF12] flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-white font-black text-xl leading-tight">{displayName}</h1>
              {profile?.username && <p className="text-gray-500 text-sm">@{profile.username}</p>}
              {profile?.neighborhood && (
                <p className="text-gray-600 text-xs mt-0.5 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {profile.neighborhood}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
        </div>

        {profile?.bio && <p className="text-gray-400 text-sm mb-4">{profile.bio}</p>}

        {/* Stats row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">TC Score</p>
            <div className="flex items-end gap-2">
              <span className="text-[#A3FF12] font-black text-3xl">{tcScore}</span>
              <span className="text-gray-500 text-xs mb-1">{scoreLevel}</span>
            </div>
            <div className="mt-2 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7B2EFF] to-[#A3FF12] rounded-full transition-all"
                style={{ width: `${Math.min((tcScore / 500) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Events</p>
            <span className="text-white font-black text-3xl">{tickets.length}</span>
            <p className="text-gray-600 text-xs mt-1">total attended</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-6">
        <div className="flex bg-[#1A1A1A] rounded-2xl p-1 border border-[#2A2A2A]">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t ? 'bg-[#7B2EFF] text-[#A3FF12]' : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-5">
        {tab === 'History' && (
          tickets.length === 0 ? (
            <EmptyTab title="No events yet" sub="Your tickets will appear here" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tickets.map((ticket) => {
                const event = ticket.event as any
                return (
                  <Link key={ticket.id} href={`/events/${event?.id}`} className="block">
                    <div className="relative rounded-2xl overflow-hidden bg-[#1A1A1A]" style={{ aspectRatio: '1' }}>
                      {event?.flyer_url ? (
                        <Image
                          src={event.flyer_url}
                          alt={event.title || 'Event'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center p-3"
                          style={{ background: 'linear-gradient(135deg, rgba(123,46,255,0.2), rgba(163,255,18,0.2))' }}
                        >
                          <p className="text-white font-bold text-xs text-center line-clamp-3">{event?.title}</p>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/60">
                        <p className="text-white text-xs font-semibold line-clamp-1">{event?.title || 'Event'}</p>
                        <p className={`text-[10px] font-semibold ${ticket.status === 'active' ? 'text-[#A3FF12]' : 'text-gray-500'}`}>
                          {ticket.status === 'active' ? 'Active' : 'Used'}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {tab === 'Saved' && (
          <div className="flex flex-col gap-3">
            {saved.length === 0 ? (
              <EmptyTab title="Nothing saved" sub="Tap the bookmark on any event to save it" />
            ) : (
              saved.map((se) => se.event && (
                <Link key={se.id} href={`/events/${se.event.id}`} className="block">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-[#7B2EFF]/20 border border-[#7B2EFF]/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#7B2EFF] text-xs font-bold uppercase">
                        {(se.event.category || 'EVT').slice(0, 3)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm line-clamp-1">{se.event.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{se.event.venue_name} · {se.event.neighborhood}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{format(new Date(se.event.starts_at), 'EEE, MMM d · h:mm a')}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === 'Crew' && (
          <EmptyTab title="Crew coming soon" sub="Invite your friends to see what they're going to" />
        )}
      </div>

      {/* Sign out */}
      <div className="px-5 mt-8">
        <button
          onClick={handleSignOut}
          className="w-full border border-[#2A2A2A] rounded-2xl py-4 text-gray-600 text-sm font-semibold active:scale-95 transition-transform"
        >
          Sign out
        </button>
      </div>

      <BottomNav />
    </div>
  )
}

function EmptyTab({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="13"/>
        <circle cx="12" cy="16.5" r="0.5" fill="#A3FF12"/>
      </svg>
      <p className="text-white font-bold">{title}</p>
      <p className="text-gray-500 text-sm mt-1">{sub}</p>
    </div>
  )
}
