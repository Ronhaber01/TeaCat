import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { paymentIntentId, eventId } = await req.json()

    if (!paymentIntentId || !eventId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    // Verify current user is authenticated
    const supabaseServer = createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // Verify payment succeeded with Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    if (pi.metadata.eventId !== eventId) {
      return NextResponse.json({ error: 'Event mismatch' }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Idempotent: return existing ticket if already created for this payment
    const { data: existing } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('stripe_payment_id', paymentIntentId)
      .maybeSingle()

    if (existing) {
      // Fix missing user_id if webhook created ticket before user was known
      if (!existing.user_id) {
        await supabaseAdmin
          .from('tickets')
          .update({ user_id: user.id })
          .eq('id', existing.id)
        existing.user_id = user.id
      }
      return NextResponse.json({ ticket: existing })
    }

    // Create the ticket
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

    // Increment tickets_sold
    await supabaseAdmin.rpc('increment_tickets_sold', { event_id: eventId })

    return NextResponse.json({ ticket })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Confirm ticket error:', message)
    return NextResponse.json({ error: 'Server error', detail: message }, { status: 500 })
  }
}
