import type { Category, Results } from './admin-types'

export type ShowMode = 'idle' | 'category' | 'video' | 'results' | 'winner'
export type ShowConfig = { idle: string; videos: Record<string, string>; volume?: number; muted?: boolean }
export type ShowPayload = {
  revision: number
  mode: ShowMode
  idleUrl: string
  volume?: number
  muted?: boolean
  videoUrl?: string
  startedAt?: string
  category?: Category
  results?: Results
}
export type ShowState = {
  edition_id: string
  token: string
  revision: number
  config: ShowConfig
  snapshot: { categoryId: string; results: Results } | null
  payload: ShowPayload
}
