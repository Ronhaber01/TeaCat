import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json()
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: event } = await supabase
      .from('events')
      .select('id, is_free, price_min, ticket_capacity, tickets_sold, is_published, is_cancelled')
      .eq('id', eventId)
      .single()

    if (!event || !event.is_published || event.is_cancelled) {
      return NextResponse.json({ error: 'Event unavailable' }, { status: 400 })
    }
    if (!event.is_free && event.price_min > 0) {
      return NextResponse.json({ error: 'Event is not free' }, { status: 400 })
    }
    if (event.ticket_capacity !== null && event.tickets_sold >= event.ticket_capacity) {
      return NextResponse.json({ error: 'Sold out' }, { status: 400 })
    }

    // Check if user already has a ticket
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already have a ticket' }, { status: 400 })
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        event_id: eventId,
        user_id: user.id,
        tier: 'general',
        price_paid: 0,
        currency: 'usd',
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    return NextResponse.json({ ticket })
  } catch (err) {
    console.error('Free ticket error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
