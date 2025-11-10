'use client'
import Link from 'next/link'
import { useChoices } from '@/hooks/useChoices'
import { useMemo, useState } from 'react'

type Nominee = { id: string; display_name: string; avatar_url: string | null }
type Category = { id: string; name: string; nominees: Nominee[] }

export default function SummaryClient({
  editionId,
  slug,
  categories,
}: {
  editionId: string
  slug: string
  categories: Category[]
}) {
  const { choices, clearAll } = useChoices(editionId)
  const [busy, setBusy] = useState(false)

  const chosenCats = useMemo(
    () => categories.filter((c) => choices[c.id]),
    [categories, choices]
  )

  const submitAll = async () => {
    if (!chosenCats.length) return
    setBusy(true)
    try {
      for (const c of chosenCats) {
        const nomineeId = choices[c.id]
        const res = await fetch('/vote/api/vote', {
          method: 'POST',
          body: JSON.stringify({ editionId, categoryId: c.id, nomineeId }),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          alert(`Error en ${c.name}: ${e.error ?? res.statusText}`)
          setBusy(false)
          return
        }
      }
      alert('¡Votos enviados!')
      clearAll()
    } finally {
      setBusy(false)
    }
  }

  if (!chosenCats.length) {
    return (
      <div className="space-y-4">
        <div className="text-neutral-400">
          No tienes selecciones aún. Ve al{' '}
          <Link className="underline" href={`/vote/${slug}`}>
            menú de categorías
          </Link>{' '}
          y elige algunas.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Grid de tarjetas tipo “seleccionado” */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {chosenCats.map((c) => {
          const n = c.nominees.find((nm) => nm.id === choices[c.id])
          return (
            <div
              key={c.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-purple-500 bg-neutral-900"
            >
              {/* Poster con alto consistente */}
              <div className="aspect-[4/5] w-full overflow-hidden">
                <img
                  src={n?.avatar_url ?? '/placeholder.png'}
                  alt={n?.display_name ?? ''}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Contenido */}
              <div className="flex min-h-28 flex-col p-4">
                <div className="text-sm text-neutral-400 leading-tight truncate" title={c.name}>
                  {c.name}
                </div>
                <div className="text-base font-semibold truncate" title={n?.display_name}>
                  {n?.display_name}
                </div>

                <div className="mt-auto flex items-center">
                  <Link
                    href={`/vote/${slug}/category/${c.id}`}
                    className="w-full rounded-xl px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-center"
                  >
                    Cambiar
                  </Link>
                </div>
              </div>

              {/* Marca visual */}
              <div className="pointer-events-none absolute inset-0 ring-2 ring-purple-500/70 rounded-2xl" />
            </div>
          )
        })}
      </div>

      {/* Acciones inferiores */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={submitAll}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50"
        >
          {busy ? 'Enviando…' : `Enviar ${chosenCats.length} voto(s)`}
        </button>
        <Link
          href={`/vote/${slug}`}
          className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700"
        >
          Regresar al menú
        </Link>
      </div>
    </div>
  )
}
