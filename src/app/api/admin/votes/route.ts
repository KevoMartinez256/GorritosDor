import { adminAccess } from '@/lib/admin'
const headers={'Cache-Control':'private, no-store'}
export async function GET(req:Request){
 const {supabase,allowed,status}=await adminAccess()
 if(!allowed)return Response.json({error:'Acceso no autorizado'},{status,headers})
 const url=new URL(req.url),category=url.searchParams.get('category'),offset=Number(url.searchParams.get('offset')||0)
 if(!category||!Number.isSafeInteger(offset)||offset<0)return Response.json({error:'Consulta inválida'},{status:400,headers})
 const {data:edition,error:ee}=await supabase.from('editions').select('id').eq('slug','2026').single()
 if(ee)return Response.json({error:'Edición no disponible'},{status:503,headers})
 const [{data,error},{data:counts,error:ce}]=await Promise.all([supabase.rpc('admin_vote_details',{p_edition:edition.id,p_category:category,p_offset:offset}),supabase.rpc('admin_vote_results',{p_edition:edition.id})])
 if(error||ce)return Response.json({error:'No se pudo cargar el detalle'},{status:503,headers})
 return Response.json({...data,counts:Object.fromEntries(counts.map((r:{nominee_id:string;total:number})=>[r.nominee_id,Number(r.total)]))},{headers})
}
export async function POST(req:Request){
 const {supabase,allowed,status}=await adminAccess()
 if(!allowed)return Response.json({error:'Acceso no autorizado'},{status,headers})
 let b;try{b=await req.json()}catch{return Response.json({error:'Solicitud inválida'},{status:400})}
 if(!Number.isInteger(b.quantity)||b.quantity<1||b.quantity>10000||typeof b.reason!=='string'||b.reason.trim().length<3)return Response.json({error:'Indica una cantidad de 1 a 10000 y un motivo.'},{status:400})
 const {data:e}=await supabase.from('editions').select('id').eq('slug','2026').single()
 if(!e)return Response.json({error:'Edición no disponible'},{status:503})
 const {error}=await supabase.rpc('admin_add_manual_votes',{p_id:b.id,p_edition:e.id,p_category:b.category,p_nominee:b.nominee,p_quantity:b.quantity,p_reason:b.reason})
 return error?Response.json({error:error.message},{status:400,headers}):Response.json({ok:true},{headers})
}
