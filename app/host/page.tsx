import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Event, Host } from '@/lib/types'

export default async function HostDashboard() {
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth?redirect=/host')

const { data: host } = await supabase
.from('hosts')
.select('*')
.eq('user_id', user.id)
.single()

if (!host) {
return <HostSetup userId={user.id} />
}

const { data: events } = await supabase
.from('events')
.select('*')
.eq('host_id', host.id)
.order('starts_at', { ascending: false })
.limit(20)

const allEvents = (events || []) as Event[]
const upcoming = allEvents.filter((e) => new Date(e.starts_at) > new Date() && !e.is_cancelled)
const past = allEvents.filter((e) => new Date(e.starts_at) <= new Date() || e.is_cancelled)
const totalTickets = allEvents.reduce((sum, e) => sum + e.tickets_sold, 0)

return (
<div className="min-h-screen bg-[#111111] pb-10">
{/* Header */}
<div className="px-5 pt-14 pb-6">
<div className="flex items-center justify-between mb-2">
<div>
<p className="text-gray-500 text-sm">Host dashboard</p>
<h1 className="text-white font-black text-2xl">{host.name}</h1>
</div>
{host.is_verified && (
<span className="bg-[#A3FF12]/20 border border-[#A3FF12]/40 text-[#A3FF12] text-xs font-bold px-3 py-1 rounded-full">
\u2713 Verified
</span>
)}
</div>

{/* Stats */}
<div className="grid grid-cols-3 gap-3 mt-4">
<StatCard label="Events" value={allEvents.length.toString()} />
<StatCard label="Tickets Sold" value={totalTickets.toString()} />
<StatCard label="Boost Credits" value={`$${(host.boost_credits / 100).toFixed(0)}`} accent />
</div>
</div>

{/* Boost CTA */}
<div className="mx-5 mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#7B2EFF]/20 to-[#A3FF12]/10 border border-[#7B2EFF]/30">
<div className="flex items-center justify-between">
<div>
<p className="text-white font-bold text-sm">Boost your next event \uD83D\uDE80</p>
<p className="text-gray-400 text-xs mt-0.5">Spend $20 \u00B7 Get $15 back in credits</p>
</div>
<Link href="/host/boost" className="bg-[#7B2EFF] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex-shrink-0 active:scale-95 transition-transform">
Boost \u2192
</Link>
</div>
</div>

{/* Action buttons */}
<div className="px-5 mb-6 flex flex-col gap-3">
<Link
href="/host/create"
className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#7B2EFF] text-white font-black text-base active:scale-95 transition-transform shadow-lg shadow-[#7B2EFF]/30"
>
<span className="text-xl">+</span> Create New Event
</Link>
<Link
href="/scan"
className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] text-white font-bold text-base active:scale-95 transition-transform"
>
<span className="text-xl">\uD83D\uDCF7</span> Scan Tickets
</Link>
</div>

{/* Upcoming events */}
<div className="px-5">
{upcoming.length > 0 && (
<section className="mb-6">
<h2 className="text-white font-black text-lg mb-3">Upcoming ({upcoming.length})</h2>
<div className="flex flex-col gap-3">
{upcoming.map((event) => (
<HostEventRow key={event.id} event={event} />
))}
</div>
</section>
)}

{past.length > 0 && (
<section>
<h2 className="text-gray-600 font-black text-lg mb-3">Past Events</h2>
<div className="flex flex-col gap-3">
{past.slice(0, 5).map((event) => (
<HostEventRow key={event.id} event={event} past />
))}
</div>
</section>
)}

{allEvents.length === 0 && (
<div className="text-center py-12">
<div className="text-5xl mb-4">\uD83C\uDF89</div>
<p className="text-white font-bold text-lg">No events yet</p>
<p className="text-gray-500 text-sm mt-1">Create your first event to get started</p>
</div>
)}
</div>
</div>
)
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
return (
<div className="bg-[#1A1A1A] rounded-2xl p-3 border border-[#2A2A2A] text-center">
<p className={`font-black text-xl ${accent ? 'text-[#A3FF12]' : 'text-white'}`}>{value}</p>
<p className="text-gray-600 text-xs mt-0.5">{label}</p>
</div>
)
}

function HostEventRow({ event, past }: { event: Event; past?: boolean }) {
const soldPct = event.ticket_capacity
? Math.round((event.tickets_sold / event.ticket_capacity) * 100)
: null

return (
<Link href={`/host/events/${event.id}`} className="block">
<div className={`p-4 rounded-2xl border active:scale-95 transition-transform ${past ? 'bg-[#1A1A1A] border-[#2A2A2A] opacity-60' : 'bg-[#1A1A1A] border-[#2A2A2A]'}`}>
<div className="flex items-start justify-between gap-3 mb-2">
<h3 className="text-white font-bold text-sm leading-tight line-clamp-1 flex-1">{event.title}</h3>
<div className="flex gap-2 flex-shrink-0">
{event.boost_active && (
<span className="text-[#A3FF12] text-xs font-bold">\uD83D\uDD25</span>
)}
{!event.is_published && (
<span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Draft</span>
)}
</div>
</div>
<p className="text-gray-500 text-xs mb-2">{format(new Date(event.starts_at), 'EEE, MMM d \u00B7 h:mm a')} \u00B7 {event.neighborhood}</p>

{event.ticket_capacity && (
<div>
<div className="flex items-center justify-between mb-1">
<span className="text-gray-600 text-xs">{event.tickets_sold} / {event.ticket_capacity} tickets</span>
<span className="text-gray-500 text-xs">{soldPct}%</span>
</div>
<div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
<div
className={`h-full rounded-full ${soldPct! >= 90 ? 'bg-[#A3FF12]' : 'bg-[#7B2EFF]'}`}
style={{ width: `${soldPct}%` }}
/>
</div>
</div>
)}
</div>
</Link>
)
}

function HostSetup({ userId }: { userId: string }) {
return (
<div className="min-h-screen bg-[#111111] px-5 pt-20 pb-10">
<div className="text-5xl mb-6">\uD83C\uDFAA</div>
<h1 className="text-white font-black text-3xl mb-2">Become a host</h1>
<p className="text-gray-400 text-sm mb-8 leading-relaxed">
List events, keep 100% of ticket revenue, and reach NYC&apos;s nightlife community. Boost to get $15 back for every $20 spent.
</p>
<Link href="/host/setup" className="btn-primary block text-center">
Set up host profile \u2192
</Link>
</div>
)
}
