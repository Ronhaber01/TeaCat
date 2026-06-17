import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          } catch {
            // Server Component -- ignore cookie writes
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 } as Parameters<typeof cookieStore.set>[2])
          } catch {
            // Server Component -- ignore cookie writes
          }
        },
      },
    }
  )
}
