import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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
        getAll() { return request.cookies.getAll() },
        setAll(cookies) {
          console.log('[verify-otp] setAll called with', cookies.length, 'cookies:', cookies.map(c => c.name))
          cookies.forEach((c) => cookiesToSetLater.push(c))
        },
      },
    }
  )

  console.log('[verify-otp] calling verifyOtp for', email)
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  console.log('[verify-otp] verifyOtp result: error=', error?.message, 'hasUser=', !!data?.user, 'hasSession=', !!data?.session, 'cookiesToSetLater.length=', cookiesToSetLater.length)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Try calling setSession explicitly to force cookie write
  if (data.session && cookiesToSetLater.length === 0) {
    console.log('[verify-otp] setAll not called by verifyOtp, calling setSession explicitly')
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    console.log('[verify-otp] after setSession, cookiesToSetLater.length=', cookiesToSetLater.length)
  }

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

  if (cookiesToSetLater.length > 0) {
    console.log('[verify-otp] setting', cookiesToSetLater.length, 'cookies on response')
    cookiesToSetLater.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    })
    return response
  }

  // Final fallback: manually write session cookie
  const session = data.session
  if (session) {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
      .replace('https://', '').replace('.supabase.co', '')
    const cookieKey = `sb-${projectRef}-auth-token`
    const cookieValue = JSON.stringify(session)
    console.log('[verify-otp] FALLBACK: manually setting cookie', cookieKey, 'length=', cookieValue.length)
    const cookieOpts = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: session.expires_in ?? 3600 }
    if (cookieValue.length <= CHUNK_SIZE) {
      response.cookies.set(cookieKey, cookieValue, cookieOpts)
    } else {
      let chunk = 0
      for (let i = 0; i < cookieValue.length; i += CHUNK_SIZE) {
        response.cookies.set(`${cookieKey}.${chunk}`, cookieValue.slice(i, i + CHUNK_SIZE), cookieOpts)
        chunk++
      }
    }
  } else {
    console.log('[verify-otp] ERROR: no session in data after verifyOtp')
  }

  return response
}
