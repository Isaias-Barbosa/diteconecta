type Sql=(strings:TemplateStringsArray,...values:unknown[])=>Promise<Record<string,unknown>[]>;

// actorId always comes from the validated server session, never from request data.
export async function favoriteIds(sql:Sql,actorId:string):Promise<string[]>{
 const rows=await sql`select f.person_id::text as id from public.person_favorites f join public.people p on p.id=f.person_id where f.user_id=${actorId} and coalesce(to_jsonb(p)->>'deleted_at','')='' and exists(select 1 from public.app_members where user_id=${actorId}) order by f.created_at,f.person_id`;
 return rows.map(row=>String(row.id));
}
export async function saveFavorite(sql:Sql,actorId:string,id:string,favorite:boolean):Promise<boolean>{
 if(favorite){
  const rows=await sql`insert into public.person_favorites(user_id,person_id) select ${actorId},p.id from public.people p where p.id=${id}::uuid and coalesce(to_jsonb(p)->>'deleted_at','')='' and exists(select 1 from public.app_members where user_id=${actorId}) on conflict(user_id,person_id) do update set person_id=excluded.person_id returning person_id`;
  return rows.length>0;
 }
 // Removal is idempotent, including a contact that has since been deleted.
 const rows=await sql`with authorized as (select user_id from public.app_members where user_id=${actorId}), removed as (delete from public.person_favorites where user_id=${actorId} and person_id=${id}::uuid and exists(select 1 from authorized) returning person_id) select user_id from authorized`;
 return rows.length>0;
}
