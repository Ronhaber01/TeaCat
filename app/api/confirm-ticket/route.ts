import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const { sessionId, paymentIntentId, eventId: bodyEventId } = await req.json()

    if (!sessionId && !paymentIntentId) {
      return NextResponse.json({ error: 'Missing sessionId or paymentIntentId' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const paymentKey = paymentIntentId || sessionId

    // Idempotency check — use stripe_payment_id (actual column name)
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, ticket_code, event_id, status')
      .eq('stripe_payment_id', paymentKey)
      .eq('user_id', user.id)
      .single()

    if (existingTicket) {
      return NextResponse.json({ success: true, ticket: existingTicket, alreadyExisted: true })
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const pi = await stripe.paymentIntents.retrieve(paymentKey)

    if (!pi || pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })
    }

    const eventId = bodyEventId || pi.metadata?.eventId
    const userId = pi.metadata?.userId || user.id

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, starts_at, venue_name, host_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('Event lookup error:', eventError)
      return NextResponse.json({ error: 'Event not found', detail: eventError?.message }, { status: 404 })
    }

    const ticketCode = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toLowerCase()

    // Use correct column names: stripe_payment_id and price_paid (integer cents)
    const { data: ticket, error: insertError } = await supabase
      .from('tickets')
      .insert({
        user_id: userId,
        event_id: eventId,
        ticket_code: ticketCode,
        stripe_payment_id: paymentKey,
        price_paid: pi.amount_received,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Ticket insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create ticket', detail: insertError.message }, { status: 500 })
    }

    await supabase.rpc('increment_tickets_sold', { event_id: eventId })

    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketCode}`
      const eventDate = event.starts_at
        ? new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'TBD'
      const amountDisplay = `$${(pi.amount_received / 100).toFixed(2)}`

      await resend.emails.send({
        from: 'TeaCat <onboarding@resend.dev>',
        to: user.email!,
        subject: `Your ticket to ${event.title}`,
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h1 style="color:#111">You're going! 🎉</h1>
          <p>Here's your ticket for <strong>${event.title}</strong></p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Venue:</strong> ${event.venue_name || 'TBD'}</p>
          <p><strong>Amount paid:</strong> ${amountDisplay}</p>
          <p><strong>Code:</strong> <code style="font-size:18px;letter-spacing:2px">${ticketCode}</code></p>
          <div style="margin:24px 0"><img src="${qrUrl}" alt="QR Code" width="200" /></div>
          <p style="color:#666">Show this QR at the door. See you there! — TeaCat</p>
        </div>`,
      })
    } catch (emailErr) {
      console.error('Resend email error:', emailErr)
    }

    return NextResponse.json({ success: true, ticket })
  } catch (err: any) {
    console.error('confirm-ticket error:', err)
    return NextResponse.json({ error: 'Server error', detail: err.message }, { status: 500 })
  }
}
