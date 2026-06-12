'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase-browser'

const NEIGHBORHOODS = ['Bushwick', 'Williamsburg', 'LES', 'East Village', 'Brooklyn', 'Manhattan', 'Queens', 'Bronx', 'Other']

export default function ProfileEditPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({ full_name: '', username: '', bio: '', neighborhood: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth?redirect=/profile/edit')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) {
        setForm({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          neighborhood: data.neighborhood || '',
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')

    const { error: updateErr } = await supabase
      .from('users')
      .update({
        full_name: form.full_name || null,
        username: form.username || null,
        bio: form.bio || null,
        neighborhood: form.neighborhood || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setSaving(false)
    if (updateErr) { setError(updateErr.message); return }

    setSaved(true)
    setTimeout(() => { setSaved(false); router.push('/profile') }, 1200)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#111111] pb-10">
      <div className="px-5 pt-14 pb-6 flex items-center gap-4">
        <Link href="/profile" className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center active:scale-90 transition-transform">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-white font-black text-xl">Edit Profile</h1>
          <p className="text-gray-600 text-xs">How you appear to others</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-5 flex flex-col gap-5">
        <Field label="Full Name" placeholder="e.g. Alex Rivera" value={form.full_name} onChange={v => set('full_name', v)} />
        <Field
          label="Username"
          placeholder="e.g. alexnyc"
          value={form.username}
          onChange={v => set('username', v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        />
        <div>
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Bio</label>
          <textarea
            placeholder="What's your vibe?"
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            rows={3}
            maxLength={160}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors resize-none text-sm"
          />
          <p className="text-gray-700 text-xs text-right mt-1">{form.bio.length}/160</p>
        </div>
        <div>
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Neighborhood</label>
          <div className="flex gap-2 flex-wrap">
            {NEIGHBORHOODS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => set('neighborhood', n === form.neighborhood ? '' : n)}
                className={`pill text-xs ${form.neighborhood === n ? 'pill-active' : 'pill-inactive'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || saved}
          className={`btn-primary disabled:opacity-50 transition-all ${saved ? 'bg-[#A3FF12] text-black' : ''}`}
        >
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
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
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3.5 text-white placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors text-sm"
      />
    </div>
  )
}
