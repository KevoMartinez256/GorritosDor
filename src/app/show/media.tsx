'use client'
import { useEffect, useRef, useState } from 'react'
import { youtubeId } from '@/lib/show-media'

type Props = { url: string; loop: boolean; muted: boolean; volume: number; preview: boolean; start?: string; offset: number; onFinish: () => void }
type Player = { playVideo(): void; mute(): void; unMute(): void; setVolume(volume: number): void; seekTo(seconds: number, allowSeekAhead: boolean): void; destroy(): void }
type YouTube = { Player: new (node: HTMLElement, options: { videoId: string; width: string; height: string; playerVars: Record<string, string | number>; events: { onReady(event: { target: Player }): void; onStateChange(event: { data: number; target: Player }): void; onError(event: { data: number }): void; onAutoplayBlocked(): void } }) => Player }
declare global { interface Window { YT?: YouTube; onYouTubeIframeAPIReady?: () => void } }
let youtubeReady: Promise<YouTube> | null = null
function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!youtubeReady) youtubeReady = new Promise<YouTube>((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = setTimeout(() => { youtubeReady = null; script.remove(); reject(new Error('YouTube no respondió. Comprueba la conexión.')) }, 20000)
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timeout); resolve(window.YT!) }
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => { clearTimeout(timeout); youtubeReady = null; script.remove(); reject(new Error('No se pudo conectar con YouTube.')) }
    document.head.appendChild(script)
  })
  return youtubeReady
}

function Failure({ message, preview, retry }: { message: string; preview: boolean; retry: () => void }) {
  return <div className="show-idle"><h1>Gorritos D’or</h1><p>{preview ? message : 'Continuamos en un momento'}</p>{preview && <button onClick={retry}>Reintentar video</button>}</div>
}

function YouTubeFilm(props: Props & { id: string }) {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<Player | null>(null)
  const latest = useRef(props)
  latest.current = props
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!player.current) return
    player.current.setVolume(props.volume)
    if (props.muted) player.current.mute()
    else player.current.unMute()
  }, [props.volume, props.muted])
  useEffect(() => {
    let stopped = false
    let current: Player | null = null
    setError('')
    setBlocked(false)
    loadYouTube().then(YT => {
      if (stopped || !host.current) return
      const node = document.createElement('div')
      host.current.replaceChildren(node)
      current = new YT.Player(node, {
        videoId: props.id, width: '100%', height: '100%',
        playerVars: { autoplay: 1, playsinline: 1, controls: 0, rel: 0, origin: location.origin, loop: props.loop ? 1 : 0, playlist: props.loop ? props.id : '', start: !props.loop && props.start ? Math.floor(Math.max(0, (Date.now() + latest.current.offset - Date.parse(props.start)) / 1000)) : 0 },
        events: {
          onReady: ({ target }) => { if (stopped) return; player.current = target; target.setVolume(latest.current.volume); if (latest.current.muted) target.mute(); else target.unMute(); target.playVideo() },
          onStateChange: ({ data, target }) => { if (stopped) return; if (data === 1) setBlocked(false); if (data === 0) { if (props.loop) { target.seekTo(0, true); target.playVideo() } else latest.current.onFinish() } },
          onError: ({ data }) => { if (!stopped) setError(data === 101 || data === 150 ? 'Este video de YouTube no permite reproducción en otras páginas.' : data === 100 ? 'El video de YouTube es privado o ya no está disponible.' : `YouTube no pudo reproducir el video (código ${data}).`) },
          onAutoplayBlocked: () => { if (!stopped) setBlocked(true) },
        },
      })
    }).catch(e => { if (!stopped) setError(e.message) })
    return () => { stopped = true; current?.destroy(); player.current = null }
  }, [props.id, props.loop, props.start, retry])
  return <><div ref={host} className="show-youtube" style={{ visibility: error ? 'hidden' : 'visible' }} />{error && <Failure message={error} preview={props.preview} retry={() => setRetry(n => n + 1)} />}{blocked && <button className="show-play" onClick={() => { if (!props.muted) player.current?.unMute(); player.current?.playVideo() }}>Activar reproducción y audio ▶</button>}</>
}

function DirectFilm({ url, loop, muted, volume, preview, start, offset, onFinish }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [blocked, setBlocked] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => { if (ref.current) ref.current.volume = volume / 100 }, [volume, retry, error])
  async function play() {
    try { await ref.current?.play(); setBlocked(false) } catch (e) {
      if (e instanceof DOMException && e.name === 'NotAllowedError') setBlocked(true)
    }
  }
  return <>{error ? <Failure message={error} preview={preview} retry={() => { setError(''); setRetry(n => n + 1) }} /> : <video key={retry} ref={ref} src={url} autoPlay muted={muted} loop={loop} playsInline preload="auto" onError={() => {
    const code = ref.current?.error?.code
    setError(code === 3 || code === 4 ? 'Formato o códec incompatible. Usa MP4 H.264/AAC o WebM; también comprueba que el enlace apunte al archivo.' : 'No se pudo descargar el video. Comprueba el enlace y la conexión.')
  }} onLoadedMetadata={() => {
    const video = ref.current!
    video.volume = volume / 100
    if (!loop && start && Number.isFinite(video.duration)) {
      const elapsed = Math.max(0, (Date.now() + offset - Date.parse(start)) / 1000)
      if (elapsed >= video.duration) { onFinish(); return }
      video.currentTime = elapsed
    }
    void play()
  }} onEnded={onFinish} />}{blocked && !error && <button className="show-play" onClick={() => void play()}>Activar reproducción y audio ▶</button>}</>
}

export default function Film(props: Props) {
  const id = youtubeId(props.url)
  return id ? <YouTubeFilm {...props} id={id} /> : <DirectFilm {...props} />
}
