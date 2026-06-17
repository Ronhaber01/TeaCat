import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Max cookie chunk size (3600 is under the 4096-byte browser limit)
const CHUNK_SIZE = 3600

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

  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Check whether onboarding is needed
  let destination = next
  const user = data.user
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

  // Primary path: @supabase/ssr called setAll during verifyOtp
  if (cookiesToSetLater.length > 0) {
    cookiesToSetLater.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    })
    return response
  }

  // Fallback: @supabase/ssr v0.3.x sometimes doesn't call setAll during verifyOtp.
  // Manually write the session into the expected cookie format so the middleware
  // (which uses createServerClient + getAll) can read it.
  const session = data.session
  if (session) {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
      .replace('https://', '')
      .replace('.supabase.co', '')
    const cookieKey = `sb-${projectRef}-auth-token`
    const cookieValue = JSON.stringify(session)
    const cookieOpts = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: session.expires_in ?? 3600,
    }

    if (cookieValue.length <= CHUNK_SIZE) {
      response.cookies.set(cookieKey, cookieValue, cookieOpts)
    } else {
      let chunk = 0
      for (let i = 0; i < cookieValue.length; i += CHUNK_SIZE) {
        response.cookies.set(
          `${cookieKey}.${chunk}`,
          cookieValue.slice(i, i + CHUNK_SIZE),
          cookieOpts
        )
        chunk++
      }
    }
  }

  return response
}
