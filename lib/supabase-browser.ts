import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
    return createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          // Removed flowType: 'implicit' — caused implicit-flow cookies
          // that server-side createServerClient can't validate.
          // @supabase/ssr defaults to PKCE, which is correct.
        )
}
