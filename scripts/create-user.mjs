import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { stdin, stdout } from 'node:process';
import { neon } from '@neondatabase/serverless';

// Provisioning runs only on the operator's machine; no signup endpoint is exposed by the app.
const authUrl=process.env.NEON_AUTH_BASE_URL;
const databaseUrl=process.env.DATABASE_URL;
if(!authUrl || !databaseUrl){console.error('Preencha NEON_AUTH_BASE_URL e DATABASE_URL em .env.local.');process.exit(1);}
if(!stdin.isTTY){console.error('Execute em um terminal interativo para informar a senha sem exibi-la.');process.exit(1);}
let muted=false;
const output=new Writable({write(chunk,encoding,callback){if(!muted)stdout.write(chunk,encoding);callback();}});
const input=createInterface({input:stdin,output,terminal:true});
try{
 const email=(await input.question('E-mail de login: ')).trim().toLowerCase();
 const name=(await input.question('Nome: ')).trim();
 const role=(await input.question('Permissão (admin/reader): ')).trim();
 if(!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)||!name||!['admin','reader'].includes(role))throw new Error('Confira e-mail, nome e permissão.');
 stdout.write('Senha (8 a 128 caracteres; não será exibida): ');muted=true;
 const password=await input.question('');muted=false;stdout.write('\n');
 if(password.length<8||password.length>128)throw new Error('A senha deve ter entre 8 e 128 caracteres.');
 const response=await fetch(authUrl.replace(/\/$/,'')+'/sign-up/email',{
  method:'POST',headers:{'Content-Type':'application/json',Origin:process.env.APP_URL||'http://localhost:3000'},
  body:JSON.stringify({email,password,name}),signal:AbortSignal.timeout(30000),
 });
 const data=await response.json();
 if(!response.ok || !data.user?.id)throw new Error('O Neon Auth não criou a conta. Verifique domínio confiável, provedor de e-mail e se a conta já existe. Para contas existentes, use o SQL do README.');
 const sql=neon(databaseUrl);
 await sql`insert into public.app_members(user_id,role) values(${data.user.id},${role}) on conflict(user_id) do update set role=excluded.role`;
 console.log(`Conta criada e acesso ${role} liberado. ID: ${data.user.id}`);
 console.log('Se a verificação de e-mail estiver habilitada no Neon, confirme a conta antes de entrar.');
}catch(error){
 // Never log connection errors or upstream payloads, which may contain configuration details.
 if(error instanceof Error && (error.message.startsWith('Confira')||error.message.startsWith('A senha')||error.message.startsWith('O Neon Auth')))console.error(error.message);
 else console.error('Falha no provisionamento. Confira o schema e a configuração do Neon. Se a conta já foi criada, libere-a pelo SQL do README.');
 process.exitCode=1;
}finally{muted=false;input.close();}
