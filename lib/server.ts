import { createClient } from '@supabase/supabase-js';
import seed from '@/data/people.json';
import type { Person } from './types';
export const demo=process.env.NODE_ENV==='development' && process.env.DEMO_MODE==='true';
const globalStore=globalThis as typeof globalThis & { demoPeople?:Person[] };
export function demoPeople(){return globalStore.demoPeople??=(structuredClone(seed) as Person[]);}
export class AccessError extends Error { constructor(message:string,public status:number){super(message);} }
export async function access(request:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url || !key) throw new AccessError('Configure o Supabase seguindo o README do projeto.',503);
 const token=request.headers.get('authorization');
 if(!token?.startsWith('Bearer '))throw new AccessError('Entre para acessar o diretório.',401);
 const db=createClient(url,key,{global:{headers:{Authorization:token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(token.slice(7));
 if(error || !user)throw new AccessError('Sua sessão expirou. Entre novamente.',401);
 const {data:member,error:memberError}=await db.from('app_members').select('role').eq('user_id',user.id).single();
 if(memberError || !member)throw new AccessError('Seu usuário ainda não possui acesso. Solicite ao administrador.',403);
 return {db,admin:member.role==='admin'};
}
export function fail(error:unknown){return Response.json({error:error instanceof Error?error.message:'Erro inesperado.'},{status:error instanceof AccessError?error.status:500,headers:{'Cache-Control':'no-store'}});}
export function json(data:unknown){return Response.json(data,{headers:{'Cache-Control':'private, no-store'}});}
