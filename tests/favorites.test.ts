import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {parseFavoriteChange} from '../lib/favorites';
import {favoriteIds,saveFavorite} from '../lib/favorites-store';

test('favoritos não aceitam identidade de outro usuário nem dados adicionais',()=>{
 const id='00000000-0000-0000-0000-000000000001';
 for(const favorite of [true,false])assert.deepEqual(parseFavoriteChange({id,favorite}),{id,favorite});
 for(const body of [null,[],{}, {id:'invalid',favorite:true},{id,favorite:'true'},{id,favorite:true,userId:'other'},{id,favorite:true,user_id:'other'}])assert.throws(()=>parseFavoriteChange(body));
});

test('Postgres isola favoritos por conta, preserva preferências e oculta contatos excluídos',async()=>{
 const db=new PGlite();
 try{
  await db.exec(await readFile(new URL('../neon/001_schema.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../neon/002_seed.sql',import.meta.url),'utf8'));
  const migration=await readFile(new URL('../neon/006_favorites.sql',import.meta.url),'utf8');
  await db.exec(migration);await db.exec(migration);
  await db.exec(`insert into app_members(user_id,role) values('alice','reader'),('bob','admin');`);
  const sql=async(strings:TemplateStringsArray,...values:unknown[])=>{
   const query=strings.reduce((q,s,i)=>q+(i?`$${i}`:'')+s,'');
   return (await db.query<Record<string,unknown>>(query,values)).rows;
  };
  const {rows}=await db.query<{id:string;blocked:boolean}>(`select id,blocked from people order by blocked desc,name limit 2`);
  const id=rows[0].id,second=rows[1].id;
  assert.deepEqual(await favoriteIds(sql,'alice'),[]);
  // Favoriting management is allowed for consultation and never changes blocked.
  assert.equal(await saveFavorite(sql,'alice',id,true),true);
  assert.equal(await saveFavorite(sql,'alice',id,true),true);
  assert.deepEqual(await favoriteIds(sql,'alice'),[id]);
  assert.deepEqual(await favoriteIds(sql,'bob'),[]);
  assert.equal(await saveFavorite(sql,'bob',id,false),true);
  assert.deepEqual(await favoriteIds(sql,'alice'),[id]);
  assert.equal(await saveFavorite(sql,'bob',id,true),true);
  assert.equal(await saveFavorite(sql,'alice',id,false),true);
  assert.deepEqual(await favoriteIds(sql,'alice'),[]);
  assert.deepEqual(await favoriteIds(sql,'bob'),[id]);
  assert.equal(await saveFavorite(sql,'alice',second,true),true);
  assert.equal((await db.query<{blocked:boolean}>(`select blocked from people where id=$1`,[id])).rows[0].blocked,true);
  await db.exec(`delete from app_members where user_id='alice'`);
  assert.deepEqual(await favoriteIds(sql,'alice'),[]);
  assert.equal(await saveFavorite(sql,'alice',second,false),false);
  await db.exec(`insert into app_members values('alice','reader')`);
  assert.deepEqual(await favoriteIds(sql,'alice'),[second]);
  await db.query(`update people set deleted_at=now() where id=$1`,[second]);
  assert.deepEqual(await favoriteIds(sql,'alice'),[]);
  assert.equal(await saveFavorite(sql,'alice',second,true),false);
  await db.exec(migration);await db.exec(await readFile(new URL('../neon/002_seed.sql',import.meta.url),'utf8'));
  assert.deepEqual(await favoriteIds(sql,'bob'),[id]);
  assert.equal(await saveFavorite(sql,'alice','00000000-0000-0000-0000-000000000000',true),false);
  await db.query(`delete from people where id=$1`,[id]);
  assert.deepEqual(await favoriteIds(sql,'bob'),[]);
  assert.equal((await db.query(`select person_id from person_favorites where person_id=$1`,[id])).rows.length,0);
 }finally{await db.close();}
});
