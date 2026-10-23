import {access,demo,demoPeople,fail,json,AccessError} from '@/lib/server';
import {teamsLink} from '@/lib/teams';
export async function POST(request:Request){try{
 const session=demo?null:await access(request);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 if(typeof body.id!=='string'||typeof body.message!=='string')throw new AccessError('Informe contato e mensagem.',400);
 let person;
 if(demo)person=demoPeople().find(p=>p.id===body.id);
 else {const result=await session!.db.from('people').select('*').eq('id',body.id).single();if(!result.error)person=result.data;}
 if(!person)throw new AccessError('Contato não encontrado.',404);
 try{return json({url:teamsLink(person,body.message)});}catch(e){throw new AccessError((e as Error).message,400);}
}catch(e){return fail(e);}}
