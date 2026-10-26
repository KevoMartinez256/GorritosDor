import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function adminAccess() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        // Route handlers persist refreshed cookies during the live-results polling.
        // Server Components cannot write cookies; the next API call persists them.
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { /* Read-only render context. */ }
      },
    },
  })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, allowed: false, status: 401 }
  const { data, error: membershipError } = await supabase.from('awards_admins').select('user_id').eq('user_id', user.id).maybeSingle()
  return { supabase, allowed: !!data && !membershipError, status: membershipError ? 503 : data ? 200 : 403 }
}
