import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
  const token = request.headers.get('X-Show-Token') ?? ''
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return Response.json({ error: 'Enlace inválido' }, { status: 403, headers })
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await db.rpc('read_awards_show', { p_token: token })
  if (error) return Response.json({ error: 'Conexión interrumpida' }, { status: 503, headers })
  if (!data) return Response.json({ error: 'Enlace revocado' }, { status: 403, headers })
  return Response.json({ ...data, serverTime: new Date().toISOString() }, { headers })
}
