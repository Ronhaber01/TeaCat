import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ticketCode } = body
    // eventId kept for backward compat with /host/scan/[eventId] but not used in query

    if (!ticketCode) {
      return NextResponse.json({ error: 'Missing ticketCode' }, { status: 400 })
    }

    const normalizedCode = ticketCode.replace('teacat://ticket/', '').toLowerCase().trim()

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: host } = await supabase
      .from('hosts')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!host) return NextResponse.json({ error: 'Not a host' }, { status: 403 })

    // Look up ticket + join event for title and host verification
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, status, tier, event:events(id, title, host_id)')
      .eq('ticket_code', normalizedCode)
      .single()

    if (!ticket) return NextResponse.json({ valid: false, reason: 'Ticket not found' })

    const event = ticket.event as { id: string; title: string; host_id: string } | null
    if (!event || event.host_id !== host.id) {
      return NextResponse.json({ error: 'Not your event' }, { status: 403 })
    }

    if (ticket.status === 'used') return NextResponse.json({ valid: false, reason: 'Already scanned' })
    if (ticket.status === 'cancelled') return NextResponse.json({ valid: false, reason: 'Ticket cancelled' })

    await supabase
      .from('tickets')
      .update({ status: 'used', checked_in_at: new Date().toISOString() })
      .eq('id', ticket.id)

    return NextResponse.json({
      valid: true,
      reason: 'Admitted!',
      eventName: event.title,
      tier: ticket.tier ?? 'general',
    })
  } catch (err) {
    console.error('Validate ticket error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
