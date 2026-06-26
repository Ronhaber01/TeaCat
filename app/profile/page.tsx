'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import type { User, Ticket, SavedEvent, Event } from '@/lib/types'

type ProfileMode = 'user' | 'host'
const USER_TABS = ['History', 'Saved', 'Crew'] as const
type UserTab = typeof USER_TABS[number]

export default function ProfilePage() {
const { user, loading: authLoading, signOut } = useAuth()
const router = useRouter()
const [mode, setMode] = useState<ProfileMode>('user')
const [tab, setTab] = useState<UserTab>('History')
const [profile, setProfile] = useState<User | null>(null)
const [tickets, setTickets] = useState<Ticket[]>([])
const [saved, setSaved] = useState<SavedEvent[]>([])
const [hostedEvents, setHostedEvents] = useState<Event[]>([])
const [loading, setLoading] = useState(true)
const [copied, setCopied] = useState(false)
const [publicUsername, setPublicUsername] = useState<string | null>(null)
const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
const [uploading, setUploading] = useState(false)
const [showCameraSheet, setShowCameraSheet] = useState(false)
const [uploadError, setUploadError] = useState<string | null>(null)
const [refreshKey, setRefreshKey] = useState(0)
const fileInputRef = useRef<HTMLInputElement>(null)
const supabase = createClient()

useEffect(() => {
if (!authLoading && !user) router.push('/auth?redirect=/profile')
}, [user, authLoading, router])

useEffect(() => {
if (!user) return
const fetchData = async () => {
const [profileRes, ticketsRes, savedRes, hostedRes] = await Promise.all([
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
supabase
.from('events')
.select('*')
.eq('host_id', user.id)
.order('starts_at', { ascending: false })
.limit(30),
])
setProfile(profileRes.data as User | null)
setTickets((ticketsRes.data || []) as Ticket[])
setSaved((savedRes.data || []) as SavedEvent[])
setHostedEvents((hostedRes.data || []) as Event[])
setLoading(false)
}
fetchData()
}, [user, refreshKey])

useEffect(() => {
if (typeof window !== 'undefined') {
const params = new URLSearchParams(window.location.search)
setPublicUsername(params.get('u'))
}
}, [])

const ptr = usePullToRefresh(useCallback(async () => {
setLoading(true)
setRefreshKey(k => k + 1)
await new Promise<void>(r => setTimeout(r, 1200))
}, []))

const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0]
if (!file || !user) return
if (fileInputRef.current) fileInputRef.current.value = ''
setUploading(true)
setUploadError(null)

try {
const dataUrl = await new Promise<string>((resolve, reject) => {
const reader = new FileReader()
reader.onload = () => resolve(reader.result as string)
reader.onerror = () => reject(new Error('Failed to read file'))
reader.readAsDataURL(file)
})

const img = new window.Image()
await new Promise<void>((resolve, reject) => {
img.onload = () => resolve()
img.onerror = () => reject(new Error('Failed to decode image'))
img.src = dataUrl
})

const canvas = document.createElement('canvas')
canvas.width = 500; canvas.height = 500
const ctx = canvas.getContext('2d')!
const s = Math.min(img.width, img.height)
ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 500, 500)

const blob = await new Promise<Blob>((resolve, reject) => {
canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', 0.85)
})

setAvatarPreview(URL.createObjectURL(blob))

const path = `${user.id}/avatar.jpg`
const { error } = await supabase.storage
.from('avatars')
.upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

if (error) throw error

const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
const cacheBustedUrl = publicUrl + '?t=' + Date.now()
await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
setAvatarPreview(cacheBustedUrl)
setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } as any : prev)
} catch (err) {
console.error('Avatar upload error:', err)
setAvatarPreview(null)
setUploadError('Upload failed, try again')
setTimeout(() => setUploadError(null), 3000)
} finally {
setUploading(false)
}
}

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
if (publicUsername) return <PublicProfile username={publicUsername} supabase={supabase} />

if (!user) return null

const handleShare = async () => {
const url = profile?.username ? `https://teacat.nyc/profile/${profile.username}` : 'https://teacat.nyc/profile'
if (typeof navigator !== 'undefined' && navigator.share) {
try { await navigator.share({ title: (profile?.full_name || 'Profile') + ' on TeaCat', url }) } catch {}
} else {
try { await navigator.clipboard.writeText(url) } catch {}
setCopied(true)
setTimeout(() => setCopied(false), 2000)
}
}

const displayName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'You'
const initials = displayName[0].toUpperCase()
const tcScore = profile?.tc_score ?? 0
const scoreLevel = tcScore >= 500 ? 'Legend' : tcScore >= 200 ? 'Regular' : 'Newbie'

const totalTicketsSold = hostedEvents.reduce((sum, e) => sum + (e.tickets_sold ?? 0), 0)
const totalRevenue = tickets
.filter(t => hostedEvents.some(e => e.id === t.event_id))
.reduce((sum, t) => sum + t.price_paid, 0)

return (
<div className="min-h-screen bg-[#111111] pb-28">
<PullIndicator {...ptr} />

{uploadError && (
<div className="fixed top-4 left-1/2 pointer-events-none" style={{ transform: 'translateX(-50%)', zIndex: 70 }}>
<div className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">{uploadError}</div>
</div>
)}

<div className="px-5 pt-14 pb-4">
<div className="flex items-start justify-between mb-4">
<div className="flex items-center gap-4">
<div className="relative flex-shrink-0">
{avatarPreview || (profile as any)?.avatar_url ? (
<img src={avatarPreview || (profile as any)?.avatar_url} alt={displayName} className="w-[72px] h-[72px] rounded-full object-cover" style={{ border: '2px solid #2A2A2A' }} />
) : (
<div className="w-[72px] h-[72px] rounded-full bg-[#1A1A1A] flex items-center justify-center text-2xl font-black" style={{ color: '#A3FF12', border: '2px solid #2A2A2A' }}>{initials}</div>
)}
{uploading && (
<div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
</div>
)}
<button onClick={() => setShowCameraSheet(true)} disabled={uploading} className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#7B2EFF] flex items-center justify-center" style={{ border: '2px solid #111111' }}>
<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
</button>
<input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleAvatarUpload} />
</div>
<div>
<h1 className="text-white font-black text-xl leading-tight">{displayName}</h1>
{profile?.username && <p className="text-gray-500 text-sm">@{profile.username}</p>}
{profile?.neighborhood && (
<p className="text-gray-600 text-xs mt-0.5 flex items-center gap-1">
<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
</svg>
{profile.neighborhood}
</p>
)}
</div>
</div>
<div className="flex gap-2">
<button onClick={handleShare} className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform">
{copied ? (
<span className="text-[#A3FF12] text-[8px] font-black leading-tight text-center">Copied!</span>
) : (
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
</svg>
)}
</button>
<a href="/profile/edit" className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform">
<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
<path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
</svg>
</a>
</div>
</div>

{profile?.bio && <p className="text-gray-400 text-sm mb-4">{profile.bio}</p>}

<div className="flex bg-[#1A1A1A] rounded-2xl p-1 border border-[#2A2A2A] mb-4">
{(['user', 'host'] as ProfileMode[]).map((m) => (
<button
key={m}
onClick={() => setMode(m)}
className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
mode === m ? 'bg-[#7B2EFF] text-[#A3FF12]' : 'text-gray-500'
}`}
>
{m === 'user' ? 'Fan Mode' : 'Host Mode'}
</button>
))}
</div>

{mode === 'user' ? (
<div className="flex gap-3">
<div className="flex-1 bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
<p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">TC Score</p>
<div className="flex items-end gap-2">
<span className="text-[#A3FF12] font-black text-3xl">{tcScore}</span>
<span className="text-gray-500 text-xs mb-1">{scoreLevel}</span>
</div>
<div className="mt-2 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
<div className="h-full bg-gradient-to-r from-[#7B2EFF] to-[#A3FF12] rounded-full" style={{ width: `${Math.min((tcScore / 500) * 100, 100)}%` }}/>
</div>
</div>
<div className="flex-1 bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
<p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Events</p>
<span className="text-white font-black text-3xl">{tickets.length}</span>
<p className="text-gray-600 text-xs mt-1">total attended</p>
</div>
</div>
) : (
<div className="flex gap-3">
<div className="flex-1 bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
<p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Events Hosted</p>
<span className="text-[#A3FF12] font-black text-3xl">{hostedEvents.length}</span>
<p className="text-gray-600 text-xs mt-1">all time</p>
</div>
<div className="flex-1 bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
<p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Tickets Sold</p>
<span className="text-[#A3FF12] font-black text-3xl">{totalTicketsSold}</span>
<p className="text-gray-600 text-xs mt-1">total</p>
</div>
</div>
)}
</div>

{mode === 'user' && (
<>
<div className="px-5 mb-6">
<div className="flex bg-[#1A1A1A] rounded-2xl p-1 border border-[#2A2A2A]">
{USER_TABS.map((t) => (
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

<div className="px-5">
{tab === 'History' && (
tickets.length === 0 ? (
<EmptyTab title="No events yet" sub="Your tickets will appear here" />
) : (
<div className="grid grid-cols-2 gap-3">
{tickets.map((ticket) => {
const event = ticket.event as any
return (
<a key={ticket.id} href={`/events/${event?.id}`} className="block">
<div className="relative rounded-2xl overflow-hidden bg-[#1A1A1A]" style={{ aspectRatio: '1' }}>
{event?.flyer_url ? (
<Image src={event.flyer_url} alt={event.title || 'Event'} fill className="object-cover" unoptimized />
) : (
<div className="absolute inset-0 flex items-center justify-center p-3" style={{ background: 'linear-gradient(135deg, rgba(123,46,255,0.2), rgba(163,255,18,0.2))' }}>
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
</a>
)
})}
</div>
)
)}
{tab === 'Saved' && (
saved.length === 0 ? (
<EmptyTab title="Nothing saved" sub="Tap the bookmark on any event to save it" />
) : (
<div className="flex flex-col gap-3">
{saved.map((se) => se.event && (
<a key={se.id} href={`/events/${se.event.id}`} className="block">
<div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform">
<div className="w-12 h-12 rounded-xl bg-[#7B2EFF]/20 border border-[#7B2EFF]/30 flex items-center justify-center flex-shrink-0">
<span className="text-[#7B2EFF] text-xs font-bold uppercase">{(se.event.category || 'EVT').slice(0, 3)}</span>
</div>
<div className="flex-1 min-w-0">
<h3 className="text-white font-bold text-sm line-clamp-1">{se.event.title}</h3>
<p className="text-gray-500 text-xs mt-0.5">{se.event.venue_name}</p>
<p className="text-gray-600 text-xs mt-0.5">{format(new Date(se.event.starts_at), 'EEE, MMM d')}</p>
</div>
</div>
</a>
))}
</div>
)
)}
{tab === 'Crew' && <EmptyTab title="Crew coming soon" sub="Invite friends to see their events" />}
</div>
</>
)}

{mode === 'host' && (
<div className="px-5">
<div className="flex gap-3 mb-6">
<a href="/host/create" className="flex-1 bg-[#7B2EFF] rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
</svg>
<span className="text-white font-bold text-sm">New Event</span>
</a>
<a href="/scan" className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<path d="M3 9V5a2 2 0 0 1 2-2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/>
<path d="M21 15v4a2 2 0 0 1-2 2h-4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/>
<rect x="7" y="7" width="10" height="10" rx="1"/>
</svg>
<span className="text-white font-bold text-sm">Scan Tickets</span>
</a>
</div>

<div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A] mb-4">
<p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
<span className="text-[#A3FF12] font-black text-4xl">${(totalRevenue / 100).toFixed(2)}</span>
<p className="text-gray-600 text-xs mt-1">from {totalTicketsSold} tickets across {hostedEvents.length} events</p>
</div>

<p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Your Events</p>
{hostedEvents.length === 0 ? (
<EmptyTab title="No events yet" sub="Create your first event to get started" />
) : (
<div className="flex flex-col gap-3">
{hostedEvents.map((event) => (
<a key={event.id} href={`/host/events/${event.id}`} className="block">
<div className="flex items-center gap-3 p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] active:scale-95 transition-transform">
<div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#7B2EFF]/20">
{event.flyer_url ? (
<Image src={event.flyer_url} alt={event.title} width={48} height={48} className="w-full h-full object-cover" unoptimized />
) : (
<div className="w-full h-full flex items-center justify-center">
<span className="text-[#7B2EFF] text-xs font-black">{event.title[0]}</span>
</div>
)}
</div>
<div className="flex-1 min-w-0">
<h3 className="text-white font-bold text-sm line-clamp-1">{event.title}</h3>
<p className="text-gray-500 text-xs">{format(new Date(event.starts_at), 'MMM d, yyyy')}</p>
<p className="text-[#A3FF12] text-xs font-bold mt-0.5">{event.tickets_sold} tickets sold</p>
</div>
<div className={`w-2 h-2 rounded-full flex-shrink-0 ${event.is_published ? 'bg-[#A3FF12]' : 'bg-gray-600'}`} />
</div>
</a>
))}
</div>
)}
</div>
)}

<div className="px-5 mt-8">
<button
onClick={handleSignOut}
className="w-full border border-[#2A2A2A] rounded-2xl py-4 text-gray-600 text-sm font-semibold active:scale-95 transition-transform"
>
Sign out
</button>
</div>

{showCameraSheet && (
<div className="fixed inset-0 z-[60] flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowCameraSheet(false)}>
<div className="rounded-t-3xl p-6 pb-10" style={{ background: '#1A1A1A' }} onClick={e => e.stopPropagation()}>
<div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#333' }}/>
<p className="font-black text-lg mb-2 text-center" style={{ color: '#A3FF12' }}>You're in your prime</p>
<p className="text-sm text-center mb-6 leading-relaxed" style={{ color: '#999' }}>We age like wine — show us where you're at right now, at your peak. This is your moment.</p>
<button onClick={() => { setShowCameraSheet(false); fileInputRef.current?.click() }} className="w-full py-4 rounded-2xl font-black text-base text-white" style={{ background: '#7B2EFF' }}>
Take the shot
</button>
<button onClick={() => setShowCameraSheet(false)} className="w-full py-3 mt-2 text-sm" style={{ color: '#666' }}>
Maybe later
</button>
</div>
</div>
)}
<BottomNav />
</div>
)
}

function EmptyTab({ title, sub }: { title: string; sub: string }) {
return (
<div className="text-center py-12">
<svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A3FF12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/>
<circle cx="12" cy="16.5" r="0.5" fill="#A3FF12"/>
</svg>
<p className="text-white font-bold">{title}</p>
<p className="text-gray-500 text-sm mt-1">{sub}</p>
</div>
)
}

function PublicProfile({ username, supabase }: { username: string; supabase: any }) {
const [pub, setPub] = useState<any>(null)
const [events, setEvents] = useState<any[]>([])
const [loading, setLoading] = useState(true)
const [isPrivate, setIsPrivate] = useState(false)

useEffect(() => {
const fetchPublic = async () => {
const { data: u } = await supabase
.from('users')
.select('id, full_name, username, avatar_url, bio, neighborhood, hide_from_attendee_list')
.eq('username', username)
.single()

if (!u || u.hide_from_attendee_list) { setIsPrivate(true); setLoading(false); return }
setPub(u)

const { data: rows } = await supabase
.from('tickets')
.select('event:events(id, title, starts_at, flyer_url, venue_name)')
.eq('user_id', u.id)
.in('status', ['active', 'used'])
.order('created_at', { ascending: false })
.limit(20)

if (rows) setEvents(rows.map((r: any) => r.event).filter(Boolean))
setLoading(false)
}
fetchPublic()
}, [username])

if (loading) return (
<div className="min-h-screen bg-[#111111] flex items-center justify-center">
<div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
</div>
)

if (isPrivate || !pub) return (
<div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center px-5 gap-4">
<div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>
</div>
<p className="text-white font-bold text-lg">This profile is private</p>
<p className="text-gray-500 text-sm text-center">This user has chosen to keep their profile private</p>
<a href="/" className="text-[#A3FF12] text-sm font-semibold mt-2">Back home</a>
</div>
)

const name = pub.full_name || pub.username || 'User'
return (
<div className="min-h-screen bg-[#111111] pb-28">
<div className="px-5 pt-14 pb-6">
<a href="/" className="flex items-center gap-2 text-gray-500 text-sm mb-6">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg>
Back
</a>
<div className="flex items-center gap-4 mb-4">
{pub.avatar_url ? (
<img src={pub.avatar_url} alt={name} className="w-[72px] h-[72px] rounded-full object-cover flex-shrink-0" style={{ border: '2px solid #2A2A2A' }} />
) : (
<div className="w-[72px] h-[72px] rounded-full bg-[#1A1A1A] flex items-center justify-center text-2xl font-black flex-shrink-0" style={{ color: '#A3FF12', border: '2px solid #2A2A2A' }}>
{name[0].toUpperCase()}
</div>
)}
<div>
<h1 className="text-white font-black text-xl">{name}</h1>
{pub.username && <p className="text-gray-500 text-sm">@{pub.username}</p>}
{pub.neighborhood && <p className="text-gray-600 text-xs mt-0.5">{pub.neighborhood}</p>}
</div>
</div>
{pub.bio && <p className="text-gray-400 text-sm mb-6">{pub.bio}</p>}
{events.length > 0 && (
<>
<p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">Events attended</p>
<div className="grid grid-cols-2 gap-3">
{events.map((ev: any) => (
<a key={ev.id} href={`/events/${ev.id}`} className="block">
<div className="rounded-2xl overflow-hidden bg-[#1A1A1A] border border-[#2A2A2A] relative" style={{ aspectRatio: '1' }}>
{ev.flyer_url ? (
<img src={ev.flyer_url} alt={ev.title} className="w-full h-full object-cover" />
) : (
<div className="absolute inset-0 flex items-center justify-center p-3 bg-gradient-to-br from-[#7B2EFF]/20 to-transparent">
<p className="text-white font-bold text-xs text-center">{ev.title}</p>
</div>
)}
<div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/60">
<p className="text-white text-xs font-semibold line-clamp-1">{ev.title}</p>
</div>
</div>
</a>
))}
</div>
</>
)}
</div>
<BottomNav />
</div>
)
}

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
style={{ top: 12, transform: `translateX(-50%) translateY(${refreshing ? 0 : (progress - 1) * 28}px)`, opacity: Math.min(progress * 2, 1), transition: refreshing ? 'transform 0.2s ease, opacity 0.2s ease' : 'none', zIndex: 60 }}
>
<div
className={`w-6 h-6 rounded-full border-2 ${refreshing ? 'animate-spin' : ''}`}
style={{ borderColor: '#7B2EFF', borderTopColor: 'transparent', transform: !refreshing ? `rotate(${progress * 270}deg)` : undefined }}
/>
</div>
)
}
