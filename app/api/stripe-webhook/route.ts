import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
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
    if (!eventId) return NextResponse.json({ received: true })
    const { data: existing } = await supabase.from('tickets').select('id').eq('stripe_payment_id', pi.id).single()
    if (existing) return NextResponse.json({ received: true })
    const ticketCode = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toLowerCase()
    const { error: insertError } = await supabase.from('tickets').insert({
      event_id: eventId, user_id: userId || null, ticket_code: ticketCode,
      tier: tier || 'general', price_paid: pi.amount_received, currency: pi.currency,
      stripe_payment_id: pi.id, status: 'active',
    })
    if (insertError) {
      console.error('Webhook ticket insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }
    await supabase.rpc('increment_tickets_sold', { event_id: eventId })
    if (userId) {
      try {
        const { data: { user: owner } } = await supabase.auth.admin.getUserById(userId)
        const { data: ev } = await supabase.from('events').select('title, starts_at, venue_name').eq('id', eventId).single()
        if (owner?.email && ev) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketCode}`
          const eventDate = ev.starts_at ? new Date(ev.starts_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'
          await resend.emails.send({
            from: 'TeaCat <onboarding@resend.dev>', to: owner.email,
            subject: `Your ticket to ${ev.title}`,
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h1>You're going! 🎉</h1><p>Ticket: <strong>${ev.title}</strong></p><p><strong>Date:</strong> ${eventDate}</p><p><strong>Venue:</strong> ${ev.venue_name || 'TBD'}</p><p><strong>Amount:</strong> $${(pi.amount_received/100).toFixed(2)}</p><p><strong>Code:</strong> <code style="font-size:18px">${ticketCode}</code></p><div><img src="${qrUrl}" width="200"/></div><p>Show this QR at the door. — TeaCat</p></div>`,
          })
        }
      } catch(e) { console.error('email err:', e) }
    }
  }
  return NextResponse.json({ received: true })
}
