export function youtubeId(value: string): string | null {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    let id: string | null = null
    if (host === 'youtu.be') id = url.pathname.split('/')[1]
    if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      id = url.searchParams.get('v')
      if (!id && /^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split('/')[2]
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null
  } catch { return null }
}

export async function checkVideoFile(file: File): Promise<void> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('No se pudo comprobar el video. Expórtalo en MP4 H.264/AAC o WebM.')), 20000)
      video.onloadeddata = () => { clearTimeout(timer); resolve() }
      video.onerror = () => { clearTimeout(timer); reject(new Error('Este archivo usa un formato o códec incompatible. Expórtalo en MP4 con video H.264 y audio AAC, o WebM, y vuelve a subirlo.')) }
      video.src = url
    })
  } finally {
    video.onloadeddata = null
    video.onerror = null
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}
