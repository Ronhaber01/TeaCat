import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// Use service role for webhook — bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const { eventId, tier } = pi.metadata

    if (!eventId) {
      console.error('Webhook: missing eventId in payment intent metadata')
      return NextResponse.json({ received: true })
    }

    // Idempotency check — confirm-ticket (called from success page) may have already created this ticket
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('stripe_payment_id', pi.id)
      .single()

    if (existing) {
      // Ticket already created by confirm-ticket route — nothing to do
      return NextResponse.json({ received: true })
    }

    // Ticket not yet created (e.g. user closed tab before success page loaded)
    const ticketCode = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toLowerCase()

    const { error } = await supabase.from('tickets').insert({
      event_id: eventId,
      user_id: pi.metadata.userId || null,
      ticket_code: ticketCode,
      tier: tier || 'general',
      price_paid: pi.amount_received,
      currency: pi.currency,
      stripe_payment_id: pi.id,
      status: 'active',
    })

    if (error) {
      console.error('Webhook ticket insert error:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Increment tickets_sold
    await supabase.rpc('increment_tickets_sold', { event_id: eventId })
  }

  return NextResponse.json({ received: true })
}
