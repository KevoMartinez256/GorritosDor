'use client'
import { categorySlug } from '@/lib/category-slug'

import Link from 'next/link'
import { useChoices } from '@/hooks/useChoices'
import { useState, type CSSProperties } from 'react'

type Nominee = { id: string; display_name: string; avatar_url: string | null; ext?: { position?: number; image_fit?: 'contain' | 'cover'; image_position?: string } }
type Category = { id: string; name: string; position: number; nominees?: Nominee[] }
type Filter = 'all' | 'pending' | 'selected'

const descriptions: Record<string, string> = {
  'STREAMER FPS': 'Puntería, reflejos y partidas inolvidables.',
  'STREAMER DE MC': 'Un bloque. Mil historias.',
  'VTUBER': 'Talento que atraviesa la pantalla.',
  'EVENTO': 'Esos días que hicieron comunidad.',
  'SERIE': 'Historias que no queríamos que terminaran.',
  'CLIP': 'Un instante para volver a verlo mil veces.',
  'CREADOR DE CONTENIDO?': 'Ideas que merecen estar en primera fila.',
  'MEJOR REGRESO': 'Volvieron. Y se sintió como estar en casa.',
  'STREAMER VARIEDAD': 'Siempre algo nuevo. Siempre un buen rato.',
  'STREAMER REVELACIÓN': 'Llegaron para quedarse.',
  'STREAMER DEL AÑO': 'Una comunidad. Un año de momentos. Tu elección.',
}

function CategoryIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    'STREAMER FPS': 'M12 2v4m0 12v4M2 12h4m12 0h4M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM12 9v6m-3-3h6',
    'STREAMER DE MC': 'm12 3 9 5v9l-9 5-9-5V8l9-5Zm0 9 9-4M12 12 3 8m9 4v10',
    'CLIP': 'M4 5h16v14H4zM10 8l6 4-6 4V8Z',
    'SERIE': 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4m8 0h4M4 15h4m8 0h4',
    'EVENTO': 'M5 5h14v16H5zM8 2v6m8-6v6M5 10h14m-9 4h4',
  }
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z'} /></svg>
}

export default function VoteMenuClient({ editionId, slug, categories }: { editionId: string; slug: string; categories: Category[] }) {
  const { choices } = useChoices(editionId)
  const [filter, setFilter] = useState<Filter>('all')
  const selectedCount = categories.filter(c => c.nominees?.some(n => n.id === choices[c.id])).length
  const total = categories.length
  const progress = total ? Math.round(selectedCount / total * 100) : 0
  const selectedIn = (c: Category) => c.nominees?.find(n => n.id === choices[c.id])
  const visible = categories.filter(c => filter === 'all' || (filter === 'selected' ? Boolean(selectedIn(c)) : !selectedIn(c)))
  const next = categories.find(c => c.nominees?.length && !selectedIn(c))

  return (
    <div className="ballot-shell">
      <header className="ballot-nav">
        <Link href="/" className="ballot-brand">Gorritos D’or <span>AWARDS / {slug}</span></Link>
        <Link href="/" className="ballot-home">Volver al inicio <span aria-hidden="true">↗</span></Link>
      </header>
      <section className="ballot-intro" aria-labelledby="ballot-title">
        <div>
          <p className="ballot-kicker"><span /> EL ESCENARIO ES DE LA COMUNIDAD</p>
          <h1 id="ballot-title">Los momentos quedan.<br /><em>Tú eliges a quién celebrar.</em></h1>
          <p className="ballot-description">Explora las categorías, descubre a los nominados y arma tu selección.</p>
        </div>
        <aside className="ballot-progress">
          <div className="ballot-progress-top"><span>TU SELECCIÓN</span><strong>{selectedCount}<small> / {total}</small></strong></div>
          <div className="ballot-track" role="progressbar" aria-label="Categorías seleccionadas" aria-valuenow={selectedCount} aria-valuemin={0} aria-valuemax={total || 1}><div style={{ width: `${progress}%` }} /></div>
          <p>{selectedCount === total && total > 0 ? 'Todo listo para revisar tu selección.' : 'Tus elecciones se guardan en este navegador.'}</p>
          <Link href={`/vote/${slug}/summary`} className="ballot-summary">Revisar selección <span aria-hidden="true">↗</span></Link>
          <span className="ballot-progress-note">Seleccionar no envía tu voto.</span>
        </aside>
      </section>
      <div className="ballot-toolbar">
        <div className="ballot-filters" aria-label="Filtrar categorías">
          {([['all', 'Todas', total], ['pending', 'Pendientes', total - selectedCount], ['selected', 'Seleccionadas', selectedCount]] as const).map(([value, label, count]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{count}</span></button>
          ))}
        </div>
        {next && <Link className="ballot-continue" href={`/vote/${slug}/category/${categorySlug(next.name)}`}>{selectedCount ? 'Continuar selección' : 'Comenzar selección'} <span aria-hidden="true">→</span></Link>}
      </div>
      <div className="ballot-grid">
        {visible.map((category, index) => {
          const nominees = [...(category.nominees ?? [])].sort((a, b) => (a.ext?.position ?? 0) - (b.ext?.position ?? 0))
          const selected = selectedIn(category)
          const featured = category.name === 'STREAMER DEL AÑO'
          const waiting = nominees.length === 0
          return (
            <Link key={category.id} href={`/vote/${slug}/category/${categorySlug(category.name)}`} className={`ballot-card ${featured ? 'ballot-featured' : ''} ${selected ? 'is-selected' : ''}`} style={{ '--card-delay': `${index * 35}ms` } as CSSProperties}>
              <div className="ballot-card-top"><span className="ballot-icon"><CategoryIcon name={category.name} /></span><span className={`ballot-status ${selected ? 'complete' : ''}`}>{selected ? '✓ Seleccionada' : waiting ? 'Por anunciar' : featured ? 'EL GRAN RECONOCIMIENTO' : `${String(category.position).padStart(2, '0')} / ${String(total).padStart(2, '0')}`}</span></div>
              <div className="ballot-card-copy"><h2>{category.name.replace(/\?$/, '')}</h2><p>{descriptions[category.name] ?? 'Descubre a los nominados de esta categoría.'}</p></div>
              <div className="ballot-portraits" aria-hidden="true">
                {Array.from({ length: 4 }, (_, i) => {
                  const nominee = nominees[i]
                  return <div key={nominee?.id ?? `pending-${i}`} className={`ballot-portrait ${!nominee ? 'is-empty' : ''}`}>
                    {nominee?.avatar_url ? <img style={{ objectPosition: nominee.ext?.image_position ?? 'center', ...(nominee.ext?.image_fit === 'contain' ? { objectFit: 'contain', padding: '5px' } : {}) }} src={nominee.avatar_url} alt="" loading="lazy" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/nominee-placeholder.svg' }} /> : <span>{nominee ? nominee.display_name.split(' ').map(w => w[0]).slice(0, 2).join('') : '+'}</span>}
                    {nominee && <span className="ballot-portrait-name">{nominee.display_name}</span>}
                  </div>
                })}
              </div>
              <div className="ballot-card-bottom"><span>{selected ? <><span className="ballot-choice-label">TU ELECCIÓN</span> {selected.display_name}</> : waiting ? 'Los nominados llegan pronto' : `${nominees.length} nominados${nominees.length < 4 ? ' · más por anunciar' : ''}`}</span><span className="ballot-arrow" aria-label={selected ? 'Cambiar selección' : 'Ver categoría'}>↗</span></div>
            </Link>
          )
        })}
      </div>
      {!visible.length && <div className="ballot-empty"><h2>{total === 0 ? 'Los nominados llegan pronto' : filter === 'selected' ? 'Tu selección empieza aquí' : '¡Ya recorriste todas las categorías!'}</h2><p>{filter === 'selected' ? 'Elige un nominado y encontrarás su categoría en esta sección.' : 'Vuelve a todas las categorías para seguir explorando.'}</p>{total > 0 && <button onClick={() => setFilter('all')}>Ver todas las categorías →</button>}</div>}
      <footer className="ballot-footer"><span>GORRITOS D’OR <b>{slug}</b></span><p>Hecho de momentos. Elegido por la comunidad.</p><Link href={`/vote/${slug}/summary`}>Ver resumen →</Link></footer>
    </div>
  )
}



