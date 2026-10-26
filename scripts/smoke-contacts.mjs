import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

// Temporary in-memory demo only: never connects to a database or sends a Teams message.
const port=process.env.SMOKE_PORT||'43081';
const base=`http://localhost:${port}`;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',port],{env:{...process.env,DEMO_MODE:'true',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);
async function call(path,method='GET',body){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:base},...(body?{body:JSON.stringify(body)}:{})});
 return {status:response.status,data:await response.json()};
}
try{
 let ready=false;
 for(let i=0;i<60;i++){
  try{if((await fetch(base+'/login',{signal:AbortSignal.timeout(2000)})).ok){ready=true;break;}}catch{}
  if(server.exitCode!==null)throw new Error('Servidor encerrou: '+logs);
  await delay(300);
 }
 assert.ok(ready,'Servidor não iniciou: '+logs);
 const initial=await call('/api/people');assert.equal(initial.status,200);assert.equal(initial.data.demo,true);
 const person=initial.data.people.find(p=>!p.blocked);
 const body={id:person.id,email:'contato-teste@example.com',user_unknown:true,user_not_found:false,absence_type:null,return_date:null};
 let result=await call('/api/people','PATCH',body);assert.equal(result.status,200);assert.equal(result.data.person.user_unknown,true);
 result=await call('/api/people','PATCH',{...body,user_unknown:false,user_not_found:true});assert.equal(result.status,200);assert.equal(result.data.person.user_not_found,true);
 result=await call('/api/people','PATCH',{...body,user_unknown:false,absence_type:'vacation',return_date:'2099-12-10'});assert.equal(result.status,200);assert.equal(result.data.person.return_date,'2099-12-10');
 let list=await call('/api/people');assert.equal(list.data.people.find(p=>p.id===person.id).absence_type,'vacation');
 result=await call('/api/people','PATCH',{...body,absence_type:'temporary',return_date:null});assert.equal(result.status,400);
 result=await call('/api/people','PATCH',{...body,blocked:false});assert.equal(result.status,400);
 result=await call('/api/people','DELETE',{id:person.id});assert.equal(result.status,200);
 list=await call('/api/people');assert.ok(!list.data.people.some(p=>p.id===person.id));
 result=await call('/api/teams','POST',{id:person.id,message:'Mensagem de teste que não será aberta'});assert.equal(result.status,404);
 result=await call('/api/people','DELETE',{id:person.id});assert.equal(result.status,404);
 console.log('PASS: editar e-mail e situações, persistir na leitura, validar retorno e cargos protegidos, excluir e impedir conversa para contato excluído.');
}finally{
 server.kill('SIGTERM');await new Promise(resolve=>{if(server.exitCode!==null)resolve();else server.once('exit',resolve);});
}
