import {isEmail} from '../teams';
export const passwordValid=(password:unknown):password is string=>typeof password==='string' && password.length>=8 && password.length<=128;
export function validResetRequest(body:unknown,origin:string){
 if(!body || typeof body!=='object')return false;
 const data=body as Record<string,unknown>;
 if(typeof data.email!=='string' || !isEmail(data.email) || typeof data.redirectTo!=='string')return false;
 try{
  const url=new URL(data.redirectTo);
  return url.origin===origin && url.pathname==='/reset-password' && !url.search && !url.hash && !url.username && !url.password;
 }catch{return false;}
}
export function validResetSubmission(body:unknown){
 if(!body || typeof body!=='object')return false;
 const data=body as Record<string,unknown>;
 return typeof data.token==='string' && data.token.length>0 && data.token.length<=4096 && passwordValid(data.newPassword);
}
