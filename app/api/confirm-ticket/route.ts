import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { paymentIntentId, eventId } = await req.json()
    if (!paymentIntentId || !eventId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (pi.status !== 'succeeded') return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    if (pi.metadata.eventId !== eventId) return NextResponse.json({ error: 'Event mismatch' }, { status: 400 })
    const { data: existing } = await supabase.from('tickets').select('*').eq('stripe_payment_id', paymentIntentId).maybeSingle()
    if (existing) {
      return NextResponse.json({ ticket: existing })
    }
    const { data: ticket, error } = await supabase
      .from('tickets').insert({
        event_id: eventId, user_id: user.id, tier: pi.metadata.tier || 'general',
        price_paid: pi.amount, currency: pi.currency, stripe_payment_id: pi.id, status: 'active',
      }).select().single()
    if (error) { console.error('Ticket insert error:', error); return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 }) }
    await supabase.rpc('increment_tickets_sold', { event_id: eventId })
    return NextResponse.json({ ticket })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Confirm ticket error:', message)
    return NextResponse.json({ error: message, detail: message }, { status: 500 })
  }
}
