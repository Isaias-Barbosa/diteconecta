import {access,AccessError,demo,demoPeople,fail,json,sameOrigin} from '@/lib/server';
import {parseFavoriteChange} from '@/lib/favorites';
import {favoriteIds,saveFavorite} from '@/lib/favorites-store';

const globalStore=globalThis as typeof globalThis & {demoFavorites?:Set<string>};
function demoFavorites(){return globalStore.demoFavorites??=new Set<string>();}
function favoritesError(error:unknown){
 if((error as {code?:string}).code==='42P01')return fail(new AccessError('Favoritos ainda não foram habilitados. Solicite ao administrador a atualização do sistema.',503));
 return fail(error);
}
export async function GET(request:Request){try{
 if(demo)return json({ids:[...demoFavorites()].filter(id=>demoPeople().some(p=>p.id===id&&!p.deleted_at))});
 const {sql,userId}=await access(request);
 return json({ids:await favoriteIds(sql,userId)});
}catch(e){return favoritesError(e);}}
export async function PUT(request:Request){try{
 sameOrigin(request);
 const session=demo?null:await access(request);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 let change;try{change=parseFavoriteChange(body);}catch(e){throw new AccessError((e as Error).message,400);}
 if(demo){
  if(change.favorite&&!demoPeople().some(p=>p.id===change.id&&!p.deleted_at))throw new AccessError('Contato não encontrado.',404);
  if(change.favorite)demoFavorites().add(change.id);else demoFavorites().delete(change.id);
 }else if(!await saveFavorite(session!.sql,session!.userId,change.id,change.favorite))throw new AccessError('Contato não encontrado ou acesso revogado.',404);
 return json(change);
}catch(e){return favoritesError(e);}}
