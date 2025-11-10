import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// Alias para que tu código antiguo siga importando desde aquí
export { supabaseBrowser as supabaseClient } from './supabase-browser';

export const createClientBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const createClientServer = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name) { return (await cookieStore).get(name)?.value },
      },
    }
  )
}
