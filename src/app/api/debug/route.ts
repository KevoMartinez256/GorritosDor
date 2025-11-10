import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClientServer()
  const editions = await supabase.from('editions').select('id, slug, title').order('slug')
  const categories = await supabase.from('categories').select('id, name, edition_id').limit(3)
  return NextResponse.json({ editions, categories })
}
