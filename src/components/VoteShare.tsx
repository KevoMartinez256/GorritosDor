'use client'
import { useState } from 'react'
import { drawVotePoster, type PosterEntry } from '@/lib/vote-poster'

export default function VoteShare({entries,slug}:{entries:PosterEntry[];slug:string}) {
  const [busy,setBusy]=useState(false),[url,setUrl]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('')
  async function generate(){
    setBusy(true);setError('');setNotice('');setUrl('')
    try {const result=await drawVotePoster(document.createElement('canvas'),entries,slug);setUrl(result.url);if(result.missing.length)setNotice(`No cargaron las fotos de ${result.missing.join(', ')}. Se muestran sus iniciales. Puedes volver a generar la imagen.`)}
    catch(e){setError(e instanceof Error?e.message:'No pudimos crear tu imagen. Intenta de nuevo.')}
    finally{setBusy(false)}
  }
  if(!entries.length)return null
  return <section className="vote-share"><div><p className="receipt-eyebrow">TU VOZ YA CUENTA</p><h2>Comparte a quién celebras.</h2><p>Tu imagen incluye las {entries.length===1?'categoría que votaste':`${entries.length} categorías que votaste`}, con los nombres y fotografías. Publicación vertical de 1080 × 1350.</p><button className="receipt-button gold" onClick={generate} disabled={busy}>{busy?'Preparando tu imagen…':url?'Volver a generar':'Crear imagen de mis votos'}</button>{url&&<a className="receipt-button gold" href={url} download={`mis-votos-gorritos-${slug}.png`}>Descargar imagen PNG ↓</a>}<p role="status">{error||notice}</p><small>Compartir es opcional. La descarga no publica nada automáticamente.</small></div>{url&&<img className="vote-share-preview" src={url} alt="Vista previa de la publicación con tus votos confirmados" />}</section>
}
