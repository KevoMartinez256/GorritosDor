import 'server-only'
import { adminAccess } from './admin'
import type { Category, Edition } from './admin-types'

export async function adminData() {
  const { supabase, allowed } = await adminAccess()
  if (!allowed) return null
  const { data: edition, error } = await supabase.from('editions').select('id,slug,title,starts_at,ends_at').eq('slug', '2026').single()
  if (error) throw new Error('No se pudo cargar la edición')
  const { data, error: categoriesError } = await supabase.from('categories').select('id,name,position,nominees(id,display_name,avatar_url,ext)').eq('edition_id', edition.id).order('position')
  if (categoriesError) throw new Error('No se pudieron cargar las categorías')
  const categories = (data as Category[]).map(c => ({ ...c, name: c.name.replace(/\?$/, ''), nominees: c.nominees.sort((a,b) => (a.ext?.position ?? 99) - (b.ext?.position ?? 99)) }))
  return { edition: edition as Edition, categories }
}
