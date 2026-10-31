import 'server-only'
import { sessionServer } from '@/lib/session-server'
import { redirect } from 'next/navigation'
export async function votingAccess(editionId:string) {
 const db=await sessionServer(); const {data:{user}}=await db.auth.getUser()
 const {data:e,error}=await db.from('editions').select('starts_at,ends_at').eq('id',editionId).single()
 if(error||!e)throw new Error('No se pudo verificar la votación.')
 if(!user)return {allowed:false,submitted:false,message:'Inicia sesión con Twitch para votar.'}
 const [{data:tester,error:te},{data:submission,error:se}]=await Promise.all([
 db.from('voting_testers').select('user_id').eq('user_id',user.id).maybeSingle(),
 db.from('ballot_submissions').select('voter_id').eq('edition_id',editionId).eq('voter_id',user.id).maybeSingle()])
 if(te||se)throw new Error('No se pudo verificar el acceso. Intenta de nuevo.')
 const allowed=Date.now()<=Date.parse(e.ends_at)&&(Date.now()>=Date.parse(e.starts_at)||!!tester)
 return {allowed,submitted:!!submission,message:Date.now()>Date.parse(e.ends_at)?'La votación ha cerrado.':'La votación abre el 6 de noviembre de 2026 a las 00:00, hora de CDMX.'}
}
export async function guardVoting(editionId:string,slug:string){
 const access=await votingAccess(editionId)
 if(access.submitted)redirect('/vote/'+slug+'/summary')
 return access
}
