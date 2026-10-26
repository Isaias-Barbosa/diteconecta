export type FavoriteChange={id:string;favorite:boolean};
export function parseFavoriteChange(body:unknown):FavoriteChange{
 if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Informe o contato e se deseja favoritá-lo.');
 const b=body as Record<string,unknown>;
 if(Object.keys(b).some(k=>!['id','favorite'].includes(k))||typeof b.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id)||typeof b.favorite!=='boolean')throw new Error('Informe um contato válido e a opção de favorito.');
 return {id:b.id,favorite:b.favorite};
}
