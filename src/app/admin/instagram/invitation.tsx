'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Category } from '@/lib/admin-types'
import { invitationPeople } from '@/lib/invitation-people'

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const image = new Image()
    const timeout = setTimeout(() => resolve(null), 15000)
    image.onload = () => { clearTimeout(timeout); resolve(image) }
    image.onerror = () => { clearTimeout(timeout); resolve(null) }
    image.src = source
  })
}

function drawText(context: CanvasRenderingContext2D, text: string, y: number, size: number, serif = false) {
  do {
    context.font = `${size--}px ${serif ? 'Georgia' : 'Arial'}`
  } while (context.measureText(text).width > 910 && size > 16)
  context.fillText(text, 540, y)
}

export default function Invitation({ categories, year }: { categories: Category[]; year: string }) {
  const people = useMemo(() => invitationPeople(categories), [categories])
  const [customPhoto, setCustomPhoto] = useState('')
  const [selectedId, setSelectedId] = useState(people[0]?.nominee.id || '')
  const selected = people.find(person => person.nominee.id === selectedId)
  const [selectedCategories, setSelectedCategories] = useState(people[0]?.categories || [])
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(true)
  const [warning, setWarning] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function render() {
      setBusy(true)
      setPreview('')
      setWarning('')
      try {
        if (!selected || !selectedCategories.length) {
          setWarning('Selecciona al menos una categoría.')
          return
        }
        const nominee = selected.nominee
        const source = customPhoto || (selected.profileUrl
          ? `/api/admin/invitation-portrait?id=${encodeURIComponent(nominee.id)}`
          : nominee.avatar_url?.startsWith('/nominees/') ? nominee.avatar_url : `/api/admin/portrait/${nominee.id}`)
        const [photo, logo] = await Promise.all([loadImage(source), loadImage('/chaparritaspng.png')])
        if (cancelled) return
        const canvas = document.createElement('canvas')
        canvas.width = 1080
        canvas.height = 1350
        const context = canvas.getContext('2d')!
        const background = context.createLinearGradient(0, 0, 1080, 1350)
        background.addColorStop(0, '#143f47')
        background.addColorStop(0.6, '#061c24')
        background.addColorStop(1, '#15343b')
        context.fillStyle = background
        context.fillRect(0, 0, 1080, 1350)
        context.strokeStyle = '#eed5a060'
        context.strokeRect(28, 28, 1024, 1294)
        if (logo) {
          const scale = Math.min(70 / logo.width, 90 / logo.height)
          context.drawImage(logo, 62, 52, logo.width * scale, logo.height * scale)
        }
        context.textAlign = 'center'
        context.fillStyle = '#eed5a0'
        drawText(context, 'Gorritos D’or', 114, 68, true)
        context.fillStyle = '#a9c7ca'
        drawText(context, `A W A R D S  /  ${year}`, 154, 19)
        context.fillStyle = '#eed5a0'
        drawText(context, 'Hola, nominado', 238, 55, true)

        context.save()
        context.beginPath()
        context.roundRect(340, 275, 400, 400, 28)
        context.clip()
        context.fillStyle = '#25434b'
        context.fillRect(340, 275, 400, 400)
        if (photo) {
          const scale = nominee.ext?.image_fit === 'contain' ? Math.min(400 / photo.width, 400 / photo.height) : Math.max(400 / photo.width, 400 / photo.height)
          context.drawImage(photo, 540 - photo.width * scale / 2, 475 - photo.height * scale / 2, photo.width * scale, photo.height * scale)
        } else {
          context.fillStyle = '#eed5a0'
          drawText(context, nominee.display_name.slice(0, 2).toUpperCase(), 500, 96, true)
        }
        context.restore()
        context.fillStyle = '#f1f4ee'
        drawText(context, nominee.display_name, 730, 42)
        context.fillStyle = '#78d7d1'
        drawText(context, 'Has sido nominado a', 790, 27)
        const names = categories.filter(category => selectedCategories.includes(category.id)).map(category => category.name)
        const lineHeight = Math.min(43, 220 / names.length)
        context.fillStyle = '#eed5a0'
        names.forEach((name, index) => drawText(context, name, 825 + index * lineHeight, Math.min(31, lineHeight - 3), true))
        context.fillStyle = '#f1f4ee'
        drawText(context, 'Te esperamos para la gala en vivo en Minecraft', 1100, 29)
        context.fillStyle = '#eed5a0'
        drawText(context, 'SÁBADO 12 DE DICIEMBRE DE 2026', 1154, 32)
        drawText(context, '19:00 h · Hora de Ciudad de México', 1198, 28)
        context.fillStyle = '#a9c7ca'
        drawText(context, 'El modpack se compartirá unos días antes del evento.', 1270, 21)
        setPreview(canvas.toDataURL('image/png'))
        if (!photo || !logo) setWarning('No se pudo obtener alguna imagen. Si la red social bloquea la foto, puedes cargarla abajo. Se muestran iniciales mientras tanto.')
      } catch {
        if (!cancelled) setWarning('No se pudo generar la invitación. Intenta de nuevo.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    void render()
    return () => { cancelled = true }
  }, [selected, selectedCategories, categories, year, retry, customPhoto])

  return <div className="studio-grid">
    <section className="admin-panel studio-settings">
      <label>Nominado<select value={selectedId} onChange={event => {
        setSelectedId(event.target.value)
        setCustomPhoto('')
        setSelectedCategories(people.find(person => person.nominee.id === event.target.value)?.categories || [])
      }}>{people.map(person => <option key={person.nominee.id} value={person.nominee.id}>{person.nominee.display_name}</option>)}</select></label>
      <fieldset><legend>Categorías de la invitación</legend>
        <p>Incluye automáticamente sus nominaciones y los proyectos o clips donde aparece como responsable.</p>
        {categories.map(category => <label key={category.id} style={{display:'flex', gap:10, alignItems:'center', marginBottom:10}}><input type="checkbox" style={{width:'auto'}} checked={selectedCategories.includes(category.id)} onChange={event => setSelectedCategories(current => event.target.checked ? [...current, category.id] : current.filter(id => id !== category.id))} />{category.name}</label>)}
      </fieldset>
      <p>Publicación vertical · 1080 × 1350</p>
      {selected?.profileUrl && <a href={selected.profileUrl} target="_blank" rel="noreferrer">Ver perfil del responsable ↗</a>}
      <label>Foto alternativa<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
        const file = event.target.files?.[0]
        if (!file) return
        if (file.size > 8 * 1024 * 1024) { setWarning('La foto debe pesar menos de 8 MB.'); return }
        const reader = new FileReader()
        reader.onload = () => setCustomPhoto(String(reader.result))
        reader.readAsDataURL(file)
      }} /></label>
      {preview && !busy && <a className="admin-button primary" href={preview} download={`invitacion-${selected?.nominee.display_name.replace(/[^a-zA-Z0-9_-]/g, '-')}-${year}.png`}>Descargar PNG ↓</a>}
      <button className="admin-button" disabled={busy} onClick={() => setRetry(value => value + 1)}>Volver a cargar imágenes</button>
      <p role="status">{busy ? 'Preparando invitación…' : warning}</p>
    </section>
    <section className="studio-preview" aria-label="Vista previa de la invitación" aria-busy={busy}>{preview && <img src={preview} alt={`Invitación para ${selected?.nominee.display_name}`} />}</section>
  </div>
}
