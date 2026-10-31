import { sessionServer } from '@/lib/session-server'
export async function POST(req:Request){
 const db=await sessionServer();const {data:{user}}=await db.auth.getUser()
 if(!user)return Response.json({error:'Inicia sesión con Twitch.'},{status:401})
 let body;try{body=await req.json()}catch{return Response.json({error:'Solicitud inválida.'},{status:400})}
 if(!body.editionId||!body.choices||typeof body.choices!=='object'||Array.isArray(body.choices))return Response.json({error:'Recarga la página para usar el nuevo envío de votos.'},{status:400})
 const {error}=await db.rpc('submit_ballot',{p_edition:body.editionId,p_choices:body.choices})
 if(error)return Response.json({error:error.message},{status:error.code==='23505'?409:error.code==='42501'?403:400})
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}})
}
