import {access,demo,demoPeople,fail,json,AccessError} from '@/lib/server';
import {isEmail} from '@/lib/teams';
export async function GET(request:Request){try{
 if(demo)return json({people:demoPeople(),admin:true,demo:true});
 const {db,admin}=await access(request);const {data,error}=await db.from('people').select('*').order('name');
 if(error)throw new Error('Não foi possível carregar os contatos. Verifique a instalação do banco.');
 return json({people:data,admin,demo:false});
}catch(e){return fail(e);}}
export async function PATCH(request:Request){try{
 const session=demo?null:await access(request);
 if(session && !session.admin)throw new AccessError('Somente administradores podem editar e-mails.',403);
 let body;try{body=await request.json();}catch{throw new AccessError('Dados inválidos.',400);}
 if(typeof body.id!=='string' || !Object.hasOwn(body,'email') || (body.email!==null && typeof body.email!=='string'))throw new AccessError('Informe contato e e-mail.',400);
 const email=body.email?.trim().toLowerCase()||null;
 if(email && !isEmail(email))throw new AccessError('Informe um e-mail válido.',400);
 if(demo){const person=demoPeople().find(p=>p.id===body.id);if(!person)throw new AccessError('Contato não encontrado.',404);person.email=email;return json({person});}
 const {data,error}=await session!.db.from('people').update({email}).eq('id',body.id).select().single();
 if(error)throw new AccessError('Não foi possível salvar o e-mail. Verifique se já está em outro contato.',400);
 return json({person:data});
}catch(e){return fail(e);}}
