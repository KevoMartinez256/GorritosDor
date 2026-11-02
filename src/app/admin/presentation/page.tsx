import { adminData } from '@/lib/admin-data'
import Control from './control'
export default async function PresentationPage() {
  const data = await adminData()
  return data ? <Control categories={data.categories} /> : null
}
