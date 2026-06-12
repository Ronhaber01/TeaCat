'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function PublishToggle({ eventId, isPublished }: { eventId: string; isPublished: boolean }) {
  const [published, setPublished] = useState(isPublished)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('events')
      .update({ is_published: !published })
      .eq('id', eventId)
    if (!error) {
      setPublished(!published)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-12 h-6 rounded-full transition-all disabled:opacity-50 ${published ? 'bg-[#A3FF12]' : 'bg-[#2A2A2A]'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white transition-all mx-0.5 ${published ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}
