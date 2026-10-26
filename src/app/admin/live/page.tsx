import { adminData } from '@/lib/admin-data'
import LiveShow from './show'
export default async function LivePage() {
  const data = await adminData()
  return data ? <LiveShow {...data} /> : null
}
