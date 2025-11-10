import Link from 'next/link'
import { createClientServer } from '@/lib/supabaseClient'
import CategoryClient from './category-client'

export const dynamic = 'force-dynamic'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ edition: string; categoryId: string }>
}) {
  const { edition: slug, categoryId } = await params
  const supabase = await createClientServer()

  const { data: editions } = await supabase
    .from('editions').select('id, slug, title').eq('slug', slug).limit(1)
  const edition = editions?.[0]
  if (!edition) return <div>Edición no encontrada.</div>

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, position, nominees:nominees(id, display_name, avatar_url, twitch_login, ext)')
    .eq('id', categoryId)
    .limit(1).single()

  // para el botón "Siguiente"
  const { data: all } = await supabase
    .from('categories')
    .select('id, position')
    .eq('edition_id', edition.id)
    .order('position', { ascending: true })

  const idx = all?.findIndex(c => c.id === categoryId) ?? -1
  const nextId = idx >= 0 && all && idx + 1 < all.length ? all[idx + 1].id : null

  return (
    <main className="space-y-8 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-10">
      {/* Logo pequeño fijo arriba a la izquierda (50x50) */}
      <div className="fixed top-5 left-5 z-20">
        <img src="/chaparritaspng.png" alt="Gorritos" width={50} height={50} className="w-[50px] h-[50px] object-contain" />
      </div>
      {/* ⬇️ Header SOLO aquí */}
      <header className="flex items-start justify-between">
        <div>
          <img src="/Logo.png" alt="Gorritos D'or" className="w-[160px] sm:w-[200px] h-auto mb-2" />
          <h1 className="text-2xl font-bold">{category?.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/vote/${slug}`} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700">
            Regresar al menú
          </Link>
          {nextId && (
            <Link
              href={`/vote/${slug}/category/${nextId}`}
              className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600"
            >
              Siguiente
            </Link>
          )}
        </div>
      </header>

      {/* El cliente ya NO pinta header, solo el grid y acciones inferiores */}
      <CategoryClient editionId={edition.id} slug={slug} category={category!} />
    </main>
  )
}
