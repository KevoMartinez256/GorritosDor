import { adminAccess } from '@/lib/admin'
import type { Category } from '@/lib/admin-types'
import type { ShowConfig, ShowMode, ShowPayload, ShowState } from '@/lib/show-types'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store' }
function reply(body: unknown, status = 200) { return Response.json(body, { status, headers }) }
function validUrl(value: unknown): value is string {
  if (value === '') return true
  if (typeof value !== 'string' || value.length > 4000) return false
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}

export async function GET() {
  const { supabase, allowed, status } = await adminAccess()
  if (!allowed) return reply({ error: 'Acceso no autorizado' }, status)
  const { data: edition } = await supabase.from('editions').select('id').eq('slug', '2026').single()
  if (!edition) return reply({ error: 'No se pudo cargar la edición' }, 503)
  const { data, error } = await supabase.from('awards_show').select('*').eq('edition_id', edition.id).single()
  return error ? reply({ error: 'No se pudo cargar la presentación' }, 503) : reply(data)
}

export async function POST(request: Request) {
  const { supabase, allowed, status } = await adminAccess()
  if (!allowed) return reply({ error: 'Acceso no autorizado' }, status)
  const body = await request.json().catch(() => null)
  if (!body || !Number.isInteger(body.revision)) return reply({ error: 'Solicitud inválida' }, 400)
  const { data: edition } = await supabase.from('editions').select('id,starts_at,ends_at').eq('slug', '2026').single()
  if (!edition) return reply({ error: 'No se pudo cargar la edición' }, 503)
  const { data: row } = await supabase.from('awards_show').select('*').eq('edition_id', edition.id).single()
  if (!row) return reply({ error: 'No se pudo cargar la presentación' }, 503)
  const state = row as ShowState
  if (state.revision !== body.revision) return reply({ error: 'Otro control cambió la presentación. Actualiza y vuelve a intentarlo.' }, 409)
  const revision = state.revision + 1
  let config = state.config
  let snapshot = state.snapshot
  let payload = { ...state.payload }
  let token = state.token
  if (body.action === 'config') {
    const candidate = body.config as ShowConfig
    if (!candidate || !validUrl(candidate.idle) || !candidate.videos || typeof candidate.videos !== 'object' || Array.isArray(candidate.videos) || Object.keys(candidate.videos).length > 100 || !Object.values(candidate.videos).every(validUrl)) return reply({ error: 'Usa enlaces HTTPS directos a archivos de video.' }, 400)
    config = { idle: candidate.idle, videos: candidate.videos }
    payload.idleUrl = config.idle
  } else if (body.action === 'rotate') {
    token = crypto.randomUUID()
  } else if (body.action === 'scene') {
    const mode = body.mode as ShowMode
    if (!['idle', 'category', 'video', 'results', 'winner'].includes(mode)) return reply({ error: 'Escena inválida' }, 400)
    payload = { mode, revision, idleUrl: config.idle, startedAt: new Date().toISOString() }
    if (mode !== 'idle') {
      if (typeof body.categoryId !== 'string') return reply({ error: 'Elige una categoría' }, 400)
      const { data: category } = await supabase.from('categories').select('id,name,position,nominees(id,display_name,avatar_url,ext)').eq('edition_id', edition.id).eq('id', body.categoryId).single()
      if (!category) return reply({ error: 'Categoría inválida' }, 400)
      const current = category as Category
      current.nominees.sort((a, b) => (a.ext?.position ?? 99) - (b.ext?.position ?? 99))
      payload.category = current
      if (mode === 'video') {
        if (!config.videos[current.id]) return reply({ error: 'Carga primero el video de esta categoría' }, 400)
        payload.videoUrl = config.videos[current.id]
      }
      if (mode === 'results' || mode === 'winner') {
        if (!snapshot || snapshot.categoryId !== current.id || body.newSnapshot === true) {
          const { data: counts, error } = await supabase.rpc('admin_vote_results', { p_edition: edition.id })
          if (error) return reply({ error: 'No se pudo obtener el corte de votos. La escena sigue igual.' }, 503)
          snapshot = { categoryId: current.id, results: {
            counts: Object.fromEntries(current.nominees.map(n => [n.id, Number((counts as { nominee_id: string; total: number }[]).find(r => r.nominee_id === n.id)?.total ?? 0)])),
            updatedAt: new Date().toISOString(), closed: Date.now() >= Date.parse(edition.ends_at), started: Date.now() >= Date.parse(edition.starts_at),
          } }
        }
        payload.results = snapshot.results
      } else if (snapshot?.categoryId !== current.id) snapshot = null
    }
  } else return reply({ error: 'Acción inválida' }, 400)
  // Config changes and link rotation must not restart an already playing video.
  if (body.action === 'scene') payload.revision = revision
  const { data: updated, error } = await supabase.from('awards_show').update({ config, snapshot, payload, token, revision, updated_at: new Date().toISOString() }).eq('edition_id', edition.id).eq('revision', body.revision).select('*').maybeSingle()
  if (error) return reply({ error: 'No se pudo guardar el cambio' }, 503)
  if (!updated) return reply({ error: 'Otro control cambió la presentación. Actualiza y vuelve a intentarlo.' }, 409)
  return reply(updated)
}
