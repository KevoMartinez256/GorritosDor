import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createClientServer()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { editionId, categoryId, nomineeId } = await req.json()
  const { error } = await (await supabase).rpc('cast_vote', {
    p_edition: editionId, p_category: categoryId, p_nominee: nomineeId
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
