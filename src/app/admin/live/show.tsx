'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { tally, type Category, type Edition, type Results } from '@/lib/admin-types'

export default function LiveShow({ categories, edition }: { categories: Category[]; edition: Edition }) {
  const [index,setIndex] = useState(0)
  const [results,setResults] = useState<Results | null>(null)
  const [error,setError] = useState('')
  const [mode,setMode] = useState<'nominees'|'results'|'winner'>('nominees')
  const [snapshot,setSnapshot] = useState<Results | null>(null)
  const [fullscreen,setFullscreen] = useState(false)
  const [presentationNotice,setPresentationNotice] = useState('')
  const [controls,setControls] = useState(true)
  const [refresh,setRefresh] = useState(0)
  const stage = useRef<HTMLDivElement>(null)
  const category = categories[index]
  useEffect(()=>{
    let stopped=false; let timer: ReturnType<typeof setTimeout>; let controller: AbortController
    async function poll() {
      controller=new AbortController()
      const timeout=setTimeout(()=>controller.abort(),12000)
      try {
        const res=await fetch('/api/admin/results',{ cache:'no-store',signal:controller.signal })
        if(!res.ok) throw new Error(res.status===401 || res.status===403 ? 'Tu sesión no tiene acceso. Vuelve a iniciar sesión.' : 'Conexión interrumpida. Mostrando la última actualización; reintentando…')
        const data=await res.json() as Results
        if(!stopped){setResults(data);setError('')}
      } catch(e) { if(!stopped)setError(e instanceof Error && e.name!=='AbortError' ? e.message : 'No hay respuesta. Conservando la última actualización; reintentando…') }
      finally { clearTimeout(timeout); if(!stopped)timer=setTimeout(poll,3000) }
    }
    void poll()
    return()=>{stopped=true;clearTimeout(timer);controller?.abort()}
  },[refresh])
  const move = useCallback((delta:number)=>{setIndex(i=>Math.min(categories.length-1,Math.max(0,i+delta)));setMode('nominees');setSnapshot(null)},[categories.length])
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if((e.target as HTMLElement).closest('input,select,textarea,button,a'))return
      if(e.key==='ArrowRight'){e.preventDefault();move(1)}
      if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}
      if(e.key.toLowerCase()==='h')setControls(c=>!c)
      if(e.key==='Escape'&&!document.fullscreenElement)setFullscreen(false)
    }
    const onFull=()=>{setFullscreen(!!document.fullscreenElement);setControls(true)}
    window.addEventListener('keydown',onKey);document.addEventListener('fullscreenchange',onFull)
    return()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('fullscreenchange',onFull)}
  },[move])
  if(!category) return <p>No hay categorías disponibles.</p>
  const current=snapshot??results
  const { total,leaders,percent }=tally(category,current?.counts??{})
  const hasWinner=mode==='winner' && total>0
  const showNumbers=mode!=='nominees'
  const changeMode=(next:typeof mode)=>{setMode(next);setSnapshot(next==='winner'?results:null)}
  async function toggleFullscreen(){
    setPresentationNotice('')
    if(fullscreen){if(document.fullscreenElement)await document.exitFullscreen();setFullscreen(false);return}
    setFullscreen(true)
    try{await stage.current?.requestFullscreen()}catch{setPresentationNotice('Modo presentación activo. Usa F11 si quieres ocultar también la barra del navegador.')}
  }
  return <><div className="live-heading"><div><p className="admin-eyebrow">ESCENARIO / RESULTADOS</p><h1>El momento de celebrar.</h1></div><p>← → Cambiar categoría · H Ocultar controles<br />Actualización automática cada 3 segundos</p></div><div className={`live-stage ${fullscreen?'is-fullscreen':''}`} ref={stage}>
    <div className="stage-top"><a href="/admin" className="admin-brand"><img src="/chaparritaspng.png" alt="Chaparritas" /><span>Gorritos D’or<small>AWARDS / {edition.slug}</small></span></a><span className={`live-status ${error?'offline':''}`}>{snapshot?'RESULTADO AL CORTE':error?'SIN CONEXIÓN':results?'● EN VIVO':'CONECTANDO…'}<small>{current ? `Actualizado ${new Date(current.updatedAt).toLocaleTimeString('es-MX')}` : 'Esperando resultados'}</small></span></div>
    <div className="stage-title"><p className="admin-eyebrow">CATEGORÍA {String(index+1).padStart(2,'0')} / {categories.length}</p><h2>{category.name}</h2><p>{hasWinner ? leaders.length>1 ? 'EMPATE · EL RECONOCIMIENTO SE COMPARTE' : current?.closed ? 'EL GANADOR ES' : 'LÍDER PROVISIONAL · VOTACIÓN AÚN NO CERRADA' : mode==='winner' ? 'SIN VOTOS · TODAVÍA NO HAY GANADOR' : mode==='nominees' ? 'Los nominados. El talento de nuestra comunidad.' : !results ? 'Cargando resultados…' : !results.started ? 'La votación aún no comienza' : results.closed ? 'Votación cerrada · resultados finales' : 'La comunidad está eligiendo · resultados provisionales'}</p></div>
    <div className={`stage-nominees ${hasWinner?'revealed':''}`} key={category.id}>{Array.from({length:4},(_,i)=>category.nominees[i]).map((n,i)=>{
      const winner=!!n && hasWinner && leaders.some(l=>l.id===n.id)
      return <article key={n?.id??i} className={`stage-card ${winner?'winner':''} ${hasWinner&&!winner?'runner-up':''}`}><div className="stage-portrait">{n?.avatar_url ? <img src={n.avatar_url} alt="" style={{objectFit:n.ext?.image_fit==='contain'?'contain':'cover',objectPosition:n.ext?.image_position??'center'}} onError={e=>{e.currentTarget.style.display='none'}} /> : <span className="stage-initials">{n?n.display_name.slice(0,2).toUpperCase():'?'}</span>}{winner&&<span className="winner-seal">✦ {leaders.length>1?'EMPATE':current?.closed?'GANADOR':'LÍDER'}</span>}</div><div className="stage-card-body"><h3>{n?.display_name??'Por anunciar'}</h3>{showNumbers && n && current ? <><div className="stage-percent"><strong>{percent(n.id).toLocaleString('es-MX',{minimumFractionDigits:1,maximumFractionDigits:1})}<small>%</small></strong><span>{(current.counts[n.id]??0).toLocaleString('es-MX')} votos</span></div><div className="stage-bar"><span style={{width:`${percent(n.id)}%`}} /></div></> : <p>{n?'NOMINADO / 2026':'NOMINADO POR CONFIRMAR'}</p>}</div></article>
    })}</div>
    <div className="stage-foot"><span>{showNumbers&&current?`${total.toLocaleString('es-MX')} votos en esta categoría`:'Una comunidad. Un año de momentos.'}</span><span>{snapshot?'Corte congelado para este anuncio':'Solo votos dentro del periodo oficial'}</span></div>
    {error&&<p role="alert" className="live-error">{error}</p>}
    {presentationNotice&&controls&&<p className="admin-note">{presentationNotice}</p>}
    {controls ? <div className="stage-controls"><button className="admin-button" onClick={()=>move(-1)} disabled={index===0}>← Anterior</button><label className="sr-only" htmlFor="live-category">Categoría</label><select id="live-category" value={category.id} onChange={e=>{setIndex(categories.findIndex(c=>c.id===e.target.value));setMode('nominees');setSnapshot(null)}}>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select><button className="admin-button" onClick={()=>move(1)} disabled={index===categories.length-1}>Siguiente →</button><div className="stage-mode"><button className={`admin-button ${mode==='nominees'?'active':''}`} onClick={()=>changeMode('nominees')}>Nominados</button><button className={`admin-button ${mode==='results'?'active':''}`} disabled={!results} onClick={()=>changeMode('results')}>Ver porcentajes</button><button className="admin-button primary" disabled={!results||!!error||!tally(category,results?.counts??{}).total} onClick={()=>changeMode('winner')}>Revelar {results?.closed?'ganador':'líder'}</button></div><button className="admin-button" onClick={()=>{setSnapshot(null);setMode('results');setRefresh(r=>r+1)}}>↻ En vivo</button><button className="admin-button" onClick={toggleFullscreen}>{fullscreen?'Salir de pantalla completa':'Pantalla completa ⛶'}</button><button className="admin-button" onClick={()=>setControls(false)}>Ocultar controles</button></div> : <button className="stage-show-controls" onClick={()=>setControls(true)}>Mostrar controles · H</button>}
  </div><p className="admin-note">Al revelar se congela una copia de los resultados para el anuncio. “En vivo” vuelve a actualizarla. Si hay empate se destacan todos los primeros lugares; sin votos no se declara ganador.</p></>
}
