'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function SaveButton({ eventId, userId }: { eventId: string; userId?: string }) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!userId) {
      window.location.href = `/auth?redirect=/events/${eventId}`
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (saved) {
      await supabase.from('saved_events').delete().eq('event_id', eventId).eq('user_id', userId)
      setSaved(false)
    } else {
      await supabase.from('saved_events').insert({ event_id: eventId, user_id: userId })
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
    >
      <svg width="20" height="20" fill={saved ? '#A3FF12' : 'none'} viewBox="0 0 24 24" stroke={saved ? '#A3FF12' : '#fff'} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  )
}
