import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {listUsers,parseUserUpdate,setUserRole,validSignup} from '../lib/users';

test('cadastro aceita somente identidade e senha; permissões não podem ser autoatribuídas',()=>{
 const body={name:'Pessoa Teste',email:'pessoa@example.com',password:'senha-teste-123'};
 assert.equal(validSignup(body),true);
 for(const extra of [{role:'admin'},{user_id:'x'},{emailVerified:true},{callbackURL:'https://outside.example'}])assert.equal(validSignup({...body,...extra}),false);
 for(const bad of [null,[],{...body,password:'curta'},{...body,email:'inválido'},{...body,name:'  '}])assert.equal(validSignup(bad),false);
 assert.deepEqual(parseUserUpdate({id:'outro',role:'reader'},'admin'),{id:'outro',role:'reader'});
 for(const body of [{id:'admin',role:'pending'},{id:'outro',role:'superadmin'},{id:'outro',role:'admin',emailVerified:true},null])assert.throws(()=>parseUserUpdate(body,'admin'));
});

test('permissões reais no Postgres: pendentes, aprovação, promoção, revogação e bloqueio de autoedição',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create schema neon_auth;create table neon_auth."user"(id uuid primary key,name text,email text,"emailVerified" boolean,"createdAt" timestamptz default now());create table app_members(user_id text primary key,role text check(role in ('admin','reader')));`);
  const admin='00000000-0000-0000-0000-000000000001',reader='00000000-0000-0000-0000-000000000002',pending='00000000-0000-0000-0000-000000000003';
  for(const [id,name,email,verified] of [[admin,'Admin','admin@example.com',true],[reader,'Leitor','reader@example.com',true],[pending,'Novo','novo@example.com',false]])await db.query(`insert into neon_auth."user"(id,name,email,"emailVerified") values($1,$2,$3,$4)`,[id,name,email,verified]);
  await db.query(`insert into app_members values($1,'admin'),($2,'reader')`,[admin,reader]);
  const sql=async(strings:TemplateStringsArray,...values:unknown[])=>{
   const query=strings.reduce((q,s,i)=>q+(i?`$${i}`:'')+s,'');
   return (await db.query(query,values)).rows;
  };
  const users=await listUsers(sql);
  assert.equal(users.length,3);assert.equal(users[0].id,pending);assert.equal(users[0].role,'pending');assert.equal(users[0].emailVerified,false);
  assert.equal(await setUserRole(sql,reader,pending,'admin'),false);
  assert.equal(await setUserRole(sql,pending,reader,'admin'),false);
  assert.equal(await setUserRole(sql,admin,pending,'reader'),true);
  assert.equal((await listUsers(sql)).find(u=>u.id===pending)?.role,'reader');
  assert.equal(await setUserRole(sql,admin,pending,'admin'),true);
  assert.equal((await listUsers(sql)).find(u=>u.id===pending)?.role,'admin');
  await assert.rejects(()=>setUserRole(sql,admin,admin,'pending'));
  assert.equal(await setUserRole(sql,admin,pending,'pending'),true);
  assert.equal((await listUsers(sql)).find(u=>u.id===pending)?.role,'pending');
  assert.equal(await setUserRole(sql,pending,reader,'admin'),false);
  assert.equal(await setUserRole(sql,admin,'00000000-0000-0000-0000-000000000004','reader'),false);
  assert.equal((await db.query(`select id from neon_auth."user"`)).rows.length,3);
 }finally{await db.close();}
});
