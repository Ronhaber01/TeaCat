'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { User, Ticket, SavedEvent } from '@/lib/types'

const TABS = ['History', 'Saved', 'Crew'] as const
type Tab = typeof TABS[number]

const CATEGORY_EMOJI: Record<string, string> = {
  club: '🕺', house: '🏠', techno: '⚡', rave: '🌀', live: '🎸',
  date: '🌹', rooftop: '🌃', bar: '🍸', community: '❤️', other: '🎉',
}

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
  const scoreLevel = tcScore >= 500 ? '🔥 Legend' : tcScore >= 200 ? '⚡ Regular' : '🌱 Newbie'
  const pastTickets = tickets.filter((t) => t.status === 'used' || t.status === 'cancelled')
  const upcomingTickets = tickets.filter((t) => t.status === 'active')

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
              {profile?.neighborhood && <p className="text-gray-600 text-xs mt-0.5">📍 {profile.neighborhood}</p>}
            </div>
          </div>
          {/* Edit profile */}
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
                tab === t ? 'bg-[#7B2EFF] text-white' : 'text-gray-500'
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
          <div className="flex flex-col gap-3">
            {tickets.length === 0 ? (
              <EmptyTab icon="🌃" title="No events yet" sub="Your tickets will appear here" />
            ) : (
              tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))
            )}
          </div>
        )}

        {tab === 'Saved' && (
          <div className="flex flex-col gap-3">
            {saved.length === 0 ? (
              <EmptyTab icon="🔖" title="Nothing saved" sub="Tap the bookmark on any event to save it" />
            ) : (
              saved.map((se) => se.event && (
                <Link key={se.id} href={`/events/${se.event.id}`} className="block">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-xl flex-shrink-0">
                      {CATEGORY_EMOJI[se.event.category || 'other'] || '🎉'}
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
          <EmptyTab icon="👥" title="Crew coming soon" sub="Invite your friends to see what they're going to" />
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

function TicketRow({ ticket }: { ticket: Ticket }) {
  const event = ticket.event as any
  return (
    <Link href={`/tickets`} className="block">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform">
        <div className="w-1 h-14 rounded-full bg-[#7B2EFF] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm line-clamp-1">{event?.title || 'Event'}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{event?.venue_name} · {ticket.tier}</p>
          <div className="flex items-center gap-2 mt-1">
            {event?.starts_at && (
              <span className="text-gray-600 text-xs">{format(new Date(event.starts_at), 'EEE, MMM d')}</span>
            )}
            <span className={`text-xs font-semibold ${ticket.status === 'active' ? 'text-[#A3FF12]' : 'text-gray-600'}`}>
              {ticket.status === 'active' ? '● Active' : '✓ Used'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-sm">${(ticket.price_paid / 100).toFixed(0)}</p>
        </div>
      </div>
    </Link>
  )
}

function EmptyTab({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-white font-bold">{title}</p>
      <p className="text-gray-500 text-sm mt-1">{sub}</p>
    </div>
  )
}
