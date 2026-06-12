import { supabase } from '@/lib/supabase'
import type { Event } from '@/lib/types'
import ExploreClient from './ExploreClient'

async function searchEvents(params: {
  q?: string
  category?: string
  vibe?: string
  situation?: string
}) {
  let query = supabase
    .from('events')
    .select('*, host:hosts(*)')
    .eq('is_published', true)
    .eq('is_cancelled', false)
    .gte('starts_at', new Date().toISOString())
    .order('boost_active', { ascending: false })
    .order('starts_at', { ascending: true })
    .limit(30)

  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,venue_name.ilike.%${params.q}%,neighborhood.ilike.%${params.q}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error searching events:', error)
    return []
  }
  return (data || []) as Event[]
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; vibe?: string; situation?: string }
}) {
  const events = await searchEvents(searchParams)
  return (
    <ExploreClient
      events={events}
      initialQ={searchParams.q || ''}
      activeCategory={searchParams.category || 'all'}
      activeVibe={searchParams.vibe || ''}
      activeSituation={searchParams.situation || ''}
    />
  )
}
