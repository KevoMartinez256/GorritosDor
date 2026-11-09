import { adminAccess } from '@/lib/admin'
export const dynamic = 'force-dynamic'
const headers = {'Cache-Control':'private, no-store'}
export async function GET(req:Request) {
  const {supabase,allowed,status}=await adminAccess()
  if(!allowed)return Response.json({error:'Acceso restringido'},{status,headers})
  const params=new URL(req.url).searchParams
  const username=(params.get('username')||'').trim().replace(/^@/,'')
  if(!/^[a-zA-Z0-9_]{1,25}$/.test(username))return Response.json({error:'Escribe el usuario de Twitch, sin el enlace.'},{status:400,headers})
  const {data,error}=await supabase.rpc('admin_voter_poster',{p_username:username})
  if(error)return Response.json({error:'No se pudieron consultar los votos.'},{status:503,headers})
  if(!data)return Response.json({error:'No se encontraron votos guardados de esta cuenta en 2026.'},{status:404,headers})
  if(params.get('avatar')==='1') {
    try {
      const url=new URL(data.profile.avatar)
      if(url.protocol!=='https:'||url.hostname!=='static-cdn.jtvnw.net'||url.port||url.username||url.password)throw Error('Invalid avatar')
      const res=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(10000),cache:'no-store'})
      const mime=res.headers.get('content-type')?.split(';')[0]||''
      if(!res.ok||!['image/png','image/jpeg','image/webp','image/gif'].includes(mime))throw Error('Invalid image')
      const bytes=await res.arrayBuffer()
      if(bytes.byteLength>8*1024*1024)throw Error('Image too large')
      return new Response(bytes,{headers:{...headers,'Content-Type':mime,'X-Content-Type-Options':'nosniff'}})
    } catch {return new Response('Imagen no disponible',{status:502,headers})}
  }
  return Response.json({...data,profile:{name:data.profile.name,avatar:data.profile.avatar?`/api/admin/voter-poster?username=${encodeURIComponent(username)}&avatar=1`:null}},{headers})
}
