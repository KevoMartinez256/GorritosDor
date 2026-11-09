import { adminData } from '@/lib/admin-data'
import { invitationPeople } from '@/lib/invitation-people'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store' }

export async function GET(request: Request) {
  const data = await adminData()
  if (!data) return new Response('Acceso restringido', { status: 403, headers })
  const person = invitationPeople(data.categories).find(item => item.nominee.id === new URL(request.url).searchParams.get('id'))
  if (!person?.profileUrl) return new Response('Sin perfil', { status: 404, headers })
  try {
    const profile = new URL(person.profileUrl)
    const host = profile.hostname.replace(/^www\./, '')
    const login = profile.pathname.split('/').filter(Boolean)[0]
    let avatar = ''
    if (host === 'twitch.tv' && /^[a-zA-Z0-9_]+$/.test(login)) {
      const response = await fetch(`https://decapi.me/twitch/avatar/${login}`, { signal: AbortSignal.timeout(10000), next: { revalidate: 3600 } })
      if (!response.ok) throw Error('Profile unavailable')
      avatar = (await response.text()).trim()
    } else if (host === 'instagram.com' && /^[a-zA-Z0-9_.]+$/.test(login)) {
      const response = await fetch(`https://www.instagram.com/${login}/`, { redirect: 'error', signal: AbortSignal.timeout(10000), next: { revalidate: 3600 } })
      if (!response.ok) throw Error('Profile unavailable')
      const html = await response.text()
      const tag = html.match(/<meta\b[^>]*(?:property|name)=["']og:image["'][^>]*>/i)?.[0]
      avatar = tag?.match(/content=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, '&') || ''
    }
    const imageUrl = new URL(avatar)
    const allowed = imageUrl.hostname === 'static-cdn.jtvnw.net' || imageUrl.hostname.endsWith('.cdninstagram.com') || imageUrl.hostname.endsWith('.fbcdn.net')
    if (imageUrl.protocol !== 'https:' || !allowed || imageUrl.port || imageUrl.username || imageUrl.password) throw Error('Invalid image')
    const response = await fetch(imageUrl, { redirect: 'error', signal: AbortSignal.timeout(10000) })
    const mime = response.headers.get('content-type')?.split(';')[0] || ''
    if (!response.ok || !['image/jpeg','image/png','image/webp'].includes(mime)) throw Error('Invalid image')
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > 8 * 1024 * 1024) throw Error('Image too large')
    return new Response(bytes, { headers: { ...headers, 'Content-Type': mime, 'X-Content-Type-Options': 'nosniff' } })
  } catch {
    return new Response('La red social no permitió obtener la foto', { status: 502, headers })
  }
}
