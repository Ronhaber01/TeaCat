import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/types'
import type { Event } from '@/lib/types'
import HomeClient from './HomeClient'

async function getEvents(category?: string) {
  let query = supabase
    .from('events')
    .select('*, host:hosts(*)')
    .eq('is_published', true)
    .eq('is_cancelled', false)
    .gte('starts_at', new Date().toISOString())
    .order('boost_active', { ascending: false })
    .order('starts_at', { ascending: true })
    .limit(20)

  if (category && category !== 'all') {
    const GENRES = ['house','techno','drum-and-bass','hip-hop','afrobeats','latin','r&b','disco','pop','other']
    if (GENRES.includes(category)) {
      query = query.eq('genre', category)
    } else {
      query = query.eq('category', category)
    }
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  return (data || []) as Event[]
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const category = searchParams.category || 'all'
  const events = await getEvents(category)
  const featured = events.filter((e) => e.boost_active).slice(0, 5)
  const upcoming = events.slice(0, 10)

  return <HomeClient events={events} featured={featured} upcoming={upcoming} activeCategory={category} />
}
