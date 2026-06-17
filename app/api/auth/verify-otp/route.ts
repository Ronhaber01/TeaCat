import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, token, redirect: redirectParam } = await request.json()
  const next = redirectParam || '/'

  const cookiesToSetLater: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach((c) => cookiesToSetLater.push(c))
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  let destination = next
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
    if (!profile?.full_name || !profile?.phone) {
      destination = `/onboarding?redirect=${encodeURIComponent(next)}`
    }
  }

  const response = NextResponse.json({ success: true, redirect: destination })
  cookiesToSetLater.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
