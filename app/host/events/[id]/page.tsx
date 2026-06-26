import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Event } from '@/lib/types'
import PublishToggle from './PublishToggle'

export default async function ManageEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: host } = await supabase.from('hosts').select('id').eq('user_id', user.id).single()
  if (!host) redirect('/host')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .eq('host_id', host.id)
    .single()

  if (!event) notFound()

  const e = event as Event
  const soldPct = e.ticket_capacity ? Math.round((e.tickets_sold / e.ticket_capacity) * 100) : null
  const revenue = (e.tickets_sold * e.price_min / 100).toFixed(2)

  return (
    <div className="min-h-screen bg-[#111111] pb-10">
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/host" className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-gray-500 text-xs">Manage event</p>
            <h1 className="text-white font-black text-lg leading-tight line-clamp-1">{e.title}</h1>
          </div>
        </div>

        {/* Status + Publish toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] mb-4">
          <div>
            <p className="text-white font-semibold text-sm">
              {e.is_published ? '● Live' : '○ Draft'}
            </p>
            <p className="text-gray-500 text-xs">{e.is_published ? 'Visible to everyone' : 'Not visible to attendees'}</p>
          </div>
          <PublishToggle eventId={e.id} isPublished={e.is_published} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2A2A2A] text-center">
            <p className="text-white font-black text-xl">{e.tickets_sold}</p>
            <p className="text-gray-600 text-xs mt-0.5">Tickets</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2A2A2A] text-center">
            <p className="text-[#A3FF12] font-black text-xl">${revenue}</p>
            <p className="text-gray-600 text-xs mt-0.5">Revenue</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2A2A2A] text-center">
            <p className="text-white font-black text-xl">{soldPct ?? '—'}%</p>
            <p className="text-gray-600 text-xs mt-0.5">Sold</p>
          </div>
        </div>

        {/* Capacity bar */}
        {soldPct !== null && (
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500 text-xs">{e.tickets_sold} / {e.ticket_capacity} tickets sold</span>
              <span className="text-gray-500 text-xs">{soldPct}%</span>
            </div>
            <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${soldPct >= 90 ? 'bg-[#A3FF12]' : 'bg-[#7B2EFF]'}`}
                style={{ width: `${soldPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Event details */}
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] divide-y divide-[#2A2A2A] mb-6">
          <Row label="Date" value={format(new Date(e.starts_at), 'EEEE, MMMM d · h:mm a')} />
          {e.venue_name && <Row label="Venue" value={e.venue_name} />}
          {e.neighborhood && <Row label="Neighborhood" value={e.neighborhood} />}
          <Row label="Category" value={e.category || '—'} />
          <Row label="Price" value={e.is_free ? 'Free' : `$${e.price_min / 100}`} />
          <Row label="Boost" value={e.boost_active ? 'Active' : 'Not boosted'} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href={`/host/scan/${e.id}`} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#A3FF12] text-[#111111] font-black text-base active:scale-95 transition-transform">
            Scan tickets at door
          </Link>
          {!e.boost_active && (
            <Link href={`/host/boost?eventId=${e.id}`} className="btn-primary block text-center">
              Boost this event ($20 → get $15 back)
            </Link>
          )}
          <Link href={`/events/${e.id}`} className="btn-secondary block text-center">
            View public page →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="text-white text-sm font-semibold capitalize">{value}</span>
    </div>
  )
}
