import { adminData } from '@/lib/admin-data'
import InstagramStudio from './studio'
export default async function InstagramPage() {
  const data = await adminData()
  return data ? <InstagramStudio {...data} /> : null
}
