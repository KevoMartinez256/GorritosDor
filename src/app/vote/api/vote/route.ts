// src/app/vote/api/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server' // usa tu helper del lado servidor

// Si usas runtime Edge, puedes habilitarlo. Si no, déjalo comentado.
// export const runtime = 'edge'

type Body = {
  categoryId?: string
  nomineeId?: string
}

export async function POST(req: NextRequest) {
  const supabase = createClientServer()

  // 1) Asegurar usuario autenticado y usar su UUID como voter_id
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // 2) Leer payload
  let body: Body = {}
  try {
    body = await req.json()
  } catch {
    /* sin body válido */
  }

  const categoryId = body.categoryId
  const nomineeId  = body.nomineeId

  if (!categoryId || !nomineeId) {
    return NextResponse.json({ error: 'Faltan campos: categoryId y nomineeId.' }, { status: 400 })
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

  // 4) Upsert para que el usuario solo tenga 1 voto por categoría
  //    Requiere índice único (recomendado):
  //    CREATE UNIQUE INDEX IF NOT EXISTS unique_vote_per_category ON public.votes (voter_id, category_id);
  const { error: upsertErr } = await supabase
    .from('votes')
    .upsert(
      {
        voter_id: user.id,      // <- MUY IMPORTANTE: UUID de auth.users
        category_id: categoryId,
        nominee_id: nomineeId,
      },
      { onConflict: 'voter_id,category_id' } // reemplaza su voto dentro de la misma categoría
    )

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

// (Opcional) GET para depurar: devuelve tus votos
export async function GET() {
  const supabase = createClientServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ votes: [] })

  const { data: votes, error } = await supabase
    .from('votes')
    .select('category_id, nominee_id')
    .eq('voter_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ votes })
}
