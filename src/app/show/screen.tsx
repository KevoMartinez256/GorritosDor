'use client'
import { useEffect, useRef, useState } from 'react'
import { tally } from '@/lib/admin-types'
import type { ShowPayload } from '@/lib/show-types'
import Film from './media'
import { REVEAL_MS, revealPercentage } from './reveal'

export default function Screen() {
  const [payload, setPayload] = useState<ShowPayload | null>(null)
  const [ended, setEnded] = useState(-1)
  const [muted, setMuted] = useState(false)
  const [notice, setNotice] = useState('Conectando con la presentación…')
  const [offset, setOffset] = useState(0)
  const [revealClock, setRevealClock] = useState({ revision: -1, elapsed: 0 })
  const clockOffset = useRef(0)
  clockOffset.current = offset
  const revealRevision = payload?.mode === 'winner' ? payload.revision : -1
  const revealStart = payload?.startedAt
  useEffect(() => {
    if (revealRevision < 0) return
    const parsedStart = Date.parse(revealStart || '')
    const start = Number.isFinite(parsedStart) ? parsedStart : Date.now() + clockOffset.current - REVEAL_MS
    let frame: number
    function tick() {
      const elapsed = Math.max(0, Date.now() + clockOffset.current - start)
      setRevealClock({ revision: revealRevision, elapsed })
      if (elapsed < REVEAL_MS) frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [revealRevision, revealStart])
  useEffect(() => {
    const token = location.hash.slice(1)
    setMuted(new URLSearchParams(location.search).get('preview') === '1')
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let controller: AbortController
    async function poll() {
      controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const response = await fetch('/api/show', { headers: { 'X-Show-Token': token }, cache: 'no-store', signal: controller.signal })
        if (response.status === 403) {
          if (!stopped) { setPayload(null); setNotice('Este enlace ya no está disponible.') }
          return
        }
        if (!response.ok) throw new Error('offline')
        const data = await response.json()
        if (!stopped) { setPayload(data); setOffset(Date.parse(data.serverTime) - Date.now()); setNotice('') }
      } catch { /* Keep the last scene visible while reconnecting. */ }
      finally { clearTimeout(timeout); if (!stopped) timer = setTimeout(poll, 1000) }
    }
    void poll()
    return () => { stopped = true; clearTimeout(timer); controller?.abort() }
  }, [])
  const category = payload?.category
  const mode = payload?.mode === 'video' && ended === payload.revision ? 'idle' : payload?.mode
  const videoUrl = mode === 'idle' ? payload?.idleUrl : mode === 'video' ? payload?.videoUrl : ''
  const result = category ? tally(category, payload?.results?.counts ?? {}) : null
  const elapsed = revealClock.revision === payload?.revision ? revealClock.elapsed : 0
  const revealing = mode === 'winner' && elapsed < REVEAL_MS
  const revealed = mode === 'winner' && !revealing
  return <main className="show-screen">
    {notice && <div className="show-idle"><h1>Gorritos D’or</h1><p>{notice}</p></div>}
    {payload && videoUrl ? <Film key={`${payload.revision}-${mode}-${videoUrl}`} url={videoUrl} loop={mode === 'idle'} muted={muted || (payload.muted ?? false)} volume={payload.volume ?? 100} preview={muted} start={payload.startedAt} offset={offset} onFinish={() => { if (mode === 'video') setEnded(payload.revision) }} /> : payload && <>
      <header className="show-brand"><img src="/chaparritaspng.png" alt="Chaparritas" /><span>Gorritos D’or<small>AWARDS / 2026</small></span></header>
      {mode === 'idle' ? <div className="show-idle"><span className="show-kicker">LA COMUNIDAD ELIGE</span><h1>Gorritos D’or</h1><p>Una comunidad. Un año de momentos.</p><span className="show-spark">✦</span></div> : category && <section className={`show-content scene-${mode}`} key={`${payload.revision}-${mode}`}>
        <p className="show-kicker">{mode === 'category' ? 'EL TALENTO DE NUESTRA COMUNIDAD' : revealing ? '¿QUIÉN SE LLEVARÁ EL GORRITO?' : revealed ? !result?.total ? 'SIN RESULTADOS · SIN GANADOR' : result.leaders.length > 1 ? 'EMPATE' : payload.results?.closed ? 'EL GANADOR ES' : 'LÍDER PROVISIONAL' : 'TODO LISTO PARA LA REVELACIÓN'}</p>
        <h1>{category.name}</h1>
        {mode === 'category' ? <><p className="show-subtitle">Conoce a los nominados</p><div className="show-category-portraits">{category.nominees.map(n => <img key={n.id} src={n.avatar_url ?? '/chaparritaspng.png'} alt={n.display_name} style={{ objectFit: n.ext?.image_fit === 'contain' ? 'contain' : 'cover', objectPosition: n.ext?.image_position ?? 'center' }} />)}</div></> : <>
          <div className="show-cards">{category.nominees.map((n, index) => {
            const winner = revealed && result!.leaders.some(l => l.id === n.id)
            const percent = mode === 'winner' ? revealPercentage(elapsed, index, result!.percent(n.id)) : 0
            return <article key={n.id} className={`show-card ${winner ? 'is-winner' : revealed && result!.total ? 'is-runner' : ''}`}>
              <div className="show-photo"><img src={n.avatar_url ?? '/chaparritaspng.png'} alt="" style={{ objectFit: n.ext?.image_fit === 'contain' ? 'contain' : 'cover', objectPosition: n.ext?.image_position ?? 'center' }} />{winner && <span className="show-badge">✦ {result!.leaders.length > 1 ? 'EMPATE' : payload.results?.closed ? 'GANADOR' : 'LÍDER'}</span>}</div>
              <h2>{n.display_name}</h2><strong className="show-percent">{percent.toFixed(1)}<small>%</small></strong><div className="show-bar"><span style={{ width: `${percent}%` }} /></div>
            </article>
          })}</div>
          <footer className="show-foot"><span>{revealing ? 'Revelando resultados…' : revealed ? 'La comunidad ha elegido' : 'Porcentajes pendientes de revelar'}</span><span>{payload.results?.closed ? 'Votación cerrada' : 'Resultados provisionales · votación abierta'}</span></footer>
        </>}
      </section>}
    </>}
  </main>
}
