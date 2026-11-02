'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Category } from '@/lib/admin-types'
import type { ShowConfig, ShowMode, ShowState } from '@/lib/show-types'

export default function Control({ categories }: { categories: Category[] }) {
  const [state, setState] = useState<ShowState | null>(null)
  const [config, setConfig] = useState<ShowConfig>({ idle: '', videos: {} })
  const [index, setIndex] = useState(0)
  const [origin, setOrigin] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Cargando el control…')
  const [rotateConfirmed, setRotateConfirmed] = useState(false)
  const [winnerConfirmed, setWinnerConfirmed] = useState(false)
  const category = categories[index]
  const link = state && origin ? `${origin}/show#${state.token}` : ''
  const dirty = !!state && JSON.stringify(config) !== JSON.stringify(state.config)
  async function refresh() {
    const res = await fetch('/api/admin/show', { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setState(data)
    setConfig(data.config)
    return data as ShowState
  }
  useEffect(() => {
    setOrigin(location.origin)
    void refresh().then(() => setMessage('Control conectado. La vista previa está silenciada.')).catch(e => setMessage(e.message))
  }, [])
  async function command(body: Record<string, unknown>) {
    if (!state) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/show', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, revision: state.revision }) })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) await refresh()
        throw new Error(data.error)
      }
      setState(data)
      if (body.action === 'config') setConfig(data.config)
      setMessage(body.action === 'scene' ? 'Escena enviada a OBS.' : 'Cambios guardados.')
      setWinnerConfirmed(false)
      setRotateConfirmed(false)
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo enviar. Actualiza el control para comprobar el estado.') }
    finally { setBusy(false) }
  }
  function scene(mode: ShowMode, newSnapshot = false) { void command({ action: 'scene', mode, categoryId: category.id, newSnapshot }) }
  async function upload(file: File, target: 'idle' | 'category') {
    const categoryId = category.id
    setBusy(true)
    setMessage('Subiendo video… Mantén esta página abierta.')
    try {
      const res = await fetch('/api/admin/show/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: file.type, size: file.size }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
      const { error } = await db.storage.from('awards-media').uploadToSignedUrl(data.path, data.token, file, { contentType: file.type })
      if (error) throw new Error('La carga falló. Reintenta o pega un enlace HTTPS directo.')
      setConfig(current => target === 'idle' ? { ...current, idle: data.url } : { ...current, videos: { ...current.videos, [categoryId]: data.url } })
      setMessage('Video cargado. Pulsa «Guardar videos» para usarlo en la presentación.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo subir el video') }
    finally { setBusy(false) }
  }
  if (!category) return <p>No hay categorías disponibles.</p>
  return <><p className="admin-eyebrow">04 / DIRECCIÓN DE LA GALA</p><h1>El escenario,<br /><em>a tu ritmo.</em></h1>
    <p role="status" className="admin-panel">{message}</p>
    <div className="studio-grid"><section className="admin-panel studio-settings">
      <h2>Control de escenas</h2><label>Categoría<select disabled={busy} value={index} onChange={e => { setIndex(Number(e.target.value)); setWinnerConfirmed(false) }}>{categories.map((c, i) => <option value={i} key={c.id}>{String(i + 1).padStart(2, '0')} · {c.name}</option>)}</select></label>
      <p>La selección prepara la categoría. Los botones la muestran en OBS.</p>
      <button className="admin-button" disabled={busy || !state} onClick={() => scene('idle')}>01 · Idle / espera</button>
      <button className="admin-button" disabled={busy || !state} onClick={() => scene('category')}>02 · Mostrar categoría</button>
      <button className="admin-button" disabled={busy || !state?.config.videos[category.id] || dirty} onClick={() => scene('video')}>03 · Reproducir nominados desde el inicio</button>
      <p>Al terminar el video, la pantalla vuelve al idle automáticamente.</p>
      <button className="admin-button primary" disabled={busy || !state} onClick={() => scene('results')}>04 · Mostrar porcentajes</button>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input style={{ width: 'auto' }} type="checkbox" checked={winnerConfirmed} onChange={e => setWinnerConfirmed(e.target.checked)} />Listo para revelar {category.name}</label>
      <button className="admin-button primary" disabled={busy || !state || !winnerConfirmed} onClick={() => scene('winner')}>05 · Revelar ganador</button>
      <p>Porcentajes y ganador usan el mismo corte. Con la votación abierta se indica líder provisional. Los empates se muestran juntos.</p>
      <button className="admin-button" disabled={busy || !state} onClick={() => { if (confirm('¿Tomar un nuevo corte de votos y mostrarlo ahora en OBS?')) scene('results', true) }}>Tomar nuevo corte y mostrar porcentajes</button>
      <button className="admin-button" disabled={busy} onClick={() => { if (!dirty || confirm('¿Descartar los enlaces sin guardar y actualizar el control?')) void refresh().then(() => setMessage('Control actualizado.')).catch(e => setMessage(e.message)) }}>Actualizar control</button>
    </section><section className="admin-panel">
      <h2>Vista previa · audio silenciado</h2>
      {link && <iframe title="Vista previa OBS" src={`${origin}/show?preview=1#${state!.token}`} style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 16 }} allow="autoplay; fullscreen" />}
      <p>Última orden enviada: <strong>{state?.payload.mode ?? '—'}</strong>{state?.payload.category ? ` · ${state.payload.category.name}` : ''}</p>
      <h2>Enlace privado para OBS</h2>
      <p>Agrega una fuente «Navegador» de 1920 × 1080 y pega este enlace. Activa «Controlar audio mediante OBS» para mezclar el sonido. Usa MP4 H.264/AAC o WebM compatible con tu navegador.</p>
      <input aria-label="Enlace OBS" readOnly value={link} style={{ width: '100%', padding: 12 }} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '18px 0' }}><button className="admin-button" disabled={!link} onClick={() => void navigator.clipboard.writeText(link).then(() => setMessage('Enlace copiado. Compártelo con quien maneje OBS.')).catch(() => setMessage('Selecciona y copia el enlace del campo.'))}>Copiar enlace</button><a className="admin-button" href={link || undefined} target="_blank" rel="noreferrer">Abrir pantalla ↗</a></div>
      <p>Quien tenga el enlace podrá ver la escena proyectada. En un navegador normal puede ser necesario pulsar «Activar reproducción y audio».</p>
      <label><input type="checkbox" checked={rotateConfirmed} onChange={e => setRotateConfirmed(e.target.checked)} /> Quiero invalidar el enlace anterior</label><button className="admin-button" disabled={busy || !state || !rotateConfirmed} onClick={() => void command({ action: 'rotate' })}>Generar nuevo enlace</button>
    </section></div>
    <section className="admin-panel studio-settings" style={{ marginTop: 24 }}><h2>Videos de la premiación</h2><p>Sube MP4 o WebM de hasta 50 MB, o pega la URL HTTPS directa del archivo. Para videos mayores puedes alojarlos externamente. Guarda antes de reproducir.</p>
      <label>Idle general<input disabled={busy} value={config.idle} placeholder="https://…/idle.mp4" onChange={e => setConfig({ ...config, idle: e.target.value })} /></label><input aria-label="Subir idle" type="file" accept="video/mp4,video/webm" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file, 'idle'); e.target.value = '' }} />
      <label>Video de {category.name}<input disabled={busy} value={config.videos[category.id] ?? ''} placeholder="https://…/nominados.mp4" onChange={e => setConfig({ ...config, videos: { ...config.videos, [category.id]: e.target.value } })} /></label><input aria-label="Subir video de nominados" type="file" accept="video/mp4,video/webm" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file, 'category'); e.target.value = '' }} />
      <button className="admin-button primary" disabled={busy || !state || !dirty} onClick={() => void command({ action: 'config', config })}>Guardar videos{dirty ? ' · cambios pendientes' : ''}</button>
      <p>Videos configurados: {categories.filter(c => config.videos[c.id]).length} / {categories.length}. Si todavía no tienes idle, aparece la portada animada de los premios.</p>
    </section></>
}
