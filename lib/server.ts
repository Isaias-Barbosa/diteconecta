import { neon } from '@neondatabase/serverless';
import { getAuth } from './auth/server';
import seed from '@/data/people.json';
import type { Person } from './types';
export const demo=process.env.NODE_ENV==='development' && process.env.DEMO_MODE==='true';
const globalStore=globalThis as typeof globalThis & { demoPeople?:Person[] };
export function demoPeople(){return globalStore.demoPeople??=(structuredClone(seed) as Person[]);}
export class AccessError extends Error { constructor(message:string,public status:number){super(message);} }
export function database(){
 if(!process.env.DATABASE_URL)throw new AccessError('Configure DATABASE_URL do Neon seguindo o README.',503);
 return neon(process.env.DATABASE_URL);
}
export async function access(_request:Request){
 if(!process.env.NEON_AUTH_BASE_URL || (process.env.NEON_AUTH_COOKIE_SECRET?.length??0)<32)
  throw new AccessError('Configure o Neon Auth seguindo o README do projeto.',503);
 const {data:session,error}=await getAuth().getSession();
 if(error)throw new AccessError('Não foi possível validar a sessão. Tente entrar novamente.',401);
 if(!session?.user)throw new AccessError('Entre para acessar o diretório.',401);
 const sql=database();
 const members=await sql`select role from public.app_members where user_id=${session.user.id}`;
 if(!members[0])throw new AccessError('Seu usuário ainda não possui acesso. Solicite ao administrador.',403);
 return {sql,userId:session.user.id,admin:members[0].role==='admin'};
}
export function sameOrigin(request:Request){
 const origin=request.headers.get('origin');
 // Browser writes must originate on this application. Non-browser CLI calls may omit Origin.
 if(origin && origin!==new URL(request.url).origin)throw new AccessError('Origem da requisição não permitida.',403);
}
export function fail(error:unknown){
 if(error instanceof AccessError)return Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});
 // Do not return SQL errors, connection URLs or upstream authentication details to clients.
 return Response.json({error:'Não foi possível concluir a operação. Verifique a configuração do Neon e tente novamente.'},{status:500,headers:{'Cache-Control':'no-store'}});
}
export function json(data:unknown){return Response.json(data,{headers:{'Cache-Control':'private, no-store'}});}
