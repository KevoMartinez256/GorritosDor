import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function sessionServer() {
  const store = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) { try { values.forEach(({name,value,options}) => store.set(name,value,options)) } catch { /* Server component render. */ } },
    },
  })
}
