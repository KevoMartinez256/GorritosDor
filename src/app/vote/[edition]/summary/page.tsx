import { createClientServer } from '@/lib/supabaseClient'
import SummaryClient from './summary-client'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function SummaryPage({
  params,
}: { params: Promise<{ edition: string }> }) {
  const { edition: slug } = await params
  const supabase = await createClientServer()

  const { data: editions } = await supabase
    .from('editions').select('id, slug, title').eq('slug', slug).limit(1)
  const edition = editions?.[0]
  if (!edition) return <div>Edición no encontrada.</div>

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, position, nominees:nominees(id, display_name, avatar_url)')
    .eq('edition_id', edition.id)
    .order('position', { ascending: true })

  return (
    <main className="space-y-8 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-10">
      {/* Logo pequeño fijo arriba a la izquierda */}
      <div className="fixed top-5 left-5 z-20">
        <Image src="/chaparritaspng.png" alt="Gorritos" width={50} height={50} className="w-[50px] h-[50px] object-contain" priority />
      </div>

      <header>
        <Image src="/Logo.png" alt="Gorritos D'or" width={200} height={60} className="h-auto w-[160px] sm:w-[200px] mb-2" />
        <h1 className="text-2xl font-bold">Resumen — {edition.title}</h1>
      </header>

      <SummaryClient editionId={edition.id} slug={slug} categories={categories ?? []} />
    </main>
  )
}
