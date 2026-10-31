import { guardVoting } from '@/lib/voting-access'
﻿import { createClientServer } from '@/lib/supabaseClient'
import { notFound } from 'next/navigation'
import VoteMenuClient from './VoteMenuClient'

export const dynamic = 'force-dynamic'

export default async function VoteMenu({ params }: { params: Promise<{ edition: string }> }) {
  const { edition: slug } = await params
  const supabase = createClientServer()
  const { data: edition } = await supabase.from('editions').select('id, slug, title').eq('slug', slug).maybeSingle()
  if (!edition) notFound()
  const access=await guardVoting(edition.id,slug)
  if(!access.allowed)return <main className="ballot-page"><div className="ballot-shell"><h1>Gorritos D’or 2026</h1><p>{access.message}</p><a className="gala-button gala-primary" href="/">Volver al inicio</a></div></main>
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, position, nominees:nominees(id, display_name, avatar_url, ext)')
    .eq('edition_id', edition.id)
    .order('position', { ascending: true })
  return (
    <main className="ballot-page">
      <a href="/" className="chaparritas-mark" aria-label="Chaparritas — volver al inicio">
        <img src="/chaparritaspng.png" alt="Chaparritas" width={50} height={50} />
      </a>
      <VoteMenuClient editionId={edition.id} slug={slug} categories={categories ?? []} />
    </main>
  )
}

