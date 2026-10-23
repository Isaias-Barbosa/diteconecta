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
  const result=await db.query<{total:number;blocked:number}>(`select count(*)::int total,count(*) filter(where blocked)::int blocked from people`);
  assert.deepEqual(result.rows,[{total:112,blocked:23}]);
  // IDs from the managed provider may be strings; they need not be Postgres UUIDs.
  await db.query(`insert into app_members(user_id,role) values($1,$2)`,['neon-user-123','admin']);
  await assert.rejects(()=>db.query(`insert into app_members(user_id,role) values($1,$2)`,['bad-user','superadmin']));
  const {rows}=await db.query<{id:string}>(`select id from people where not blocked order by name limit 2`);
  await db.query(`update people set email=$1 where id=$2`,['contato@example.com',rows[0].id]);
  await assert.rejects(()=>db.query(`update people set email=$1 where id=$2`,['CONTATO@example.com',rows[1].id]));
  await assert.rejects(()=>db.query(`update people set email=$1 where id=$2`,['endereco-invalido',rows[1].id]));
  await db.exec(schema);await db.exec(seed);
  const preserved=await db.query<{email:string}>(`select email from people where id=$1`,[rows[0].id]);
  assert.equal(preserved.rows[0].email,'contato@example.com');
  assert.equal((await db.query(`select id from people`)).rows.length,112);
 }finally{await db.close();}
});
