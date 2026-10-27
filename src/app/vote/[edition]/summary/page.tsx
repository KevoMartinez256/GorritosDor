import { createClientServer } from '@/lib/supabaseClient'
import SummaryClient from './summary-client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import './share.css'
import './review.css'

export const dynamic = 'force-dynamic'
export default async function SummaryPage({params}:{params:Promise<{edition:string}>}) {
  const {edition:slug}=await params
  const supabase=createClientServer()
  const {data:edition,error}=await supabase.from('editions').select('id,slug,title').eq('slug',slug).maybeSingle()
  if(error)throw new Error('No se pudo consultar la edición.')
  if(!edition)notFound()
  const {data:categories,error:categoryError}=await supabase.from('categories').select('id,name,position,nominees:nominees(id,display_name,avatar_url,ext)').eq('edition_id',edition.id).order('position',{ascending:true})
  if(categoryError)throw new Error('No se pudieron cargar las categorías.')
  return <main className="receipt-page"><Link href="/" className="chaparritas-mark" aria-label="Chaparritas — volver al inicio"><img src="/chaparritaspng.png" alt="Chaparritas" width={50} height={64}/></Link><nav className="receipt-nav"><Link href={`/vote/${slug}`} className="receipt-brand">Gorritos D’or<small>AWARDS / {slug}</small></Link><Link href={`/vote/${slug}`}>Volver a las categorías <span aria-hidden="true">↗</span></Link></nav><header className="receipt-header"><p className="receipt-eyebrow">EL RECONOCIMIENTO LO ELIGES TÚ</p><h1>Repasa tu elección.<br/><em>Haz que cuente.</em></h1><p className="receipt-copy">Un último vistazo a quienes hicieron especial este año.</p></header><SummaryClient editionId={edition.id} slug={slug} categories={categories??[]}/></main>
}
