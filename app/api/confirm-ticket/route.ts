import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const { paymentIntentId, eventId } = await req.json()
    if (!paymentIntentId || !eventId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const supabaseServer = createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }
    if (pi.metadata.eventId !== eventId) {
      return NextResponse.json({ error: 'Event mismatch' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existing } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('stripe_payment_id', paymentIntentId)
      .maybeSingle()

    if (existing) {
      if (!existing.user_id) {
        await supabaseAdmin.from('tickets').update({ user_id: user.id }).eq('id', existing.id)
        existing.user_id = user.id
      }
      return NextResponse.json({ ticket: existing })
    }

    const { data: eventData } = await supabaseAdmin
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single()

    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        event_id: eventId,
        user_id: user.id,
        tier: pi.metadata.tier || 'general',
        price_paid: pi.amount,
        currency: pi.currency,
        stripe_payment_id: pi.id,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Ticket insert error:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    await supabaseAdmin.rpc('increment_tickets_sold', { event_id: eventId })

    // Send confirmation email with QR code
    if (process.env.RESEND_API_KEY && user.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticket.ticket_code}`
        const eventTitle = eventData?.title || 'Your Event'
        await resend.emails.send({
          from: 'TeaCat <onboarding@resend.dev>',
          to: user.email,
          subject: `Your ticket to ${eventTitle} 🎟️`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
              <h1 style="color:#1a1a1a;margin-bottom:8px;">You're in! 🎉</h1>
              <p style="color:#444;">Here's your ticket to <strong>${eventTitle}</strong>. Show the QR code at the door.</p>
              <div style="background:#f9f9f9;border-radius:12px;padding:32px;text-align:center;margin:24px 0;">
                <img src="${qrUrl}" alt="Ticket QR Code" width="200" height="200" style="border-radius:8px;" />
                <p style="font-family:monospace;font-size:13px;color:#888;margin-top:12px;word-break:break-all;">${ticket.ticket_code}</p>
              </div>
              <p style="color:#999;font-size:13px;">TeaCat — NYC Nightlife</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Email send error:', emailErr)
      }
    }

    return NextResponse.json({ ticket })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Confirm ticket error:', message)
    return NextResponse.json({ error: 'Server error', detail: message }, { status: 500 })
  }
                                                                    }
