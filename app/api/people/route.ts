import {access,demo,demoPeople,fail,json,AccessError,sameOrigin} from '@/lib/server';
import {applyContactPolicy} from '@/lib/contacts';
import {parsePersonUpdate} from '@/lib/person-update';
import {parsePersonCreate} from '@/lib/person-create';
import {randomUUID} from 'node:crypto';
import type {Person} from '@/lib/types';
function writeError(error:unknown){
 const code=(error as {code?:string}).code;
 if(code==='23505')return fail(new AccessError('Este e-mail já está cadastrado em outro contato.',409));
 if(code==='42703')return fail(new AccessError('Atualização do banco pendente. Execute neon/004_contact_status.sql no Neon.',503));
 return fail(error);
}
export async function GET(request:Request){try{
 if(demo)return json({people:demoPeople().filter(p=>!p.deleted_at).map(applyContactPolicy),admin:true,demo:true});
 const {sql,userId,admin}=await access(request);
 // The JSON predicate keeps existing directories readable before migration 004 is applied.
 const people=await sql`select p.* from public.people p where coalesce(to_jsonb(p)->>'deleted_at','')='' and exists(select 1 from public.app_members where user_id=${userId}) order by p.name`;
 const migrationRequired=people.length>0&&!Object.hasOwn(people[0],'user_unknown');
 return json({people:(people as Person[]).map(applyContactPolicy),admin,demo:false,migrationRequired});
}catch(e){return fail(e);}}
export async function PATCH(request:Request){try{
 sameOrigin(request);
 const session=demo?null:await access(request);
 if(session&&!session.admin)throw new AccessError('Somente administradores podem editar contatos.',403);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 let update;try{update=parsePersonUpdate(body);}catch(e){throw new AccessError((e as Error).message,400);}
 if(demo){
  const person=demoPeople().find(p=>p.id===update.id&&!p.deleted_at);
  if(!person)throw new AccessError('Contato não encontrado.',404);
  Object.assign(person,{email:update.email},update.status??{});
  return json({person:applyContactPolicy(person)});
 }
 const {sql,userId}=session!;
 const status=update.status;
 const rows=status?await sql`update public.people p set email=${update.email},user_unknown=${status.user_unknown},user_not_found=${status.user_not_found},absence_type=${status.absence_type},return_date=${status.return_date} where p.id::text=${update.id} and coalesce(to_jsonb(p)->>'deleted_at','')='' and exists(select 1 from public.app_members where user_id=${userId} and role='admin') returning p.*`:
  await sql`update public.people p set email=${update.email} where p.id::text=${update.id} and coalesce(to_jsonb(p)->>'deleted_at','')='' and exists(select 1 from public.app_members where user_id=${userId} and role='admin') returning p.*`;
 if(!rows[0])throw new AccessError('Contato não encontrado ou permissão revogada.',404);
 return json({person:applyContactPolicy(rows[0] as Person)});
}catch(e){return writeError(e);}}
export async function DELETE(request:Request){try{
 sameOrigin(request);
 const session=demo?null:await access(request);
 if(session&&!session.admin)throw new AccessError('Somente administradores podem excluir contatos.',403);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 if(!body||typeof body.id!=='string'||!body.id||Object.keys(body).some(k=>k!=='id'))throw new AccessError('Informe o contato a excluir.',400);
 if(demo){const person=demoPeople().find(p=>p.id===body.id&&!p.deleted_at);if(!person)throw new AccessError('Contato não encontrado.',404);person.deleted_at=new Date().toISOString();}
 else{
  const {sql,userId}=session!;
  const rows=await sql`update public.people p set deleted_at=now() where p.id::text=${body.id} and p.deleted_at is null and exists(select 1 from public.app_members where user_id=${userId} and role='admin') returning p.id`;
  if(!rows[0])throw new AccessError('Contato não encontrado ou permissão revogada.',404);
 }
 return json({id:body.id,deleted:true});
}catch(e){return writeError(e);}}

export async function POST(request:Request){try{
 sameOrigin(request);
 const session=demo?null:await access(request);
 if(session&&!session.admin)throw new AccessError('Somente administradores podem cadastrar contatos.',403);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 let input;try{input=parsePersonCreate(body);}catch(e){throw new AccessError((e as Error).message,400);}
 const id=randomUUID();
 if(demo){
  if(input.email&&demoPeople().some(p=>!p.deleted_at&&p.email?.toLowerCase()===input.email))throw new AccessError('Este e-mail já está cadastrado em outro contato.',409);
  const person=applyContactPolicy({id,...input});demoPeople().push(person);return json({person});
 }
 const {sql,userId}=session!;
 const rows=await sql`insert into public.people(id,name,area,email,role,blocked) select ${id}::uuid,${input.name},${input.area},${input.email},${input.role},${input.blocked} where exists(select 1 from public.app_members where user_id=${userId} and role='admin') returning *`;
 if(!rows[0])throw new AccessError('Permissão de cadastro revogada.',403);
 return json({person:applyContactPolicy(rows[0] as Person)});
}catch(e){return writeError(e);}}
