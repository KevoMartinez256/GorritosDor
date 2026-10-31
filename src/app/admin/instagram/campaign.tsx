'use client'
import { useEffect, useRef, useState } from 'react'
import type { Category } from '@/lib/admin-types'

const slides = [
  ['Votaciones abiertas', 'La comunidad elige.', 'Desliza para saber cómo votar →'],
  ['Inicia sesión', 'Entra a la web y conecta tu cuenta de Twitch.', 'Pulsa «Connect with Twitch».'],
  ['Entra a votar', 'Con tu sesión iniciada, pulsa «Ir a votar».', 'Tu elección comienza aquí.'],
  ['Elige tus favoritos', 'Vota en todas las categorías o solo en las que quieras.', 'Elige un nominado por categoría.'],
  ['Revisa tu resumen', 'Al terminar, abre «Ver resumen» y revisa tu selección.', 'Una vez enviados, no podrás cambiar ni añadir votos.'],
  ['Comparte tu elección', 'Descarga la imagen de tus votos y compártela.', 'Gracias por votar.'],
]

function image(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

function text(ctx: CanvasRenderingContext2D, value: string, y: number, size: number, color = '#eed5a0', serif = false) {
  ctx.fillStyle = color
  do {
    ctx.font = `${size--}px ${serif ? 'Georgia' : 'Arial'}`
  } while (ctx.measureText(value).width > 920 && size > 15)
  ctx.fillText(value, 540, y)
}

export default function Campaign({ categories, year }: { categories: Category[]; year: string }) {
  const [slide, setSlide] = useState(0)
  const [blur, setBlur] = useState(3)
  const [opacity, setOpacity] = useState(35)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(true)
  const [warning, setWarning] = useState('')
  const [capture, setCapture] = useState('')
  const [retry, setRetry] = useState(0)
  const cache = useRef(new Map<string, HTMLImageElement>())
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let cancelled = false
    async function render() {
      setBusy(true)
      setWarning('')
      try {
        const unique = [...new Map(categories.flatMap(c => c.nominees).filter(n => n.avatar_url).map(n => [n.avatar_url, n])).values()]
        const photos = await Promise.all(unique.map(async n => {
          const src = n.avatar_url!.startsWith('/') ? n.avatar_url! : `/api/admin/portrait/${n.id}`
          if (cache.current.has(src)) return cache.current.get(src)!
          const loaded = await image(src).catch(() => null)
          if (loaded) cache.current.set(src, loaded)
          return loaded
        }))
        const screenshot = slide ? await image(capture || `/campaign/paso${slide}.png`).catch(() => null) : null
        const logo = await image('/chaparritaspng.png').catch(() => null)
        if (cancelled) return
        const node = canvas.current!
        node.width = 1080
        node.height = 1350
        const ctx = node.getContext('2d')!
        ctx.fillStyle = '#061c24'
        ctx.fillRect(0, 0, 1080, 1350)
        const available = photos.filter((p): p is HTMLImageElement => !!p)
        ctx.save()
        ctx.filter = `blur(${blur}px)`
        ctx.globalAlpha = opacity / 100
        for (let i = 0; i < 48 && available.length; i++) {
          const img = available[i % available.length]
          const x = (i % 6) * 196 - 60 + (Math.floor(i / 6) % 2) * 35
          const y = Math.floor(i / 6) * 184 - 35
          ctx.save()
          ctx.beginPath()
          ctx.roundRect(x, y, 178, 164, 14)
          ctx.clip()
          const scale = Math.max(178 / img.width, 164 / img.height)
          ctx.drawImage(img, x + (178 - img.width * scale) / 2, y + (164 - img.height * scale) / 2, img.width * scale, img.height * scale)
          ctx.restore()
          ctx.strokeStyle = '#eed5a0'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, 178, 164)
        }
        ctx.restore()
        const shade = ctx.createLinearGradient(0, 0, 0, 1350)
        shade.addColorStop(0, '#061c2470')
        shade.addColorStop(.5, '#061c24c9')
        shade.addColorStop(1, '#061c24ee')
        ctx.fillStyle = shade
        ctx.fillRect(0, 0, 1080, 1350)
        ctx.strokeStyle = '#eed5a060'
        ctx.strokeRect(28, 28, 1024, 1294)
        if (logo) {
          const scale = Math.min(66 / logo.width, 84 / logo.height)
          ctx.drawImage(logo, 60, 55, logo.width * scale, logo.height * scale)
        }
        ctx.textAlign = 'center'
        text(ctx, 'Gorritos D’or', 110, 66, '#eed5a0', true)
        text(ctx, `A W A R D S  /  ${year}`, 153, 20, '#a9c7ca')
        if (!slide) {
          text(ctx, 'LA COMUNIDAD ELIGE', 565, 24, '#78d7d1')
          text(ctx, 'VOTACIONES', 690, 106, '#eed5a0', true)
          text(ctx, 'ABIERTAS', 815, 124, '#eed5a0', true)
          text(ctx, 'Celebra a tus favoritos.', 900, 34, '#f1f4ee')
          text(ctx, slides[0][2], 1170, 27)
        } else {
          text(ctx, `PASO ${slide} / 5`, 225, 24, '#78d7d1')
          text(ctx, slides[slide][0], 302, 66, '#eed5a0', true)
          text(ctx, slides[slide][1], 362, 28, '#f1f4ee')
          ctx.fillStyle = '#0b252ee8'
          ctx.beginPath()
          ctx.roundRect(70, 410, 940, 710, 22)
          ctx.fill()
          if (screenshot) {
            // The summary crop omits the obsolete return-later paragraph and bottom controls.
            const sy = slide === 4 && !capture ? Math.round(screenshot.height * .31) : 0
            const sh = slide === 4 && !capture ? Math.round(screenshot.height * .53) : screenshot.height
            const scale = Math.min(900 / screenshot.width, 670 / sh)
            const w = screenshot.width * scale, h = sh * scale
            ctx.drawImage(screenshot, 0, sy, screenshot.width, sh, 540 - w / 2, 765 - h / 2, w, h)
          } else {
            text(ctx, 'CAPTURA FINAL PENDIENTE', 755, 28, '#a9c7ca')
          }
          ctx.strokeStyle = '#eed5a080'
          ctx.beginPath()
          ctx.roundRect(70, 410, 940, 710, 22)
          ctx.stroke()
          text(ctx, slides[slide][2], 1190, 27)
          if (!screenshot) text(ctx, 'BORRADOR · AGREGA LA CAPTURA', 1233, 18, '#78d7d1')
        }
        text(ctx, 'gorritos-dor.vercel.app', 1283, 25, '#a9c7ca')
        setPreview(node.toDataURL('image/png'))
        const missing = photos.filter(p => !p).length
        setWarning([missing ? `${missing} fotos no cargaron. Puedes reintentar.` : '', slide && !screenshot ? 'Falta la captura de este paso. Puedes cargarla aquí.' : ''].filter(Boolean).join(' '))
      } catch {
        if (!cancelled) { setPreview(''); setWarning('No se pudo generar. Intenta de nuevo.') }
      } finally { if (!cancelled) setBusy(false) }
    }
    void render()
    return () => { cancelled = true }
  }, [categories, year, slide, blur, opacity, capture, retry])
  useEffect(() => () => { if (capture) URL.revokeObjectURL(capture) }, [capture])
  return <div className="studio-grid"><section className="admin-panel studio-settings">
    <label>Imagen del carrusel<select value={slide} onChange={e => { setSlide(Number(e.target.value)); setCapture('') }}>{slides.map((s, i) => <option key={i} value={i}>{i === 0 ? 'Portada' : `Paso ${i}`} · {s[0]}</option>)}</select></label>
    <label>Difuminado del fondo<input type="range" min="0" max="12" value={blur} onChange={e => setBlur(Number(e.target.value))} /></label>
    <label>Intensidad de las fotos<input type="range" min="10" max="80" value={opacity} onChange={e => setOpacity(Number(e.target.value))} /></label>
    {slide > 0 && <label>Reemplazar captura de este paso<input key={slide} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file) setCapture(URL.createObjectURL(file)) }} /></label>}
    <p>1080 × 1350 px. El fondo usa las fotos originales de los nominados. Las capturas cargadas aquí se usan durante esta sesión.</p>
    <button className="admin-button primary" disabled={busy || !preview} onClick={() => { const a = document.createElement('a'); a.href = preview; a.download = `gorritos-${year}-carrusel-${slide}${slide === 5 && !capture ? '-pendiente' : ''}.png`; a.click() }}>Descargar PNG ↓</button>
    <button className="admin-button" disabled={busy} onClick={() => setRetry(r => r + 1)}>Volver a cargar imágenes</button>
    <p role="status">{warning || 'La descarga incluye la imagen de la vista previa.'}</p>
  </section><section className="studio-preview" aria-busy={busy}>{preview && <img src={preview} alt={`Carrusel · ${slides[slide][0]}`} style={{ opacity: busy ? .4 : 1 }} />}{busy && <span className="studio-loading">Preparando…</span>}</section><canvas hidden ref={canvas} /></div>
}
