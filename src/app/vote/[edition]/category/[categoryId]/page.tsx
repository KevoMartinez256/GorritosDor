import Link from 'next/link'
import { notFound } from 'next/navigation'
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
    .eq('edition_id', edition.id)
    .limit(1).single()

  if (!category) notFound()

  // Navegación en el orden de las categorías de esta edición.
  const { data: all } = await supabase
    .from('categories')
    .select('id, position')
    .eq('edition_id', edition.id)
    .order('position', { ascending: true })

  const idx = all?.findIndex(c => c.id === categoryId) ?? -1
  const previousId = idx > 0 && all ? all[idx - 1].id : null
  const nextId = idx >= 0 && all && idx + 1 < all.length ? all[idx + 1].id : null

  return (
    <main className="ballot-page">
      <a href="/" className="chaparritas-mark" aria-label="Chaparritas — volver al inicio">
        <img src="/chaparritaspng.png" alt="Chaparritas" width={50} height={50} />
      </a>
      <div className="ballot-shell nominee-shell">
        <header className="ballot-nav">
          <Link href={`/vote/${slug}`} className="ballot-brand">Gorritos D’or <span>AWARDS / {slug}</span></Link>
          <Link href={`/vote/${slug}`} className="ballot-home">Todas las categorías <span aria-hidden="true">↗</span></Link>
        </header>
        <section className="nominee-heading">
          <div>
            <p className="ballot-kicker"><span /> CATEGORÍA {String(idx + 1).padStart(2, '0')} / {String(all?.length ?? 0).padStart(2, '0')}</p>
            <h1>{category.name.replace(/\?$/, '')}</h1>
            <p className="nominee-heading-description">Conoce a los nominados. Elige quién merece este reconocimiento.</p>
          </div>
          <nav className="nominee-navigation" aria-label="Navegación de categorías">
            {previousId && <Link href={`/vote/${slug}/category/${previousId}`} className="gala-button gala-secondary" rel="prev"><span aria-hidden="true">←</span> Anterior</Link>}
            <Link href={`/vote/${slug}`} className="gala-button gala-secondary"><span aria-hidden="true">←</span> Regresar al menú</Link>
            {nextId && <Link href={`/vote/${slug}/category/${nextId}`} className="gala-button gala-primary">Siguiente <span aria-hidden="true">→</span></Link>}
          </nav>
        </section>
        <CategoryClient editionId={edition.id} slug={slug} category={category} />
        <footer className="ballot-footer"><span>GORRITOS D’OR <b>{slug}</b></span><p>Hecho de momentos. Elegido por la comunidad.</p><Link href={`/vote/${slug}`}>Explorar categorías →</Link></footer>
      </div>
    </main>
  )
}

