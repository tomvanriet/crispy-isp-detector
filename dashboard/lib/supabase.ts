import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  )
}
