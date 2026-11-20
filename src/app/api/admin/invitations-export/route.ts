import { adminData } from '@/lib/admin-data'
import { invitationWorkbook } from '@/lib/invitation-workbook'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    const data = await adminData()
    if (!data) return Response.json({ error: 'Acceso restringido' }, { status: 403, headers })
    const buffer = await invitationWorkbook(data.categories, data.edition.slug)
    return new Response(new Uint8Array(buffer), {
      headers: {
        ...headers,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="invitaciones-gorritos-2026.xlsx"',
      },
    })
  } catch {
    return Response.json({ error: 'No se pudo generar el Excel. Intenta de nuevo.' }, { status: 503, headers })
  }
}
