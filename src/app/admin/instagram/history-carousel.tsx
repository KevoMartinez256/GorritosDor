'use client'

import { useEffect, useRef, useState } from 'react'
import type { Category } from '@/lib/admin-types'

const winners = [
  { login: 'don_kevo_', name: 'don_kevo_', awards: 7 },
  { login: 'esmehsv', name: 'Esmehsv', awards: 3 },
  { login: 'luakatt_', name: 'luakatt_', awards: 2 },
  { login: 'elnaiti_', name: 'ElNaiti_', awards: 2 },
  { login: 'thekrisrules', name: 'TheKrisRules', awards: 2 },
  { login: 'phirio', name: 'Phirio', awards: 2 },
  { login: 'alfonsolucionez', name: 'AlfonSolucioneZ', awards: 2 },
]

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const image = new Image()
    const timeout = setTimeout(() => resolve(null), 15000)
    image.onload = () => { clearTimeout(timeout); resolve(image) }
    image.onerror = () => { clearTimeout(timeout); resolve(null) }
    image.src = source
  })
}

function text(context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, width = 940, serif = false) {
  do { context.font = `${size--}px ${serif ? 'Georgia' : 'Arial'}` }
  while (context.measureText(value).width > width && size > 12)
  context.fillText(value, x, y)
}

function portrait(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height)
  context.drawImage(image, x + (width - image.width * scale) / 2, y + (height - image.height * scale) / 2, image.width * scale, image.height * scale)
}

export default function HistoryCarousel({ categories, year }: { categories: Category[]; year: string }) {
  const [slide, setSlide] = useState(0)
  const [blur, setBlur] = useState(3)
  const [opacity, setOpacity] = useState(35)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(true)
  const [warning, setWarning] = useState('')
  const [retry, setRetry] = useState(0)
  const cache = useRef(new Map<string, HTMLImageElement>())

  useEffect(() => {
    let cancelled = false
    async function render() {
      setBusy(true)
      setWarning('')
      try {
        async function image(source: string) {
          if (cache.current.has(source)) return cache.current.get(source)!
          const loaded = await loadImage(source)
          if (loaded) cache.current.set(source, loaded)
          return loaded
        }
        const nominees = [...new Map(categories.flatMap(category => category.nominees).filter(nominee => nominee.avatar_url).map(nominee => [nominee.avatar_url, nominee])).values()]
        const [photos, faces, logo] = await Promise.all([
          Promise.all(nominees.map(nominee => image(nominee.avatar_url!.startsWith('/nominees/') ? nominee.avatar_url! : `/api/admin/portrait/${nominee.id}`))),
          Promise.all(winners.map(winner => image(`/nominees/2026/history/${winner.login}.png`))),
          image('/chaparritaspng.png'),
        ])
        if (cancelled) return
        const canvas = document.createElement('canvas')
        canvas.width = 1080
        canvas.height = 1350
        const context = canvas.getContext('2d')!
        context.fillStyle = '#061c24'
        context.fillRect(0, 0, 1080, 1350)
        const available = photos.filter((photo): photo is HTMLImageElement => !!photo)
        context.save()
        context.filter = `blur(${blur}px)`
        context.globalAlpha = opacity / 100
        for (let index = 0; index < 48 && available.length; index++) {
          const x = index % 6 * 196 - 60 + Math.floor(index / 6) % 2 * 35
          const y = Math.floor(index / 6) * 184 - 35
          context.save()
          context.beginPath()
          context.roundRect(x, y, 178, 164, 14)
          context.clip()
          portrait(context, available[index % available.length], x, y, 178, 164)
          context.restore()
        }
        context.restore()
        const shade = context.createLinearGradient(0, 0, 0, 1350)
        shade.addColorStop(0, '#061c2470')
        shade.addColorStop(.5, '#061c24cc')
        shade.addColorStop(1, '#061c24ef')
        context.fillStyle = shade
        context.fillRect(0, 0, 1080, 1350)
        context.strokeStyle = '#eed5a060'
        context.strokeRect(28, 28, 1024, 1294)
        if (logo) {
          const scale = Math.min(66 / logo.width, 84 / logo.height)
          context.drawImage(logo, 60, 55, logo.width * scale, logo.height * scale)
        }
        context.textAlign = 'center'
        context.fillStyle = '#eed5a0'
        text(context, 'Gorritos D’or', 540, 110, 66, 760, true)
        context.fillStyle = '#a9c7ca'
        text(context, `A W A R D S  /  ${year}`, 540, 153, 20)

        if (slide === 0) {
          context.fillStyle = '#78d7d1'
          text(context, 'LAS VOTACIONES SIGUEN ABIERTAS', 540, 490, 27)
          context.fillStyle = '#eed5a0'
          text(context, 'NO TE OLVIDES', 540, 625, 94, 940, true)
          text(context, 'DE VOTAR', 540, 750, 116, 940, true)
          context.fillStyle = '#f1f4ee'
          text(context, 'Tu elección también hace historia.', 540, 840, 32)
          context.fillStyle = '#eed5a0'
          text(context, '¿Quiénes tienen más Gorritos de Oro?', 540, 1020, 34, 940, true)
          text(context, 'Desliza y descubre el dato curioso →', 540, 1080, 27)
          context.fillStyle = '#a9c7ca'
          text(context, 'Vota hasta el 11 de diciembre · 19:00 h CDMX', 540, 1205, 23)
        } else {
          context.fillStyle = '#78d7d1'
          text(context, 'UN DATO CURIOSO', 540, 225, 23)
          context.fillStyle = '#eed5a0'
          text(context, 'Los más premiados', 540, 290, 64, 940, true)
          context.fillStyle = '#a9c7ca'
          text(context, 'Gorritos de Oro acumulados en ediciones anteriores', 540, 332, 23)
          // Each row is one award total. All five people in the base share the same total.
          const rows = [
            { indexes: [0], y: 365, width: 310, height: 260 },
            { indexes: [1], y: 645, width: 500, height: 220 },
            { indexes: [2, 3, 4, 5, 6], y: 885, width: 180, height: 235 },
          ]
          for (const row of rows) {
            const gap = 12
            const left = (1080 - row.indexes.length * row.width - (row.indexes.length - 1) * gap) / 2
            row.indexes.forEach((index, column) => {
              const winner = winners[index]
              const x = left + column * (row.width + gap)
              context.fillStyle = '#12313bee'
              context.beginPath()
              context.roundRect(x, row.y, row.width, row.height, 18)
              context.fill()
              context.strokeStyle = '#eed5a070'
              context.stroke()
              const size = row.indexes.length === 5 ? 100 : 112
              context.save()
              context.beginPath()
              context.arc(x + row.width / 2, row.y + 20 + size / 2, size / 2, 0, Math.PI * 2)
              context.clip()
              if (faces[index]) portrait(context, faces[index]!, x + (row.width - size) / 2, row.y + 20, size, size)
              else {
                context.fillStyle = '#eed5a0'
                text(context, winner.name.slice(0, 2).toUpperCase(), x + row.width / 2, row.y + 85, 38, size)
              }
              context.restore()
              context.fillStyle = '#f1f4ee'
              text(context, winner.name, x + row.width / 2, row.y + size + 50, 27, row.width - 16)
              context.fillStyle = '#eed5a0'
              text(context, `${winner.awards} Gorritos`, x + row.width / 2, row.y + row.height - 22, 30, row.width - 16, true)
            })
          }
          context.fillStyle = '#eed5a0'
          text(context, '¿Quién sumará otro este año? Tú eliges.', 540, 1190, 32, 940, true)
          context.fillStyle = '#f1f4ee'
          text(context, 'Las votaciones siguen abiertas.', 540, 1230, 24)
        }
        context.fillStyle = '#a9c7ca'
        text(context, 'gorritos-dor.vercel.app', 540, 1285, 25)
        setPreview(canvas.toDataURL('image/png'))
        if (photos.some(photo => !photo) || faces.some(face => !face) || !logo) setWarning('Algunas fotos no cargaron. Puedes volver a cargar las imágenes.')
      } catch {
        if (!cancelled) { setPreview(''); setWarning('No se pudo generar la imagen. Intenta de nuevo.') }
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    void render()
    return () => { cancelled = true }
  }, [categories, year, slide, blur, opacity, retry])

  return <div className="studio-grid"><section className="admin-panel studio-settings">
    <label>Imagen del carrusel<select value={slide} onChange={event => setSlide(Number(event.target.value))}><option value={0}>1 · No te olvides de votar</option><option value={1}>2 · Los más premiados</option></select></label>
    <label>Difuminado del fondo<input type="range" min={0} max={12} value={blur} onChange={event => setBlur(Number(event.target.value))} /></label>
    <label>Intensidad de las fotos<input type="range" min={10} max={80} value={opacity} onChange={event => setOpacity(Number(event.target.value))} /></label>
    <p>Publicación vertical · 1080 × 1350. Descarga las dos imágenes para publicarlas en orden.</p>
    <p>Historial proporcionado por la organización. don_kevo_ tiene 7, Esmehsv tiene 3 y luakatt_, ElNaiti_, TheKrisRules, Phirio y AlfonSolucioneZ tienen 2 cada uno.</p>
    <button className="admin-button primary" disabled={busy || !preview} onClick={() => {
      const link = document.createElement('a')
      link.href = preview
      link.download = `gorritos-${year}-recordatorio-${slide + 1}.png`
      link.click()
    }}>Descargar PNG ↓</button>
    <button className="admin-button" disabled={busy} onClick={() => { cache.current.clear(); setRetry(value => value + 1) }}>Volver a cargar imágenes</button>
    <p role="status">{warning || (busy ? 'Preparando imagen…' : '')}</p>
  </section><section className="studio-preview" aria-busy={busy}>{preview && <img src={preview} alt={slide === 0 ? 'Recordatorio de votación' : 'Pirámide histórica de Gorritos de Oro'} style={{opacity: busy ? .4 : 1}} />}</section></div>
}
