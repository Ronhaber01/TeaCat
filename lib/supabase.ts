import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Lazy singleton — avoids build-time crash when env vars aren't present
let _supabase: SupabaseClient<Database> | null = null

function getSupabase(): SupabaseClient<Database> {
    if (!_supabase) {
          _supabase = createClient<Database>(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                )
    }
    return _supabase
}

// Proxy so all existing `supabase.from(...)` calls work without changes
export const supabase = new Proxy({} as SupabaseClient<Database>, {
    get(_target, prop) {
          return (getSupabase() as any)[prop]
    },
})
