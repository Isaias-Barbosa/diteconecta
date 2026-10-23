import { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth/server';
import {isAllowedAuthRoute} from '@/lib/auth/routes';
import {isEmail} from '@/lib/teams';
import {validResetRequest,validResetSubmission} from '@/lib/auth/password-reset';
import {AccessError,fail,sameOrigin} from '@/lib/server';

type Context={params:Promise<{path:string[]}>};
// Only the endpoints used by this application are exposed. No signup or role management API.
async function handle(request:NextRequest,context:Context){try{
 const {path}=await context.params;
 const endpoint=path.join('/');
 const allowed=isAllowedAuthRoute(request.method,endpoint);
 if(!allowed)throw new AccessError('Operação de autenticação não disponível.',404);
 if(request.method==='POST')sameOrigin(request);
 if(endpoint==='request-password-reset'||endpoint==='reset-password'){
  let body;try{body=await request.clone().json();}catch{throw new AccessError('Dados inválidos.',400);}
  const valid=endpoint==='request-password-reset'?validResetRequest(body,new URL(request.url).origin):validResetSubmission(body);
  if(!valid)throw new AccessError('Informe os dados válidos para recuperar a senha usando o link deste site.',400);
 }
 if(endpoint.startsWith('email-otp/')){
  let body;try{body=await request.clone().json();}catch{throw new AccessError('Dados inválidos.',400);}
  if(!body || typeof body.email!=='string' || !isEmail(body.email))throw new AccessError('Informe um e-mail válido.',400);
  if(endpoint==='email-otp/send-verification-otp' && body.type!=='email-verification')throw new AccessError('Somente confirmação de e-mail está disponível.',400);
  if(endpoint==='email-otp/verify-email' && (typeof body.otp!=='string' || !/^[0-9]{4,10}$/.test(body.otp)))throw new AccessError('Informe o código numérico recebido por e-mail.',400);
 }
 if(!process.env.NEON_AUTH_BASE_URL || (process.env.NEON_AUTH_COOKIE_SECRET?.length??0)<32)
  throw new AccessError('Configure NEON_AUTH_BASE_URL e NEON_AUTH_COOKIE_SECRET na Vercel.',503);
 const handlers=getAuth().handler();
 return request.method==='GET'?await handlers.GET(request,context):await handlers.POST(request,context);
}catch(e){return fail(e);}}
export const GET=handle;
export const POST=handle;
