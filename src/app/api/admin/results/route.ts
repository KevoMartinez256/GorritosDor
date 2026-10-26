import { adminAccess } from '@/lib/admin'
export const dynamic = 'force-dynamic'
export async function GET() {
  const { supabase, allowed, status } = await adminAccess()
  const headers = { 'Cache-Control': 'private, no-store' }
  if (!allowed) return Response.json({ error: 'Acceso no autorizado' }, { status, headers })
  const { data: edition, error: editionError } = await supabase.from('editions').select('id,starts_at,ends_at').eq('slug', '2026').single()
  if (editionError) return Response.json({ error: 'No se pudo cargar la edición' }, { status: 503, headers })
  const { data, error } = await supabase.rpc('admin_vote_results', { p_edition: edition.id })
  if (error) return Response.json({ error: 'No se pudieron actualizar los resultados' }, { status: 503, headers })
  const counts = Object.fromEntries((data as { nominee_id: string; total: number }[]).map(r => [r.nominee_id, Number(r.total)]))
  const now = Date.now()
  return Response.json({ counts, updatedAt: new Date(now).toISOString(), closed: now >= Date.parse(edition.ends_at), started: now >= Date.parse(edition.starts_at) }, { headers })
}
