'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/components/AuthProvider'

const HOST_TYPES = ['venue', 'promoter', 'brand', 'dj', 'collective'] as const

export default function HostSetupPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ name: '', slug: '', bio: '', host_type: '', instagram_handle: '', neighborhood: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

    const { error: insertErr } = await supabase.from('hosts').insert({
      user_id: user.id,
      name: form.name,
      slug,
      bio: form.bio || null,
      host_type: form.host_type || null,
      instagram_handle: form.instagram_handle || null,
      neighborhood: form.neighborhood || null,
      city: 'New York',
      is_verified: false,
      boost_credits: 0,
    })

    setLoading(false)
    if (insertErr) { setError(insertErr.message); return }
    router.push('/host')
  }

  return (
    <div className="min-h-screen bg-[#111111] pb-10">
      <div className="px-5 pt-14 pb-6">
        <Link href="/host" className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mb-6 active:scale-90 transition-transform">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <h1 className="text-white font-black text-2xl mb-1">Set up your host profile</h1>
        <p className="text-gray-500 text-sm mb-8">List events, keep 100% of revenue.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Name *" placeholder="e.g. Elsewhere Brooklyn" value={form.name} onChange={(v) => set('name', v)} />
          <Field label="Handle" placeholder="e.g. elsewhere-brooklyn" value={form.slug} onChange={(v) => set('slug', v)} />
          <Field label="Bio" placeholder="What kind of events do you throw?" value={form.bio} onChange={(v) => set('bio', v)} />
          <Field label="Instagram" placeholder="@handle (no @)" value={form.instagram_handle} onChange={(v) => set('instagram_handle', v)} />
          <Field label="Neighborhood" placeholder="Bushwick, Williamsburg, LES..." value={form.neighborhood} onChange={(v) => set('neighborhood', v)} />

          <div>
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Host Type</label>
            <div className="flex gap-2 flex-wrap">
              {HOST_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('host_type', t)}
                  className={`pill text-xs capitalize ${form.host_type === t ? 'pill-active' : 'pill-inactive'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading || !form.name} className="btn-primary disabled:opacity-40 mt-2">
            {loading ? 'Creating...' : 'Create Host Profile →'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors"
      />
    </div>
  )
}
