import { sessionServer } from '@/lib/session-server'
export const dynamic = 'force-dynamic'
const hosts = new Set(['static-cdn.jtvnw.net','yt3.googleusercontent.com','files.kick.com','i.imgur.com'])
export async function GET(_req: Request, {params}: {params: Promise<{id:string}>}) {
  const headers = {'Cache-Control':'private, no-store'}
  const supabase = await sessionServer()
  const {data:{user},error} = await supabase.auth.getUser()
  if(error || !user) return new Response('Inicia sesión',{status:401,headers})
  const {id} = await params
  const {data} = await supabase.from('nominees').select('avatar_url').eq('id',id).maybeSingle()
  if(!data?.avatar_url) return new Response('Sin imagen',{status:404,headers})
  try {
    const url = new URL(data.avatar_url)
    if(url.protocol!=='https:' || !hosts.has(url.hostname) || url.port || url.username || url.password) return new Response('Imagen no permitida',{status:400,headers})
    const res = await fetch(url,{redirect:'error',signal:AbortSignal.timeout(10000),cache:'no-store'})
    const mime=res.headers.get('content-type')?.split(';')[0]??''
    if(!res.ok || !['image/jpeg','image/png','image/webp','image/gif'].includes(mime)) throw new Error('Invalid image')
    const bytes=await res.arrayBuffer()
    if(bytes.byteLength>8*1024*1024) throw new Error('Image too large')
    return new Response(bytes,{headers:{...headers,'Content-Type':mime,'X-Content-Type-Options':'nosniff'}})
  } catch { return new Response('Imagen no disponible',{status:502,headers}) }
}
