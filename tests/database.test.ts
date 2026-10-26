import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('schema e seed Neon: carga idempotente, e-mails preservados e constraints aplicadas',async()=>{
 const db=new PGlite();
 try{
  const schema=await readFile(new URL('../neon/001_schema.sql',import.meta.url),'utf8');
  const seed=await readFile(new URL('../neon/002_seed.sql',import.meta.url),'utf8');
  await db.exec(schema);await db.exec(seed);
  await db.exec(await readFile(new URL('../neon/004_contact_status.sql',import.meta.url),'utf8'));
  const result=await db.query<{total:number;blocked:number}>(`select count(*)::int total,count(*) filter(where blocked)::int blocked from people`);
  assert.deepEqual(result.rows,[{total:112,blocked:29}]);
  // IDs from the managed provider may be strings; they need not be Postgres UUIDs.
  await db.query(`insert into app_members(user_id,role) values($1,$2)`,['neon-user-123','admin']);
  await assert.rejects(()=>db.query(`insert into app_members(user_id,role) values($1,$2)`,['bad-user','superadmin']));
  const {rows}=await db.query<{id:string}>(`select id from people where not blocked order by name limit 2`);
  await db.query(`update people set email=$1 where id=$2`,['contato@example.com',rows[0].id]);
  await assert.rejects(()=>db.query(`update people set email=$1 where id=$2`,['CONTATO@example.com',rows[1].id]));
  await assert.rejects(()=>db.query(`update people set email=$1 where id=$2`,['endereco-invalido',rows[1].id]));
  await db.exec(schema);await db.exec(seed);
  await db.query(`update people set blocked=false where role='Superintendente'`);
  await db.exec(await readFile(new URL('../neon/003_block_superintendents.sql',import.meta.url),'utf8'));
  assert.equal((await db.query(`select id from people where role='Superintendente' and blocked`)).rows.length,6);
  const preserved=await db.query<{email:string}>(`select email from people where id=$1`,[rows[0].id]);
  assert.equal(preserved.rows[0].email,'contato@example.com');
  assert.equal((await db.query(`select id from people`)).rows.length,112);
  await db.query(`update people set user_unknown=true,absence_type='vacation',return_date='2099-12-10' where id=$1`,[rows[0].id]);
  await assert.rejects(()=>db.query(`update people set user_not_found=true where id=$1`,[rows[0].id]));
  await assert.rejects(()=>db.query(`update people set absence_type='temporary',return_date=null where id=$1`,[rows[1].id]));
  await db.query(`update people set deleted_at=now() where id=$1`,[rows[0].id]);
  await db.exec(seed);
  await db.exec(await readFile(new URL('../neon/004_contact_status.sql',import.meta.url),'utf8'));
  const saved=await db.query<{email:string;user_unknown:boolean;deleted_at:unknown}>(`select email,user_unknown,deleted_at from people where id=$1`,[rows[0].id]);
  assert.equal(saved.rows[0].email,'contato@example.com');assert.equal(saved.rows[0].user_unknown,true);assert.ok(saved.rows[0].deleted_at);
  assert.equal((await db.query(`select p.* from people p where coalesce(to_jsonb(p)->>'deleted_at','')=''`)).rows.length,111);
 }finally{await db.close();}
});

test('migração de situações atualiza banco antigo sem apagar e-mail',async()=>{
 const db=new PGlite();
 try{
  await db.exec(`create table people(id uuid primary key,name text not null,area text not null,email text,role text not null,blocked boolean not null default false);create unique index people_unique_email on people(lower(email)) where email is not null;`);
  await db.query(`insert into people(id,name,area,email,role) values($1,$2,$3,$4,$5)`,['00000000-0000-0000-0000-000000000001','Pessoa','Área','preservar@example.com','Integrante']);
  const migration=await readFile(new URL('../neon/004_contact_status.sql',import.meta.url),'utf8');
  await db.exec(migration);await db.exec(migration);
  const {rows}=await db.query<{email:string;user_unknown:boolean;user_not_found:boolean;absence_type:null;return_date:null}>(`select email,user_unknown,user_not_found,absence_type,return_date from people`);
  assert.deepEqual(rows,[{email:'preservar@example.com',user_unknown:false,user_not_found:false,absence_type:null,return_date:null}]);
 }finally{await db.close();}
});
