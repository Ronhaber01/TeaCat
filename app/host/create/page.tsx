'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/components/AuthProvider'
import { CATEGORIES, GENRES } from '@/lib/types'

// Exclude 'all' and 'genres' meta-pills — only real event types
const EVENT_CATEGORIES = CATEGORIES.filter(c => c.value !== 'all' && c.value !== 'genres')
const NEIGHBORHOODS = ['Bushwick', 'Williamsburg', 'LES', 'East Village', 'Harlem', 'Hell\'s Kitchen', 'Chelsea', 'Brooklyn', 'Manhattan', 'Queens', 'Bronx', 'Other']

export default function CreateEventPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    venue_name: '',
    address: '',
    neighborhood: '',
    starts_at: '',
    ends_at: '',
    category: '',
    is_free: false,
    price_min: '',
    price_max: '',
    ticket_capacity: '',
    genres: [] as string[],
    is_published: false,
  })
  const [flyerFile, setFlyerFile] = useState<File | null>(null)
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }))

  const toggleGenre = (g: string) => {
    set('genres', form.genres.includes(g)
      ? form.genres.filter((t) => t !== g)
      : [...form.genres, g]
    )
  }

  const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFlyerFile(file)
    setFlyerPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (publish: boolean) => {
    setLoading(true)
    setError('')

    const { data: host } = await supabase
      .from('hosts')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!host) {
      setError('No host profile found')
      setLoading(false)
      return
    }

    // Upload flyer if provided
    let flyerUrl: string | null = null
    if (flyerFile) {
      const ext = flyerFile.name.split('.').pop()
      const path = `${host.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('flyers')
        .upload(path, flyerFile, { upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('flyers').getPublicUrl(path)
        flyerUrl = urlData.publicUrl
      }
    }

    const { data: event, error: insertErr } = await supabase
      .from('events')
      .insert({
        host_id: host.id,
        title: form.title,
        description: form.description || null,
        flyer_url: flyerUrl,
        venue_name: form.venue_name || null,
        address: form.address || null,
        neighborhood: form.neighborhood || null,
        city: 'New York',
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        category: form.category || null,
        vibe_tags: form.genres.length ? form.genres : null,
        is_free: form.is_free,
        price_min: form.is_free ? 0 : parseInt(form.price_min || '0') * 100,
        price_max: form.is_free ? null : (form.price_max ? parseInt(form.price_max) * 100 : null),
        ticket_capacity: form.ticket_capacity ? parseInt(form.ticket_capacity) : null,
        tickets_sold: 0,
        is_published: publish,
        is_cancelled: false,
        boost_active: false,
      })
      .select()
      .single()

    setLoading(false)
    if (insertErr) { setError(insertErr.message); return }

    router.push(publish ? `/events/${event.id}` : `/host/events/${event.id}`)
  }

  return (
    <div className='min-h-screen bg-[#111111] pb-10'>
      <div className='px-5 pt-14 pb-4 flex items-center gap-4'>
        <Link href='/host' className='w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform'>
          <svg width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='#fff' strokeWidth={2.5}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
          </svg>
        </Link>
        <div>
          <h1 className='text-white font-black text-xl'>New Event</h1>
          <p className='text-gray-600 text-xs'>Step {step} of 3</p>
        </div>
      </div>

      <div className='px-5 mb-6'>
        <div className='flex gap-1'>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-[#7B2EFF]' : 'bg-[#2A2A2A]'}`} />
          ))}
        </div>
      </div>

      <div className='px-5'>
        {step === 1 && (
          <Step1 form={form} set={set} flyerPreview={flyerPreview} onFlyerChange={handleFlyerChange} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step2 form={form} set={set} toggleGenre={toggleGenre} onBack={() => setStep(1)} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <Step3
            form={form}
            set={set}
            onBack={() => setStep(2)}
            onSaveDraft={() => handleSubmit(false)}
            onPublish={() => handleSubmit(true)}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  )
}

function Step1({ form, set, flyerPreview, onFlyerChange, onNext }: any) {
  const valid = form.title && form.starts_at
  return (
    <div className='flex flex-col gap-5'>
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Event Name *</label>
        <input
          type='text'
          placeholder='e.g. Honey Dijon All Night'
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors'
        />
      </div>
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Description</label>
        <textarea
          placeholder="What's the vibe?"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors resize-none'
        />
      </div>
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Flyer / Cover Image</label>
        <label className='flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed border-[#2A2A2A] cursor-pointer hover:border-[#7B2EFF] transition-colors overflow-hidden'>
          {flyerPreview ? (
            <img src={flyerPreview} alt='Flyer preview' className='w-full h-full object-cover' />
          ) : (
            <div className='flex flex-col items-center gap-2 text-gray-600'>
              <svg width='32' height='32' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.5}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' />
              </svg>
              <span className='text-sm'>Upload flyer (optional)</span>
            </div>
          )}
          <input type='file' accept='image/*' onChange={onFlyerChange} className='hidden' />
        </label>
      </div>
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Start Time *</label>
        <input
          type='datetime-local'
          value={form.starts_at}
          onChange={(e) => set('starts_at', e.target.value)}
          className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#7B2EFF] transition-colors'
        />
      </div>
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>End Time</label>
        <input
          type='datetime-local'
          value={form.ends_at}
          onChange={(e) => set('ends_at', e.target.value)}
          className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#7B2EFF] transition-colors'
        />
      </div>
      <button onClick={onNext} disabled={!valid} className='btn-primary disabled:opacity-40'>
        Next →
      </button>
    </div>
  )
}

function Step2({ form, set, toggleGenre, onBack, onNext }: any) {
  return (
    <div className='flex flex-col gap-5'>
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Venue Name</label>
        <input type='text' placeholder='e.g. Elsewhere, Brooklyn Mirage' value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors' />
      </div>
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Address</label>
        <input type='text' placeholder='599 Johnson Ave, Brooklyn' value={form.address} onChange={(e) => set('address', e.target.value)} className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors' />
      </div>
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Neighborhood</label>
        <div className='flex gap-2 flex-wrap'>
          {NEIGHBORHOODS.map((n) => (
            <button key={n} onClick={() => set('neighborhood', n)} className={`pill text-xs ${form.neighborhood === n ? 'pill-active' : 'pill-inactive'}`}>{n}</button>
          ))}
        </div>
      </div>

      {/* Event Type */}
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Event Type</label>
        <div className='flex gap-2 flex-wrap'>
          {EVENT_CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => set('category', c.value)} className={`pill text-xs ${form.category === c.value ? 'pill-active' : 'pill-inactive'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Music Genres */}
      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block'>Music Genres</label>
        <p className='text-gray-700 text-xs mb-3'>Select all that apply — helps fans discover your event</p>
        <div className='p-3 rounded-2xl border border-[#2A2A2A] bg-[#0D0D0D]'>
          <div className='flex flex-wrap gap-2'>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  form.genres.includes(g)
                    ? 'bg-[#7B2EFF] text-[#A3FF12]'
                    : 'bg-[#1A1A1A] text-gray-500 border border-[#2A2A2A]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {form.genres.length > 0 && (
            <p className='text-[#A3FF12] text-xs font-semibold mt-3'>
              {form.genres.length} genre{form.genres.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </div>

      <div className='flex gap-3'>
        <button onClick={onBack} className='btn-secondary flex-1'>← Back</button>
        <button onClick={onNext} className='btn-primary flex-1'>Next →</button>
      </div>
    </div>
  )
}

function Step3({ form, set, onBack, onSaveDraft, onPublish, loading, error }: any) {
  return (
    <div className='flex flex-col gap-5'>
      <div className='flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]'>
        <div>
          <p className='text-white font-semibold text-sm'>Free event</p>
          <p className='text-gray-500 text-xs'>No ticket price</p>
        </div>
        <button onClick={() => set('is_free', !form.is_free)} className={`w-12 h-6 rounded-full transition-all ${form.is_free ? 'bg-[#A3FF12]' : 'bg-[#2A2A2A]'}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition-all mx-0.5 ${form.is_free ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {!form.is_free && (
        <div className='flex gap-3'>
          <div className='flex-1'>
            <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Min Price ($)</label>
            <input type='number' placeholder='20' value={form.price_min} onChange={(e) => set('price_min', e.target.value)} className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF]' />
          </div>
          <div className='flex-1'>
            <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Max Price ($)</label>
            <input type='number' placeholder='40' value={form.price_max} onChange={(e) => set('price_max', e.target.value)} className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF]' />
          </div>
        </div>
      )}

      <div>
        <label className='text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block'>Ticket Capacity</label>
        <input type='number' placeholder='300' value={form.ticket_capacity} onChange={(e) => set('ticket_capacity', e.target.value)} className='w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF]' />
      </div>

      <div className='p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]'>
        <p className='text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2'>Preview</p>
        <p className='text-white font-bold'>{form.title || 'Untitled event'}</p>
        <p className='text-gray-400 text-sm'>{form.venue_name} · {form.neighborhood}</p>
        <p className='text-gray-500 text-xs mt-1'>{form.starts_at ? new Date(form.starts_at).toLocaleDateString() : 'No date'}</p>
        {form.genres.length > 0 && (
          <div className='flex gap-1 flex-wrap mt-2'>
            {form.genres.slice(0, 4).map((g: string) => (
              <span key={g} className='text-[10px] bg-[#7B2EFF]/30 text-[#A3FF12] px-2 py-0.5 rounded-full'>{g}</span>
            ))}
            {form.genres.length > 4 && <span className='text-[10px] text-gray-600'>+{form.genres.length - 4} more</span>}
          </div>
        )}
        <p className='text-[#A3FF12] font-bold text-sm mt-2'>
          {form.is_free ? 'Free' : form.price_min ? `From $${form.price_min}` : 'Price TBD'}
        </p>
      </div>

      {error && <p className='text-red-400 text-sm'>{error}</p>}

      <div className='flex gap-3'>
        <button onClick={onBack} disabled={loading} className='btn-secondary flex-1'>← Back</button>
        <button onClick={onSaveDraft} disabled={loading} className='btn-secondary flex-1 text-gray-400'>
          {loading ? '...' : 'Save Draft'}
        </button>
      </div>
      <button onClick={onPublish} disabled={loading} className='btn-primary'>
        {loading ? 'Publishing...' : 'Publish Event'}
      </button>

      <p className='text-gray-700 text-xs text-center'>0% platform fee · You keep 100% of revenue</p>
    </div>
  )
}
