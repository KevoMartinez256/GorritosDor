'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useChoices } from '@/hooks/useChoices'
import { useMemo } from 'react'

type Nominee = {
  id: string
  display_name: string
  avatar_url: string | null
  twitch_login?: string | null
  // Campo extensible para otras plataformas (se mapea desde JSONB ext en la BD)
  ext?: {
    platform?: string | null
    channel_url?: string | null
    // Se pueden agregar otros campos en el futuro sin romper el tipo
    [key: string]: any
  }
}

type Category = {
  id: string
  name: string
  position: number
  nominees: Nominee[]
}

export default function CategoryClient({
  editionId,
  slug,
  category,
}: {
  editionId: string
  slug: string
  category: Category
}) {
  const router = useRouter()
  const { choices, setChoice, clearChoice } = useChoices(editionId)
  const selected = choices[category.id]
  const count = useMemo(() => category.nominees?.length ?? 0, [category.nominees])

  const onVote = (nomineeId: string) => setChoice(category.id, nomineeId)

  // Asegurar siempre 4 slots (relleno con placeholders si faltan)
  const nominees = category.nominees || []
  const placeholdersNeeded = Math.max(0, 4 - nominees.length)
  const placeholderArray = Array.from({ length: placeholdersNeeded })

  return (
    <div className="space-y-8">
      {/* Grid 4 columnas en desktop */}
      {count > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {nominees.map((n) => {
            // URL primaria: primero ext.channel_url, luego fallback a twitch_login
            const rawUrl = n.ext?.channel_url || (n.twitch_login ? `https://twitch.tv/${n.twitch_login}` : null)

            const normalizeExternalUrl = (url: string) => {
              if (!url) return url
              // Añade protocolo si falta
              if (!/^https?:\/\//i.test(url)) return `https://${url}`
              return url
            }

            const externalUrl = rawUrl ? normalizeExternalUrl(rawUrl) : null
            const platform = (n.ext?.platform || (n.twitch_login ? 'twitch' : null))?.toLowerCase() || null
            const platformLabelMap: Record<string, string> = {
              twitch: 'Twitch',
              youtube: 'YouTube',
              tiktok: 'TikTok',
              kick: 'Kick',
              instagram: 'Instagram',
              facebook: 'Facebook',
              x: 'X',
              twitter: 'X',
            }
            // Si el enlace es un clip de Twitch, prioriza la etiqueta 'Ver clip'
            const isTwitchClip = externalUrl ? /(clips\.twitch\.tv\/|twitch\.tv\/[^\s]+\/clip\/)/i.test(externalUrl) : false
            const buttonText = isTwitchClip
              ? 'Ver clip'
              : platform
                ? `Ver ${platformLabelMap[platform] ?? 'canal'}`
                : 'Ver canal'
            const isSel = selected === n.id

            return (
              <div
                key={n.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border
                  ${isSel ? 'border-purple-500' : 'border-neutral-800'}
                  bg-neutral-900 hover:bg-neutral-800 transition`}
              >
                {/* Poster con alto consistente */}
                <div className="aspect-[4/5] w-full overflow-hidden">
                  <img
                    src={n.avatar_url ?? '/placeholder.png'}
                    alt={n.display_name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Contenido: empuja acciones al fondo para igualar alturas */}
                <div className="flex min-h-28 flex-col p-4">
                  <div
                    className="text-base font-semibold leading-tight truncate"
                    title={n.display_name}
                  >
                    {n.display_name}
                  </div>

                  <div className="mt-auto flex items-center gap-2">
                    <button
                      onClick={() => onVote(n.id)}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium tracking-wide
                        ${isSel
                          ? 'bg-purple-600 hover:bg-purple-500'
                          : 'bg-neutral-800 hover:bg-neutral-700'}`}
                    >
                      {isSel ? 'VOTADO' : 'VOTAR'}
                    </button>

                    {externalUrl && (
                      <Link
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap rounded-xl px-3 py-2 text-sm bg-purple-700 hover:bg-purple-600"
                      >
                        {buttonText}
                      </Link>
                    )}
                  </div>
                </div>

                {isSel && <div className="pointer-events-none absolute inset-0 ring-2 ring-purple-500/70 rounded-2xl" />}
              </div>
            )
          })}
          {placeholderArray.map((_, i) => (
            <div
              key={`ph-${i}`}
              className="flex flex-col rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/40 backdrop-blur-sm p-4 items-center justify-center text-neutral-600 text-sm"
            >
              Próximo nominado
            </div>
          ))}
        </div>
      ) : (
        <div className="text-neutral-400">Sin nominados aún.</div>
      )}

      {/* Acciones inferiores */}
      <div className="flex items-center gap-3 pt-2 flex-wrap">
        {selected && (
          <button
            onClick={() => clearChoice(category.id)}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700"
          >
            Quitar selección
          </button>
        )}

        <button
          onClick={() => router.push(`/vote/${slug}/summary`)}
          disabled={!selected}
          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-50"
        >
          Ver resumen
        </button>

        <span className="text-sm text-neutral-400">
          (Puedes regresar al menú y seguir con otras categorías)
        </span>
      </div>
    </div>
  )
}
