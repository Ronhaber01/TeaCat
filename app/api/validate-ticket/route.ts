import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
    try {
          const { ticketCode, eventId } = await req.json()
          if (!ticketCode || !eventId) {
                  return NextResponse.json({ error: 'Missing ticketCode or eventId' }, { status: 400 })
          }

      const normalizedCode = ticketCode.toLowerCase().trim()

      const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

      const { data: host } = await supabase.from('hosts').select('id').eq('user_id', user.id).single()
          if (!host) return NextResponse.json({ error: 'Not a host' }, { status: 403 })

      const { data: event } = await supabase.from('events').select('id').eq('id', eventId).eq('host_id', host.id).single()
          if (!event) return NextResponse.json({ error: 'Event not yours' }, { status: 403 })

      const { data: ticket } = await supabase.from('tickets').select('id, status').eq('ticket_code', normalizedCode).eq('event_id', eventId).single()

      if (!ticket) return NextResponse.json({ valid: false, reason: 'Ticket not found' })
          if (ticket.status === 'used') return NextResponse.json({ valid: false, reason: 'Already scanned' })
          if (ticket.status === 'cancelled') return NextResponse.json({ valid: false, reason: 'Ticket cancelled' })

      await supabase.from('tickets').update({ status: 'used', checked_in_at: new Date().toISOString() }).eq('id', ticket.id)
          return NextResponse.json({ valid: true, reason: 'Admitted!' })
    } catch (err) {
          console.error('Validate ticket error:', err)
          return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
    return createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
}

export async function POST(req: Request) {
    try {
          const { ticketCode, eventId } = await req.json()
          if (!ticketCode || !eventId) {
                  return NextResponse.json({ error: 'Missing ticketCode or eventId' }, { status: 400 })
          }

      // Normalize to lowercase — DB stores UUIDs lowercase, email shows uppercase
      const normalizedCode = ticketCode.toLowerCase().trim()

      const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

      const { data: host } = await supabase.from('hosts').select('id').eq('user_id', user.id).single()
          if (!host) return NextResponse.json({ error: 'Not a host' }, { status: 403 })

      const { data: event } = await supabase.from('events').select('id').eq('id', eventId).eq('host_id', host.id).single()
          if (!event) return NextResponse.json({ error: 'Event not yours' }, { status: 403 })

      const admin = getAdmin()
          const { data: ticket } = await admin.from('tickets').select('id, status').eq('ticket_code', normalizedCode).eq('event_id', eventId).single()

      if (!ticket) return NextResponse.json({ valid: false, reason: 'Ticket not found' })
          if (ticket.status === 'used') return NextResponse.json({ valid: false, reason: 'Already scanned' })
          if (ticket.status === 'cancelled') return NextResponse.json({ valid: false, reason: 'Ticket cancelled' })

      await admin.from('tickets').update({ status: 'used', checked_in_at: new Date().toISOString() }).eq('id', ticket.id)
          return NextResponse.json({ valid: true, reason: 'Admitted!' })
    } catch (err) {
          console.error('Validate ticket error:', err)
          return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
