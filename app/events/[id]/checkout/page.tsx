import { createClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/auth?redirect=/events/${params.id}/checkout`)
  }

  const { data: event } = await supabase
    .from('events')
    .select('*, host:hosts(*)')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  return (
    <CheckoutClient
      event={event as any}
      userId={user.id}
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    />
  )
}
