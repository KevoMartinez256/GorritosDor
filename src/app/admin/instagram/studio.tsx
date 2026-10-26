'use client'
import { useEffect, useRef, useState } from 'react'
import type { Category, Edition, Nominee } from '@/lib/admin-types'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src })
}
function textFit(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, size: number, serif = false) {
  do { ctx.font = `${serif ? 'normal' : '600'} ${size--}px ${serif ? 'Georgia' : 'Arial'}` } while (ctx.measureText(text).width > width && size > 12)
  ctx.fillText(text, x, y)
}
function portrait(ctx: CanvasRenderingContext2D, img: HTMLImageElement, n: Nominee, x: number, y: number, w: number, h: number) {
  const contain = n.ext?.image_fit === 'contain'
  const scale = contain ? Math.min(w/img.width,h/img.height) : Math.max(w/img.width,h/img.height)
  const pos = n.ext?.image_position?.match(/^([\d.]+)%/)
  const px = pos ? Math.max(0,Math.min(1,Number(pos[1])/100)) : .5
  ctx.drawImage(img,x+(w-img.width*scale)*px,y+(h-img.height*scale)/2,img.width*scale,img.height*scale)
}
export default function InstagramStudio({ categories, edition }: { categories: Category[]; edition: Edition }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [format, setFormat] = useState('1350')
  const [footer, setFooter] = useState('12 DE DICIEMBRE · LA COMUNIDAD ELIGE')
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(true)
  const [warning, setWarning] = useState('')
  const [retry, setRetry] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const category = categories.find(c => c.id === categoryId)
  useEffect(() => {
    if (!category) return
    let cancelled = false
    async function render() {
      setBusy(true); setWarning('')
      try {
        const slots = Array.from({ length: 4 }, (_, i) => category!.nominees[i])
        const images = await Promise.all(slots.map(n => n?.avatar_url ? loadImage(n.avatar_url.startsWith('/nominees/') ? n.avatar_url : `/api/admin/portrait/${n.id}`).catch(() => null) : null))
        const logo = await loadImage('/chaparritaspng.png').catch(() => null)
        if (cancelled) return
        const canvas = canvasRef.current!
        const h = Number(format); canvas.width = 1080; canvas.height = h
        const ctx = canvas.getContext('2d')!
        const gradient = ctx.createLinearGradient(0,0,1080,h); gradient.addColorStop(0,'#133d45'); gradient.addColorStop(.6,'#061c24'); gradient.addColorStop(1,'#102e34')
        ctx.fillStyle=gradient; ctx.fillRect(0,0,1080,h)
        ctx.strokeStyle='#edce9040'; ctx.lineWidth=2; ctx.strokeRect(28,28,1024,h-56)
        ctx.strokeStyle='#edce9015'; ctx.beginPath(); ctx.arc(1080,0,700,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(0,h,450,0,Math.PI*2); ctx.stroke()
        if (logo) { const scale=Math.min(72/logo.width,96/logo.height); ctx.drawImage(logo,60+(72-logo.width*scale)/2,48,logo.width*scale,logo.height*scale) }
        ctx.textAlign='center'; ctx.fillStyle='#eed5a0'; textFit(ctx,'Gorritos D’or',540,112,700,68,true)
        ctx.fillStyle='#a9c7ca'; ctx.font='18px Arial'; ctx.fillText(`A W A R D S  /  ${edition.slug}`,540,151)
        const story = h===1920, square=h===1080
        const titleY = story ? 290 : square ? 225 : 255
        ctx.fillStyle='#78d7d1'; ctx.font='18px Arial'; ctx.fillText('L O S   N O M I N A D O S',540,titleY-54)
        ctx.fillStyle='#eed5a0'; textFit(ctx,category!.name,540,titleY,960,square ? 49 : 58,true)
        const top = titleY+45, gap=24, w=460
        const bottom = story ? h-260 : h-125
        const cardH = (bottom-top-gap)/2
        slots.forEach((n,i) => {
          const x=68+(i%2)*(w+gap),y=top+Math.floor(i/2)*(cardH+gap)
          ctx.save(); ctx.beginPath(); ctx.roundRect(x,y,w,cardH,20); ctx.clip()
          ctx.fillStyle='#25434b'; ctx.fillRect(x,y,w,cardH)
          if (images[i] && n) portrait(ctx,images[i]!,n,x,y,w,cardH-66)
          else { ctx.fillStyle='#b8c6bd'; textFit(ctx,n ? n.display_name.slice(0,2).toUpperCase() : '?',x+w/2,y+(cardH-66)/2+25,w-40,80,true) }
          ctx.fillStyle='#09232c'; ctx.fillRect(x,y+cardH-66,w,66)
          ctx.fillStyle=n ? '#f1f4ee' : '#9cbdc1'; textFit(ctx,n?.display_name ?? 'Por anunciar',x+w/2,y+cardH-24,w-32,30)
          ctx.restore(); ctx.strokeStyle='#e3cb9135'; ctx.beginPath(); ctx.roundRect(x,y,w,cardH,20); ctx.stroke()
        })
        ctx.fillStyle='#eed5a0'; textFit(ctx,footer,540,h-(story ? 156 : 66),940,22)
        setPreview(canvas.toDataURL('image/png'))
        const missing = slots.filter((n,i) => n?.avatar_url && !images[i]).map(n=>n.display_name)
        if (missing.length) setWarning(`No se pudo cargar la foto de ${missing.join(', ')}. Se usaron iniciales; puedes reintentar antes de descargar.`)
      } catch { if (!cancelled) { setPreview(''); setWarning('No se pudo generar la imagen. Intenta de nuevo.') } }
      finally { if (!cancelled) setBusy(false) }
    }
    void render()
    return () => { cancelled = true }
  },[category,edition.slug,footer,format,retry])
  return <><p className="admin-eyebrow">ESTUDIO / INSTAGRAM</p><h1>Cuatro nombres.<br /><em>Un gran reconocimiento.</em></h1><div className="studio-grid"><section className="admin-panel studio-settings"><label>Categoría<select value={categoryId} onChange={e=>setCategoryId(e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Formato<select value={format} onChange={e=>setFormat(e.target.value)}><option value="1350">Publicación vertical · 1080 × 1350</option><option value="1080">Cuadrado · 1080 × 1080</option><option value="1920">Historia · 1080 × 1920</option></select></label><label>Texto inferior<input maxLength={90} value={footer} onChange={e=>setFooter(e.target.value)} /></label><p>Los nombres y fotografías vienen de los nominados de la categoría. Los lugares pendientes conservan su espacio.</p><button className="admin-button primary" disabled={busy || !preview} onClick={()=>{ const a=document.createElement('a');a.href=preview;a.download=`gorritos-${edition.slug}-${category?.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${format}.png`;a.click() }}>{busy ? 'Preparando imagen…' : 'Descargar PNG ↓'}</button><button className="admin-button" onClick={()=>setRetry(r=>r+1)} disabled={busy}>Volver a cargar imágenes</button><p role="status">{warning || 'La descarga incluye exactamente la imagen de la vista previa.'}</p></section><section className="studio-preview" aria-label="Vista previa de Instagram" aria-busy={busy}>{preview && <img src={preview} alt={`Publicación: ${category?.name}`} style={{ opacity:busy?.4:1 }} />}{busy && <span className="studio-loading">Preparando…</span>}</section></div><canvas ref={canvasRef} hidden /></>
}
