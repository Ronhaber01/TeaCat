import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  // Lazy-init inside handler — env vars not available at build time
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
  })

  // Service role client — bypasses RLS entirely
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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

    if (!eventId) {
      console.error('Webhook: missing eventId in payment intent metadata')
      return NextResponse.json({ received: true })
    }

    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('stripe_payment_id', pi.id)
      .single()

    if (existing) {
      return NextResponse.json({ received: true })
    }

    const ticketCode = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toLowerCase()

    const { error: insertError } = await supabase.from('tickets').insert({
      event_id: eventId,
      user_id: userId || null,
      ticket_code: ticketCode,
      tier: tier || 'general',
      price_paid: pi.amount_received,
      currency: pi.currency,
      stripe_payment_id: pi.id,
      status: 'active',
    })

    if (insertError) {
      console.error('Webhook ticket insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    await supabase.rpc('increment_tickets_sold', { event_id: eventId })

    if (userId) {
      try {
        const { data: { user: ticketOwner } } = await supabase.auth.admin.getUserById(userId)
        const { data: eventData } = await supabase
          .from('events')
          .select('title, starts_at, venue_name')
          .eq('id', eventId)
          .single()

        if (ticketOwner?.email && eventData) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketCode}`
          const eventDate = eventData.starts_at
            ? new Date(eventData.starts_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'TBD'
          const amountDisplay = `$${(pi.amount_received / 100).toFixed(2)}`

          await resend.emails.send({
            from: 'TeaCat <onboarding@resend.dev>',
            to: ticketOwner.email,
            subject: `Your ticket to ${eventData.title}`,
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h1 style="color:#111">You're going! 🎉</h1><p>Ticket for <strong>${eventData.title}</strong></p><p><strong>Date:</strong> ${eventDate}</p><p><strong>Venue:</strong> ${eventData.venue_name || 'TBD'}</p><p><strong>Amount paid:</strong> ${amountDisplay}</p><p><strong>Code:</strong> <code style="font-size:18px;letter-spacing:2px">${ticketCode}</code></p><div style="margin:24px 0"><img src="${qrUrl}" alt="QR Code" width="200"/></div><p style="color:#666">Show this QR at the door. — TeaCat</p></div>`,
          })
        }
      } catch (emailErr) { console.error('Webhook email error:', emailErr) }
    }
  }

  return NextResponse.json({ received: true })
}import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  // Lazy-init inside handler — env vars not available at build time
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
  })

  // Service role client — bypasses RLS entirely
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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

    if (!eventId) {
      console.error('Webhook: missing eventId in payment intent metadata')
      return NextResponse.json({ received: true })
    }

    // Idempotency check — confirm-ticket may have already created this ticket
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('stripe_payment_id', pi.id)
      .single()

    if (existing) {
      return NextResponse.json({ received: true })
    }

    // Ticket not yet created (user closed tab before success page loaded)
    const ticketCode = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toLowerCase()

    const { error: insertError } = await supabase.from('tickets').insert({
      event_id: eventId,
      user_id: userId || null,
      ticket_code: ticketCode,
      tier: tier || 'general',
      price_paid: pi.amount_received,
      currency: pi.currency,
      stripe_payment_id: pi.id,
      status: 'active',
    })

    if (insertError) {
      console.error('Webhook ticket insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    await supabase.rpc('increment_tickets_sold', { event_id: eventId })

    // Send confirmation email — handles fallback path (user closed tab before success page)
    if (userId) {
      try {
        const { data: { user: ticketOwner } } = await supabase.auth.admin.getUserById(userId)
        const { data: eventData } = await supabase
          .from('events')
          .select('title, starts_at, venue_name')
          .eq('id', eventId)
          .single()

        if (ticketOwner?.email && eventData) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketCode}`
          const eventDate = eventData.starts_at
            ? new Date(eventData.starts_at).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })
            : 'TBD'
          const amountDisplay = `$${(pi.amount_received / 100).toFixed(2)}`

          await resend.emails.send({
            from: 'TeaCat <onboarding@resend.dev>',
            to: ticketOwner.email,
            subject: `Your ticket to ${eventData.title}`,
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
<h1 style="color:#111">You're going! 🎉</h1>
<p>Here's your ticket for <strong>${eventData.title}</strong></p>
<p><strong>Date:</strong> ${eventDate}</p>
<p><strong>Venue:</strong> ${eventData.venue_name || 'TBD'}</p>
<p><strong>Amount paid:</strong> ${amountDisplay}</p>
<p><strong>Code:</strong> <code style="font-size:18px;letter-spacing:2px">${ticketCode}</code></p>
<div style="margin:24px 0"><img src="${qrUrl}" alt="QR Code" width="200" /></div>
<p style="color:#666">Show this QR at the door. See you there! — TeaCat</p>
</div>`,
          })
        }
      } catch (emailErr) {
        console.error('Webhook email error:', emailErr)
      }
    }
  }

  return NextResponse.json({ received: true })
}import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // Lazy-init inside handler — env vars not available at build time
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
  })

  // Use service role for webhook — bypasses RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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

    // Idempotency check — confirm-ticket may have already created this ticket
    const { data: existing } = await supabase
      .from('tickets')
      .select('id')
      .eq('stripe_payment_id', pi.id)
      .single()

    if (existing) {
      return NextResponse.json({ received: true })
    }

    // Ticket not yet created (user closed tab before success page loaded)
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

    await supabase.rpc('increment_tickets_sold', { event_id: eventId })
  }

  return NextResponse.json({ received: true })
}
