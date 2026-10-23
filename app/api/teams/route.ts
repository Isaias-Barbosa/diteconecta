import {access,demo,demoPeople,fail,json,AccessError,sameOrigin} from '@/lib/server';
import {teamsLink} from '@/lib/teams';
import type { Person } from '@/lib/types';
export async function POST(request:Request){try{
 sameOrigin(request);
 const session=demo?null:await access(request);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 if(!body || typeof body.id!=='string'||typeof body.message!=='string')throw new AccessError('Informe contato e mensagem.',400);
 let person:Person|undefined;
 if(demo)person=demoPeople().find(p=>p.id===body.id);
 else {
  const rows=await session!.sql`select p.* from public.people p where p.id::text=${body.id} and exists(select 1 from public.app_members where user_id=${session!.userId})`;
  person=rows[0] as Person|undefined;
 }
 if(!person)throw new AccessError('Contato não encontrado.',404);
 try{return json({url:teamsLink(person,body.message)});}catch(e){throw new AccessError((e as Error).message,400);}
}catch(e){return fail(e);}}
