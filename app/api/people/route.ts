import {access,demo,demoPeople,fail,json,AccessError,sameOrigin} from '@/lib/server';
import {isEmail} from '@/lib/teams';
import {applyContactPolicy} from '@/lib/contacts';
import type {Person} from '@/lib/types';
export async function GET(request:Request){try{
 if(demo)return json({people:demoPeople().map(applyContactPolicy),admin:true,demo:true});
 const {sql,userId,admin}=await access(request);
 const people=await sql`select p.* from public.people p where exists(select 1 from public.app_members where user_id=${userId}) order by p.name`;
 return json({people:(people as Person[]).map(applyContactPolicy),admin,demo:false});
}catch(e){return fail(e);}}
export async function PATCH(request:Request){try{
 sameOrigin(request);
 const session=demo?null:await access(request);
 if(session && !session.admin)throw new AccessError('Somente administradores podem editar e-mails.',403);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 if(!body || typeof body.id!=='string' || !Object.hasOwn(body,'email') || (body.email!==null && typeof body.email!=='string'))throw new AccessError('Informe contato e e-mail.',400);
 const email=body.email?.trim().toLowerCase()||null;
 if(email && !isEmail(email))throw new AccessError('Informe um e-mail válido.',400);
 if(demo){const person=demoPeople().find(p=>p.id===body.id);if(!person)throw new AccessError('Contato não encontrado.',404);person.email=email;return json({person:applyContactPolicy(person)});}
 let rows;
 try{
  rows=await session!.sql`update public.people set email=${email} where id::text=${body.id} and exists(select 1 from public.app_members where user_id=${session!.userId} and role='admin') returning *`;
 }catch(e){if((e as {code?:string}).code==='23505')throw new AccessError('Este e-mail já está cadastrado em outro contato.',409);throw e;}
 if(!rows[0])throw new AccessError('Contato não encontrado ou permissão revogada.',404);
 return json({person:applyContactPolicy(rows[0] as Person)});
}catch(e){return fail(e);}}
