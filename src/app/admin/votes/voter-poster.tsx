'use client'
import {useState} from 'react'
import {drawVotePoster} from '@/lib/vote-poster'

export default function VoterPoster(){
 const [username,setUsername]=useState(''),[busy,setBusy]=useState(false),[url,setUrl]=useState(''),[name,setName]=useState(''),[message,setMessage]=useState('')
 async function generate(e:React.FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setUrl('');setMessage('')
  try{
   const response=await fetch('/api/admin/voter-poster?username='+encodeURIComponent(username.trim()),{cache:'no-store',signal:AbortSignal.timeout(20000)})
   const data=await response.json();if(!response.ok)throw Error(data.error)
   const result=await drawVotePoster(document.createElement('canvas'),data.entries,data.slug,data.profile)
   setName(data.profile.name);setUrl(result.url)
   setMessage(`${data.entries.length} categorías guardadas.${result.missing.length?' No cargaron algunas fotos; se muestran iniciales. Puedes generar de nuevo.':''}`)
  }catch(e){setMessage(e instanceof Error?e.message:'No se pudo generar la imagen.')}finally{setBusy(false)}
 }
 return <section className="admin-panel"><h2>Imagen de los votos de un usuario</h2><p>Recupera su publicación de 1080 × 1350 con sus votos guardados, nombre y foto de Twitch. Esta opción no cambia su votación.</p><form className="studio-settings" onSubmit={generate}><label>Usuario de Twitch<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="luakatt_" maxLength={26} required disabled={busy}/></label><button className="admin-button primary" disabled={busy}>{busy?'Generando imagen…':'Buscar y generar imagen'}</button></form><p role="status">{message}</p>{url&&<><a className="admin-button primary" href={url} download={`mis-votos-${name.replace(/[^a-zA-Z0-9_-]/g,'')}-2026.png`}>Descargar PNG de {name} ↓</a><div style={{marginTop:24}}><img src={url} alt={`Vista previa de los votos de ${name}`} style={{width:'100%',maxWidth:540,height:'auto',borderRadius:12}}/></div></>}</section>
}
