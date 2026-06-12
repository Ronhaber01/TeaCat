import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendTicketEmail } from '@/lib/send-ticket-email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// Service role — bypasses RLS
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
    const { eventId, tier, userId } = pi.metadata

    // Insert ticket and get the ticket_code back
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .insert({
        event_id: eventId,
        user_id: userId || null,
        tier: tier || 'general',
        price_paid: pi.amount,
        currency: pi.currency,
        stripe_payment_id: pi.id,
        status: 'active',
      })
      .select('id, ticket_code')
      .single()

    if (ticketErr) {
      console.error('Ticket insert error:', ticketErr)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Increment tickets_sold
    await supabase.rpc('increment_tickets_sold', { event_id: eventId })

    // Send confirmation email
    if (userId && ticket?.ticket_code) {
      try {
        // Get user email
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
        // Get event details
        const { data: ev } = await supabase
          .from('events')
          .select('title, starts_at, venue_name, neighborhood, flyer_url')
          .eq('id', eventId)
          .single()

        if (authUser?.email && ev) {
          await sendTicketEmail({
            to: authUser.email,
            eventTitle: ev.title,
            startsAt: ev.starts_at,
            venueName: ev.venue_name,
            neighborhood: ev.neighborhood,
            ticketCode: ticket.ticket_code,
            tier: tier || 'general',
            pricePaid: pi.amount,
            flyerUrl: ev.flyer_url,
          })
        }
      } catch (emailErr) {
        // Don't fail the webhook if email fails — ticket is already created
        console.error('Email send error:', emailErr)
      }
    }
  }

  return NextResponse.json({ received: true })
}
