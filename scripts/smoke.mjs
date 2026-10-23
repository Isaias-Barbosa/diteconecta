import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const port=process.env.SMOKE_PORT||'43081';
const base=`http://localhost:${port}`;
const upstreamPort=process.env.SMOKE_UPSTREAM_PORT||'45103';
const captured=[];
const upstream=createServer(async(req,res)=>{
 let raw='';for await(const chunk of req)raw+=chunk;
 const body=raw?JSON.parse(raw):{};
 captured.push({path:req.url,body});
 res.setHeader('Content-Type','application/json');
 if(req.url==='/auth/request-password-reset')return res.end(JSON.stringify({status:true,message:'Request received'}));
 if(req.url==='/auth/reset-password'){
  if(body.token==='expired-test-token'){res.statusCode=400;return res.end(JSON.stringify({message:'Invalid token',code:'INVALID_TOKEN'}));}
  return res.end(JSON.stringify({status:true}));
 }
 res.statusCode=404;res.end(JSON.stringify({message:'Not found'}));
});
await new Promise(resolve=>upstream.listen(Number(upstreamPort),'127.0.0.1',resolve));
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{
 env:{...process.env,DEMO_MODE:'true',DATABASE_URL:'postgresql://placeholder:placeholder@invalid.neon.tech/neondb?sslmode=require',NEON_AUTH_BASE_URL:`http://127.0.0.1:${upstreamPort}/auth`,NEON_AUTH_COOKIE_SECRET:'smoke-test-cookie-secret-with-at-least-32-characters'},stdio:['ignore','pipe','pipe'],
});
let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
try{
 let ready=false;
 for(let i=0;i<50;i++){
  try{const r=await fetch(`${base}/login`,{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch{}
  if(child.exitCode!==null)throw new Error('Servidor encerrou: '+logs);
  await delay(200);
 }
 assert.ok(ready,'Servidor não ficou pronto: '+logs);
 for(const path of ['/','/login','/admin','/forgot-password','/reset-password'])assert.equal((await fetch(base+path)).status,200);
 for(const [path,method,data] of [['/api/people','GET',null],['/api/people','PATCH',{id:'x',email:'a@b.com'}],['/api/teams','POST',{id:'x',message:'Olá'}]]){
  const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  assert.equal(r.status,401,`${method} ${path} deve exigir login, mesmo com DEMO_MODE=true em produção`);
  assert.ok(!(await r.text()).includes('Acacio'),'Nenhum contato deve ser exposto');
 }
 for(const path of ['sign-up/email','admin/set-role','admin/create-user']){
  const r=await fetch(base+'/api/auth/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,404);
 }
 for(const path of ['/api/people','/api/teams','/api/auth/sign-in/email','/api/auth/email-otp/verify-email','/api/auth/email-otp/send-verification-otp','/api/auth/request-password-reset','/api/auth/reset-password']){
  const r=await fetch(base+path,{method:path==='/api/people'?'PATCH':'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.example'},body:'{}'});assert.equal(r.status,403);
 }
 for(const [path,body] of [['email-otp/send-verification-otp',{email:'user@example.com',type:'sign-in'}],['email-otp/verify-email',{email:'user@example.com',otp:'bad-code'}]]){
  const r=await fetch(base+'/api/auth/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,400);
 }
 for(const [path,body] of [['request-password-reset',{email:'user@example.com',redirectTo:'https://evil.example/reset-password'}],['reset-password',{token:'',newPassword:'curta'}]]){
  const r=await fetch(base+'/api/auth/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,400);
 }
 const requestReset=await fetch(base+'/api/auth/request-password-reset',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({email:'test@example.com',redirectTo:base+'/reset-password'})});
 assert.equal(requestReset.status,200,await requestReset.text());
 assert.equal(captured.at(-1).path,'/auth/request-password-reset');
 assert.equal(captured.at(-1).body.redirectTo,base+'/reset-password');
 for(const [token,status] of [['valid-test-token',200],['expired-test-token',400]]){
  const r=await fetch(base+'/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({token,newPassword:'test-only-password'})});
  assert.equal(r.status,status);
  assert.equal(captured.at(-1).path,'/auth/reset-password');
  if(status===400)assert.equal((await r.json()).code,'INVALID_TOKEN');
 }
 console.log('PASS: recuperação e link expirado via SDK com serviço local simulado.');
 console.log('PASS: páginas, APIs sem sessão, demo desabilitada em produção, cadastro/funções bloqueados e origem externa recusada.');
}finally{
 upstream.closeAllConnections();await new Promise(resolve=>upstream.close(resolve));
 child.kill('SIGTERM');
 await new Promise(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',resolve);});
}
