import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const { sessionId, paymentIntentId, eventId: bodyEventId } = await req.json()

    if (!sessionId && !paymentIntentId) {
      return NextResponse.json({ error: 'Missing sessionId or paymentIntentId' }, { status: 400 })
    }

    // Use auth client — relies on RLS INSERT policy (user_id = auth.uid())
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const paymentKey = paymentIntentId || sessionId

    // Check for existing ticket (idempotency)
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, ticket_code, event_id, status')
      .eq('payment_intent_id', paymentKey)
      .eq('user_id', user.id)
      .single()

    if (existingTicket) {
      return NextResponse.json({ success: true, ticket: existingTicket, alreadyExisted: true })
    }

    // Retrieve payment intent from Stripe to verify payment and get metadata
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const pi = await stripe.paymentIntents.retrieve(paymentKey)

    if (!pi || pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })
    }

    // Use eventId from PI metadata, fall back to body (client sends params.id)
    const eventId = pi.metadata?.eventId || bodyEventId
    const userId = pi.metadata?.userId || user.id
    const amountPaid = pi.amount_received / 100

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
    }

    // Fetch event details (readable via RLS: is_published=true AND is_cancelled=false)
    const { data: event } = await supabase
      .from('events')
      .select('id, title, date, venue, host_id')
      .eq('id', eventId)
      .single()

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Generate ticket code
    const ticketCode = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toLowerCase()

    // Insert ticket (RLS: user_id = auth.uid())
    const { data: ticket, error: insertError } = await supabase
      .from('tickets')
      .insert({
        user_id: userId,
        event_id: eventId,
        ticket_code: ticketCode,
        payment_intent_id: paymentKey,
        amount_paid: amountPaid,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Ticket insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create ticket', detail: insertError.message }, { status: 500 })
    }

    // Increment tickets_sold (SECURITY DEFINER fn)
    await supabase.rpc('increment_tickets_sold', { event_id: eventId })

    // Send confirmation email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticketCode}`
      const eventDate = event.date
        ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'TBD'

      await resend.emails.send({
        from: 'TeaCat <onboarding@resend.dev>',
        to: user.email!,
        subject: `Your ticket to ${event.title} 🎟️`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h1 style="font-size:24px;font-weight:bold;margin-bottom:8px;">You're going! 🎉</h1>
            <p style="font-size:16px;color:#555;margin-bottom:24px;">Here's your ticket for <strong>${event.title}</strong></p>
            <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;"><strong>📅 Date:</strong> ${eventDate}</p>
              <p style="margin:0 0 8px;"><strong>📍 Venue:</strong> ${event.venue || 'TBD'}</p>
              <p style="margin:0;"><strong>🎫 Code:</strong> <code style="background:#eee;padding:2px 6px;border-radius:4px;">${ticketCode}</code></p>
            </div>
            <div style="text-align:center;margin-bottom:24px;">
              <img src="${qrUrl}" alt="QR Code" style="width:200px;height:200px;border-radius:8px;" />
              <p style="font-size:12px;color:#999;margin-top:8px;">Show this QR code at the door</p>
            </div>
            <p style="font-size:14px;color:#999;">See you there! — TeaCat</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Resend email error:', emailErr)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ success: true, ticket })
  } catch (err: any) {
    console.error('confirm-ticket error:', err)
    return NextResponse.json({ error: 'Server error', detail: err.message }, { status: 500 })
  }
}
