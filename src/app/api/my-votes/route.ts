import { sessionServer } from '@/lib/session-server'
export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  const headers = { 'Cache-Control': 'private, no-store' }
  const supabase = await sessionServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Response.json({error:'Inicia sesión con Twitch para consultar tus votos.'},{status:401,headers})
  const edition = new URL(req.url).searchParams.get('edition')
  if (!edition || !/^[0-9a-f-]{36}$/i.test(edition)) return Response.json({error:'Edición inválida.'},{status:400,headers})
  // Explicit user filter also applies to admins: this endpoint never returns other voters.
  const { data, error } = await supabase.from('votes').select('category_id,nominee_id').eq('edition_id',edition).eq('voter_id',user.id)
  if (error) return Response.json({error:'No pudimos comprobar tus votos. Intenta de nuevo.'},{status:503,headers})
  return Response.json({choices:Object.fromEntries(data.map(v=>[v.category_id,v.nominee_id]))},{headers})
}
