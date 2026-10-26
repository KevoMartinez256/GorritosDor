export type Nominee = { id: string; display_name: string; avatar_url: string | null; ext: { position?: number; image_fit?: string; image_position?: string } | null }
export type Category = { id: string; name: string; position: number; nominees: Nominee[] }
export type Edition = { id: string; slug: string; title: string; starts_at: string; ends_at: string }
export type Results = { counts: Record<string, number>; updatedAt: string; closed: boolean; started: boolean }
export function tally(category: Category, counts: Record<string, number>) {
  const total = category.nominees.reduce((sum, n) => sum + (counts[n.id] ?? 0), 0)
  const max = Math.max(0, ...category.nominees.map(n => counts[n.id] ?? 0))
  return { total, leaders: max > 0 ? category.nominees.filter(n => counts[n.id] === max) : [], percent: (id: string) => total ? (counts[id] ?? 0) * 100 / total : 0 }
}
