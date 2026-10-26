import {isEmail} from './teams';

export type UserRole='pending'|'reader'|'admin';
export type AppUser={id:string;name:string;email:string;emailVerified:boolean;createdAt:string;role:UserRole};
export const roleLabels:Record<UserRole,string>={pending:'Sem acesso / pendente',reader:'Usuário',admin:'Administrador'};

export function validSignup(body:unknown):body is {name:string;email:string;password:string}{
 if(!body||typeof body!=='object'||Array.isArray(body))return false;
 const b=body as Record<string,unknown>;
 return Object.keys(b).every(key=>['name','email','password'].includes(key))&&
  typeof b.name==='string'&&b.name.trim().length>=2&&b.name.length<=160&&
  typeof b.email==='string'&&isEmail(b.email)&&
  typeof b.password==='string'&&b.password.length>=8&&b.password.length<=128;
}
export function parseUserUpdate(body:unknown,actorId:string):{id:string;role:UserRole}{
 if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Dados inválidos.');
 const b=body as Record<string,unknown>;
 if(Object.keys(b).some(k=>!['id','role'].includes(k))||typeof b.id!=='string'||!b.id||b.id.length>256||!['pending','reader','admin'].includes(String(b.role)))throw new Error('Informe o usuário e uma permissão válida.');
 if(b.id===actorId)throw new Error('Sua própria permissão deve ser alterada por outro administrador.');
 return {id:b.id,role:b.role as UserRole};
}

// Membership is the only source of application privileges. Auth roles are never used.
export async function listUsers(sql:any):Promise<AppUser[]>{
 return await sql`select u.id::text as id,u.name,u.email,u."emailVerified" as "emailVerified",u."createdAt" as "createdAt",coalesce(m.role,'pending') as role from neon_auth."user" u left join public.app_members m on m.user_id=u.id::text order by (m.user_id is null) desc,lower(u.name),u.id`;
}
export async function setUserRole(sql:any,actorId:string,id:string,role:UserRole){
 if(id===actorId)throw new Error('SELF_ROLE_CHANGE');
 if(role==='pending'){
  // An existing pending account is also a successful no-op. The actor is rechecked in SQL.
  const rows=await sql`with target as (select u.id::text as id from neon_auth."user" u where u.id::text=${id} and u.id::text<>${actorId} and exists(select 1 from public.app_members where user_id=${actorId} and role='admin')), removed as (delete from public.app_members where user_id in(select id from target) returning user_id) select id from target`;
  return rows.length>0;
 }
 const rows=await sql`insert into public.app_members(user_id,role) select u.id::text,${role} from neon_auth."user" u where u.id::text=${id} and u.id::text<>${actorId} and exists(select 1 from public.app_members where user_id=${actorId} and role='admin') on conflict(user_id) do update set role=excluded.role returning user_id`;
 return rows.length>0;
}
