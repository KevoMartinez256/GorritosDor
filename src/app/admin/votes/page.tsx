import { adminData } from '@/lib/admin-data'
import Detail from './detail'
export default async function Page(){const data=await adminData();return data?<Detail categories={data.categories}/>:null}
