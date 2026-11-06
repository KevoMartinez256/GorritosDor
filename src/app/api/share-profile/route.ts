import { sessionServer } from '@/lib/session-server'

export const dynamic = 'force-dynamic'
export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' }
  const supabase = await sessionServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Inicia sesión para generar tu imagen personalizada.' }, { status: 401, headers })
  const meta = user.user_metadata
  const name = [meta.full_name, meta.name, meta.preferred_username].find(value => typeof value === 'string' && value.trim()) ?? 'Usuario de Twitch'
  const avatar = meta.avatar_url || meta.picture
  return Response.json({ name, avatar: typeof avatar === 'string' && avatar ? '/api/share-portrait/self' : null }, { headers })
}
