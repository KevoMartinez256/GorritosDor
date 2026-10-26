'use client'

import Link from 'next/link'
import { useChoices } from '@/hooks/useChoices'

type Nominee = {
  id: string
  display_name: string
  avatar_url: string | null
  twitch_login?: string | null
  ext?: { platform?: string | null; channel_url?: string | null; position?: number; image_fit?: 'contain' | 'cover'; image_position?: string }
}
type Category = { id: string; name: string; position: number; nominees: Nominee[] }

export default function CategoryClient({ editionId, slug, category }: { editionId: string; slug: string; category: Category }) {
  const { choices, setChoice, clearChoice } = useChoices(editionId)
  const nominees = [...(category.nominees ?? [])].sort((a, b) => (a.ext?.position ?? 0) - (b.ext?.position ?? 0))
  const selected = nominees.find(n => n.id === choices[category.id])
  const platforms: Record<string, string> = { twitch: 'Twitch', youtube: 'YouTube', kick: 'Kick', tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', x: 'X', twitter: 'X' }

  return (
    <>
      <div className="nominee-grid">
        {nominees.map((nominee, index) => {
          const isSelected = selected?.id === nominee.id
          const rawUrl = nominee.ext?.channel_url || (nominee.twitch_login ? `https://www.twitch.tv/${nominee.twitch_login}` : null)
          let externalUrl: string | null = null
          try {
            if (rawUrl) {
              const url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`)
              if (['http:', 'https:'].includes(url.protocol)) externalUrl = url.href
            }
          } catch {}
          const platform = nominee.ext?.platform || (nominee.twitch_login ? 'twitch' : '')
          const label = externalUrl && /(clips\.twitch\.tv\/|twitch\.tv\/[^\s]+\/clip\/)/i.test(externalUrl) ? 'Ver clip' : `Ver ${platforms[platform.toLowerCase()] ?? 'canal'}`
          return (
            <article key={nominee.id} className={`nominee-card ${isSelected ? 'is-selected' : ''}`}>
              <div className={`nominee-image ${nominee.ext?.image_fit === 'contain' ? 'nominee-logo-image' : ''}`}>
                <img style={{ objectPosition: nominee.ext?.image_position ?? 'center' }} src={nominee.avatar_url || '/nominee-placeholder.svg'} alt={nominee.display_name} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/nominee-placeholder.svg' }} />
                <span className="nominee-number">{String(index + 1).padStart(2, '0')}</span>
                {isSelected && <span className="nominee-badge">✓ TU ELECCIÓN</span>}
              </div>
              <div className="nominee-body">
                <p className="nominee-eyebrow">NOMINADO / {slug}</p>
                <h2>{nominee.display_name}</h2>
                <div className="nominee-buttons">
                  <button type="button" className="gala-button gala-primary" aria-pressed={isSelected} aria-label={`Seleccionar a ${nominee.display_name}`} onClick={() => setChoice(category.id, nominee.id)}>
                    {isSelected ? 'Seleccionado' : 'Seleccionar'} <span aria-hidden="true">{isSelected ? '✓' : '+'}</span>
                  </button>
                  {externalUrl && <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="gala-button gala-channel">{label} <span aria-hidden="true">↗</span></a>}
                </div>
              </div>
            </article>
          )
        })}
        {Array.from({ length: Math.max(0, 4 - nominees.length) }, (_, i) => (
          <article className="nominee-card nominee-pending" key={`pending-${i}`}>
            <div className="nominee-image"><div className="nominee-pending-art" aria-hidden="true"><span>✧</span><span>EL ESCENARIO TE ESPERA</span></div><span className="nominee-number">{String(nominees.length + i + 1).padStart(2, '0')}</span></div>
            <div className="nominee-body"><p className="nominee-eyebrow">POR ANUNCIAR</p><h2>Próximo nominado</h2><p className="nominee-pending-note">Pronto conocerás quién ocupa este lugar.</p></div>
          </article>
        ))}
      </div>
      <section className="nominee-selection" aria-label="Tu selección en esta categoría">
        <div className="nominee-selection-text" role="status" aria-live="polite">
          <span className={`nominee-selection-symbol ${selected ? 'has-selection' : ''}`} aria-hidden="true">{selected ? '✓' : '✧'}</span>
          <div><p>{selected ? <>Tu elección: <strong>{selected.display_name}</strong></> : '¿Quién se lleva tu reconocimiento?'}</p><span>{selected ? 'Selección guardada. Revisa el resumen para enviar tu voto.' : 'Elige un nominado o continúa explorando las categorías.'}</span></div>
        </div>
        <div className="nominee-selection-actions">
          {selected && <button type="button" onClick={() => clearChoice(category.id)} className="gala-button gala-secondary">Quitar selección</button>}
          <Link href={`/vote/${slug}/summary`} className="gala-button gala-primary">Ver resumen <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </>
  )
}


