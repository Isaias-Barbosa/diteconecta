import { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth/server';
import {AccessError,fail,sameOrigin} from '@/lib/server';

type Context={params:Promise<{path:string[]}>};
// Only the endpoints used by this application are exposed. No signup or role management API.
async function handle(request:NextRequest,context:Context){try{
 const {path}=await context.params;
 const endpoint=path.join('/');
 const allowed=request.method==='GET'?endpoint==='get-session':endpoint==='sign-in/email'||endpoint==='sign-out';
 if(!allowed)throw new AccessError('Operação de autenticação não disponível.',404);
 if(request.method==='POST')sameOrigin(request);
 if(!process.env.NEON_AUTH_BASE_URL || (process.env.NEON_AUTH_COOKIE_SECRET?.length??0)<32)
  throw new AccessError('Configure NEON_AUTH_BASE_URL e NEON_AUTH_COOKIE_SECRET na Vercel.',503);
 const handlers=getAuth().handler();
 return request.method==='GET'?await handlers.GET(request,context):await handlers.POST(request,context);
}catch(e){return fail(e);}}
export const GET=handle;
export const POST=handle;
