import { adminAccess } from '@/lib/admin'
export async function POST(request: Request) {
  const { supabase, allowed, status } = await adminAccess()
  const headers = { 'Cache-Control': 'private, no-store' }
  if (!allowed) return Response.json({ error: 'Acceso no autorizado' }, { status, headers })
  const body = await request.json().catch(() => null)
  if (!body || !['video/mp4', 'video/webm'].includes(body.type) || !Number.isInteger(body.size) || body.size <= 0 || body.size > 52428800) return Response.json({ error: 'Sube un MP4 o WebM de hasta 50 MB. Para videos mayores, usa un enlace HTTPS directo.' }, { status: 400, headers })
  const path = `2026/${crypto.randomUUID()}.${body.type === 'video/mp4' ? 'mp4' : 'webm'}`
  const { data, error } = await supabase.storage.from('awards-media').createSignedUploadUrl(path)
  if (error) return Response.json({ error: 'No se pudo preparar la carga' }, { status: 503, headers })
  const { data: publicUrl } = supabase.storage.from('awards-media').getPublicUrl(path)
  return Response.json({ path, token: data.token, url: publicUrl.publicUrl }, { headers })
}
