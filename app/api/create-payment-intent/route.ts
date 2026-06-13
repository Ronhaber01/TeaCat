import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // Lazy init — do NOT put this at module level or Next.js build will throw
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
  })

  try {
    const { eventId, tier = 'general' } = await req.json()

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch event from Supabase
    const { data: event, error } = await supabase
      .from('events')
      .select('id, title, price_min, price_max, is_free, ticket_capacity, tickets_sold, is_published, is_cancelled')
      .eq('id', eventId)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    if (!event.is_published || event.is_cancelled) {
      return NextResponse.json({ error: 'Event unavailable' }, { status: 400 })
    }
    if (event.ticket_capacity !== null && event.tickets_sold >= event.ticket_capacity) {
      return NextResponse.json({ error: 'Sold out' }, { status: 400 })
    }
    if (event.is_free || event.price_min === 0) {
      return NextResponse.json({ error: 'Use free ticket flow' }, { status: 400 })
    }

    // Amount in cents (price_min stored as cents)
    const amount = event.price_min

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
        tier,
        userId: user.id,
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('PaymentIntent error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
