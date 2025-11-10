'use client'

import Link from 'next/link'
import { useChoices } from '@/hooks/useChoices'
import { useMemo } from 'react'

type Category = {
  id: string
  name: string
  position: number
  nominees?: { id: string }[]
}

export default function VoteMenuClient({
  editionId,
  slug,
  categories,
}: {
  editionId: string
  slug: string
  categories: Category[]
}) {
  const { choices } = useChoices(editionId)

  const total = categories.length
  const selectedCount = useMemo(
    () => categories.filter((c) => choices[c.id]).length,
    [choices, categories]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">
          Seleccionadas:{' '}
          <span className="font-semibold text-neutral-100">{selectedCount}</span> / {total}
        </div>

        <Link
          href={`/vote/${slug}/summary`}
          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600"
        >
          Ver resumen
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => {
          const hasChoice = Boolean(choices[c.id])
          return (
            <Link
              key={c.id}
              href={`/vote/${slug}/category/${c.id}`}
              className={`relative border rounded-2xl p-5 transition
                ${hasChoice
                  ? 'border-purple-500 bg-purple-900/20 hover:bg-purple-900/30'
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800'}`}
            >
              {/* Badge seleccionado */}
              {hasChoice && (
                <span className="absolute -top-2 -right-2 text-xs px-2 py-1 rounded-full bg-green-600">
                  ✓ Seleccionado
                </span>
              )}

              <div className="text-lg font-semibold">{c.name}</div>
              <div className="text-sm text-neutral-400 mt-2">
                {c.nominees?.length ? `${c.nominees.length} nominados` : 'Sin nominados'}
              </div>

              <div className="mt-4 text-sm underline text-purple-300">Entrar →</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
