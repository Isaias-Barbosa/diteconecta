import {access,AccessError,demo,fail,json,sameOrigin} from '@/lib/server';
import {listUsers,parseUserUpdate,setUserRole,type AppUser} from '@/lib/users';

const demoStore=globalThis as typeof globalThis & {demoUsers?:AppUser[]};
function demoUsers(){return demoStore.demoUsers??=[{id:'demo-admin',name:'Administrador de demonstração',email:'admin@example.com',emailVerified:true,createdAt:'2026-06-03T12:00:00Z',role:'admin'},{id:'demo-pending',name:'Novo usuário',email:'novo@example.com',emailVerified:false,createdAt:'2026-06-04T12:00:00Z',role:'pending'}];}
export async function GET(request:Request){try{
 if(demo)return json({users:demoUsers(),userId:'demo-admin',demo:true});
 const {sql,admin,userId}=await access(request);
 if(!admin)throw new AccessError('Esta página é exclusiva para administradores.',403);
 return json({users:await listUsers(sql),userId,demo:false});
}catch(e){return fail(e);}}
export async function PATCH(request:Request){try{
 sameOrigin(request);
 const ctx=demo?null:await access(request);
 if(ctx&&!ctx.admin)throw new AccessError('Somente administradores podem alterar permissões.',403);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 let change;try{change=parseUserUpdate(body,ctx?.userId??'demo-admin');}catch(e){throw new AccessError((e as Error).message,400);}
 if(demo){const user=demoUsers().find(u=>u.id===change.id);if(!user)throw new AccessError('Usuário não encontrado.',404);user.role=change.role;return json({ok:true});}
 if(!await setUserRole(ctx!.sql,ctx!.userId,change.id,change.role))throw new AccessError('Usuário não encontrado ou sua permissão foi alterada. Atualize a página.',409);
 return json({ok:true});
}catch(e){return fail(e);}}
