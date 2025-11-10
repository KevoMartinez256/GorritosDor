'use client'
import { useEffect, useState } from 'react'

type Choices = Record<string, string> // { [categoryId]: nomineeId }

const keyFor = (editionId: string) => `gorritos:choices:${editionId}`

export function useChoices(editionId: string) {
  const [choices, setChoices] = useState<Choices>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(editionId))
      if (raw) setChoices(JSON.parse(raw))
    } catch {}
  }, [editionId])

  const persist = (next: Choices) => {
    setChoices(next)
    try { localStorage.setItem(keyFor(editionId), JSON.stringify(next)) } catch {}
  }

  const setChoice = (categoryId: string, nomineeId: string) =>
    persist({ ...choices, [categoryId]: nomineeId })

  const clearChoice = (categoryId: string) => {
    const n = { ...choices }
    delete n[categoryId]
    persist(n)
  }

  const clearAll = () => persist({})

  return { choices, setChoice, clearChoice, clearAll }
}
