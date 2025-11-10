// Server helper para Next.js App Router
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClientServer() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options?: CookieOptions) {
        // Next 14/15: set a través de cookieStore
        cookieStore.set(name, value, options as any)
      },
      remove(name: string, options?: CookieOptions) {
        cookieStore.set(name, '', { ...(options as any), maxAge: 0 })
      },
    },
  })
}

export type SupabaseServerClient = ReturnType<typeof createClientServer>
