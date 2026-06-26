'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    phone: '',
    gender: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      setEmail(user.email || '')
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()
      if (profile?.full_name && profile?.phone) {
        router.push(redirect)
        return
      }
      if (profile?.full_name) setForm(f => ({ ...f, full_name: profile.full_name }))
      setCheckingAuth(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Please enter your full name'); return }
    if (!form.phone.trim()) { setError('Please enter your phone number'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: upsertErr } = await supabase.from('users').upsert({
      id: userId,
      email,
      username: email.split('@')[0],
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth || null,
      phone: form.phone.trim(),
      gender: form.gender || null,
      updated_at: new Date().toISOString(),
    })
    setLoading(false)
    if (upsertErr) { setError('Something went wrong. Please try again.'); return }
    router.push(redirect)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7B2EFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col px-5 pt-14 pb-10">
      <div className="mb-8">
        <div className="flex items-center gap-1 mb-4">
          <span className="text-[#7B2EFF] font-black text-3xl tracking-tight">Tea</span>
          <span className="text-[#A3FF12] font-black text-3xl tracking-tight">Cat</span>
        </div>
        <h1 className="text-white font-black text-2xl mb-1">Almost there</h1>
        <p className="text-gray-500 text-sm">Set up your profile in 30 seconds.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Full name</label>
          <input type="text" placeholder="Your name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} autoFocus className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-5 py-4 text-white text-base placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Date of birth</label>
          <input type="date" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-5 py-4 text-white text-base focus:outline-none focus:border-[#7B2EFF] transition-colors [color-scheme:dark]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Email</label>
          <input type="email" value={email} disabled className="w-full bg-[#111111] border border-[#2A2A2A] rounded-2xl px-5 py-4 text-gray-500 text-base cursor-not-allowed" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Phone number</label>
          <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-5 py-4 text-white text-base placeholder-gray-700 focus:outline-none focus:border-[#7B2EFF] transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Gender</label>
          <div className="flex gap-2 flex-wrap">
            {['Man', 'Woman', 'Non-binary', 'Prefer not to say'].map(g => (
              <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))} className={form.gender === g ? 'px-4 py-2 rounded-full text-sm font-semibold border bg-[#7B2EFF] border-[#7B2EFF] text-white' : 'px-4 py-2 rounded-full text-sm font-semibold border bg-[#1A1A1A] border-[#2A2A2A] text-gray-400'}>{g}</button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed mt-2">{loading ? 'Saving...' : "Let's go"}</button>
        <p className="text-gray-700 text-xs text-center">Your info is only used to personalise TeaCat and send you updates.</p>
      </form>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
      <OnboardingContent />
    </Suspense>
  )
}
