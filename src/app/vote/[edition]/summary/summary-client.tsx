'use client'
import { categorySlug } from '@/lib/category-slug'
import Link from 'next/link'
import { useChoices } from '@/hooks/useChoices'
import { useCallback, useEffect, useMemo, useState } from 'react'
import VoteShare from '@/components/VoteShare'
import type { PosterEntry } from '@/lib/vote-poster'

type Category={id:string;name:string;nominees:PosterEntry['nominee'][]}
export default function SummaryClient({editionId,slug,categories}:{editionId:string;slug:string;categories:Category[]}) {
  const {choices,clearAll}=useChoices(editionId)
  const [ack,setAck]=useState(false)
  const [saved,setSaved]=useState<Record<string,string>>({})
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[needsLogin,setNeedsLogin]=useState(false)
  const readVotes=useCallback(async()=>{
    const res=await fetch(`/api/my-votes?edition=${encodeURIComponent(editionId)}`,{cache:'no-store',signal:AbortSignal.timeout(15000)})
    const data=await res.json()
    setNeedsLogin(res.status===401)
    if(!res.ok)throw new Error(data.error??'No pudimos comprobar tus votos.')
    setSaved(data.choices)
    return data.choices as Record<string,string>
  },[editionId])
  useEffect(()=>{let alive=true;readVotes().catch(e=>{if(alive)setError(e instanceof Error?e.message:'No pudimos consultar tus votos.')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[readVotes])
  const pending=categories.filter(c=>choices[c.id]&&!saved[c.id]&&c.nominees.some(n=>n.id===choices[c.id]))
  const entries=useMemo(()=>categories.flatMap(c=>{const nominee=c.nominees.find(n=>n.id===saved[c.id]);return nominee?[{category:c.name,nominee}]:[]}),[categories,saved])
  async function refresh(){setLoading(true);setError('');try{await readVotes()}catch(e){setError(e instanceof Error?e.message:'No pudimos comprobar tus votos.')}finally{setLoading(false)}}
  async function submitAll(){
    if(!pending.length||busy||!ack)return
    setBusy(true);setError('');setMessage('')
    try{
      const res=await fetch('/vote/api/vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({editionId,choices:Object.fromEntries(pending.map(c=>[c.id,choices[c.id]]))}),signal:AbortSignal.timeout(20000)})
      const data=await res.json()
      if(!res.ok&&res.status!==409)throw new Error(data.error||'No se pudo enviar la boleta.')
      await readVotes();clearAll();setMessage('¡Votos enviados correctamente!')
    }catch(e){
      setError(e instanceof Error?e.message:'No pudimos confirmar el envío. Comprueba tu conexión y recarga antes de reintentar.')
      try {await readVotes()}catch{/* Keep the error and allow a safe retry. */}
    }finally{setBusy(false)}
  }
  if(entries.length>0)return <><header className="receipt-header"><p className="receipt-eyebrow">TU VOZ YA CUENTA</p><h1>¡Votos enviados correctamente!<br/><em>Gracias por votar.</em></h1><p className="receipt-copy">Tu boleta quedó cerrada. Tus votos ya no se pueden cambiar ni puedes añadir categorías.</p></header><VoteShare entries={entries} slug={slug}/><a className="receipt-button" href="/auth/logout">Salir</a></>

  return <><nav className="receipt-nav"><Link href={`/vote/${slug}`} className="receipt-brand">Gorritos D’or<small>AWARDS / {slug}</small></Link></nav><header className="receipt-header"><h1>Repasa tu elección.<br/><em>Haz que cuente.</em></h1></header>
    <p className="receipt-copy">Puedes elegir solo las categorías que quieras. Al enviar, tu boleta queda cerrada: no podrás cambiar tus votos ni votar después en las categorías que omitas.</p>
    {loading&&<p role="status" className="receipt-notice">Consultando tus votos…</p>}
    {error&&<div role="alert" className="receipt-notice">{error}{needsLogin&&<p><a href="/auth/login" className="receipt-button">Conectar con Twitch</a></p>}</div>}
    {message&&<p role="status" className="receipt-notice">{message}</p>}
    {!loading&&pending.length>0&&<section className="receipt-review"><div><div className="receipt-section-title"><h2>Tu selección</h2><span>{pending.length} {pending.length===1?'categoría':'categorías'} por enviar</span></div><div className="receipt-drafts">{pending.map((c,index)=>{const n=c.nominees.find(n=>n.id===choices[c.id])!;return <article className="receipt-draft" key={c.id}><div className="receipt-portrait"><img src={n.avatar_url||'/nominee-placeholder.svg'} alt={n.display_name} style={{objectFit:n.ext?.image_fit==='contain'?'contain':'cover',objectPosition:n.ext?.image_position??'center'}} /><span className="receipt-card-number">{String(index+1).padStart(2,'0')}</span><span className="receipt-card-status">✓ Tu elección</span></div><div className="receipt-card-body"><small>{c.name.replace(/\?$/,'')}</small><h3>{n.display_name}</h3>{!busy&&<Link className="receipt-button" href={`/vote/${slug}/category/${categorySlug(c.name)}`}>Cambiar elección <span aria-hidden="true">↗</span></Link>}</div></article>})}</div></div><aside className="receipt-send"><p className="receipt-eyebrow">LISTO PARA ENVIAR</p><div className="receipt-total"><strong>{pending.length}</strong><span>{pending.length===1?'voto pendiente':'votos pendientes'}</span></div><div className="receipt-send-rule"/><p>Estos son los nominados que elegiste. Puedes cambiarlos antes de confirmar.</p><label style={{display:"flex",gap:10,marginBottom:20,fontSize:13,lineHeight:1.6}}><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} disabled={busy}/>Entiendo que este envío es definitivo y no podré cambiar ni añadir votos.</label><button className="receipt-button gold" onClick={submitAll} disabled={busy||loading||!ack}>{busy?'Guardando votos…':`Confirmar y enviar ${pending.length} ${pending.length===1?'voto':'votos'}`}<span aria-hidden="true">↗</span></button><small>Al enviarlos, tus votos quedan registrados.</small><div className="receipt-share-hint"><span aria-hidden="true">✦</span><p>Después podrás descargar una imagen con tus votos y compartirla.</p></div></aside></section>}
    {!loading&&!error&&!pending.length&&!entries.length&&<p className="receipt-notice">Todavía no tienes votos guardados ni selecciones pendientes. Elige tus favoritos en el menú.</p>}
    <div className="receipt-actions"><Link className="receipt-button" href={`/vote/${slug}`}>Volver a las categorías</Link><button className="receipt-button" onClick={refresh} disabled={busy||loading}>Comprobar envío</button></div>
  </>
}
