import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'

type Body = {
  categoryId?: string
  nomineeId?: string
}

export async function POST(req: NextRequest) {
  const supabase = createClientServer()

  // 1) Usuario
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // 2) Body
  const { categoryId, nomineeId } = (await req.json()) as Body
  if (!categoryId || !nomineeId) {
    return NextResponse.json({ error: 'Faltan categoryId y nomineeId.' }, { status: 400 })
  }

  // 3) Validar que el nominado pertenece a esa categoría
  const { data: nominee, error: nomineeErr } = await supabase
    .from('nominees')
    .select('id, category_id')
    .eq('id', nomineeId)
    .single()

  if (nomineeErr || !nominee || nominee.category_id !== categoryId) {
    return NextResponse.json({ error: 'Nominado/Categoría no válidos.' }, { status: 400 })
  }

  // 4) Obtener edition_id desde la categoría
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .select('id, edition_id')
    .eq('id', categoryId)
    .single()

  if (catErr || !category) {
    return NextResponse.json({ error: 'Categoría no encontrada.' }, { status: 400 })
  }

  const editionId = category.edition_id
  if (!editionId) {
    return NextResponse.json({ error: 'La categoría no tiene edition_id.' }, { status: 400 })
  }

  // 5) Upsert con edition_id (1 voto por categoría y edición)
  const { error: upsertErr } = await supabase
    .from('votes')
    .upsert(
      {
        voter_id: user.id,
        edition_id: editionId,   // <— importante
        category_id: categoryId,
        nominee_id: nomineeId,
      },
      { onConflict: 'voter_id,edition_id,category_id' } // <- ver índice único
    )

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
