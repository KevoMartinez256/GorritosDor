import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Image from 'next/image'
import VoteMenuClient from './VoteMenuClient'

export const dynamic = 'force-dynamic'

export default async function VoteMenu({
  params,
}: { params: Promise<{ edition: string }> }) {
  const { edition: slug } = await params
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },
      },
    }
  )

  const { data: editions } = await supabase
    .from('editions').select('id, slug, title').eq('slug', slug).limit(1)
  const edition = editions?.[0]
  if (!edition) return <div>Edición no encontrada.</div>

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, position, nominees:nominees(id)')
    .eq('edition_id', edition.id)
    .order('position', { ascending: true })

  return (
    <main className="space-y-8 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
      {/* Logo pequeño fijo arriba a la izquierda (50x50) */}
      <div className="fixed top-5 left-5 z-20">
        <Image src="/chaparritaspng.png" alt="Gorritos" width={50} height={50} className="w-[50px] h-[50px] object-contain" priority />
      </div>
      <header className="flex items-center justify-between">
        <Image src="/Logo.png" alt={edition.title} width={220} height={60} className="h-auto w-[160px] sm:w-[200px]" priority />
        {/* botón removido para evitar duplicado */}
      </header>

      <VoteMenuClient
        editionId={edition.id}
        slug={slug}
        categories={categories ?? []}
      />
    </main>
  )
}

