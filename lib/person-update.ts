import {isEmail} from './teams';
import {businessDate,isDate} from './contact-status';
import type {AbsenceType} from './types';
export type PersonUpdate={id:string;email:string|null;status?:{user_unknown:boolean;user_not_found:boolean;absence_type:AbsenceType|null;return_date:string|null}};
export function parsePersonUpdate(input:unknown,today=businessDate()):PersonUpdate{
 if(!input||typeof input!=='object')throw new Error('Dados inválidos.');
 const body=input as Record<string,unknown>;
 const allowed=['id','email','user_unknown','user_not_found','absence_type','return_date'];
 if(Object.keys(body).some(k=>!allowed.includes(k)))throw new Error('Há campos que não podem ser alterados.');
 if(typeof body.id!=='string'||!body.id||body.id.length>64||!Object.hasOwn(body,'email')||(body.email!==null&&typeof body.email!=='string'))throw new Error('Informe contato e e-mail.');
 const email=typeof body.email==='string'?body.email.trim().toLowerCase()||null:null;
 if(email&&!isEmail(email))throw new Error('Informe um e-mail válido.');
 const result:PersonUpdate={id:body.id,email};
 const withStatus=['user_unknown','user_not_found','absence_type','return_date'].some(k=>Object.hasOwn(body,k));
 if(!withStatus)return result;
 if(typeof body.user_unknown!=='boolean'||typeof body.user_not_found!=='boolean')throw new Error('Informe as marcações de identificação do usuário.');
 if(body.user_unknown&&body.user_not_found)throw new Error('Escolha usuário desconhecido ou não encontrado.');
 const absence=body.absence_type;
 if(absence!==null&&absence!=='temporary'&&absence!=='vacation')throw new Error('Selecione uma ausência válida.');
 if(absence!==null&&(!isDate(body.return_date)||body.return_date<today))throw new Error('Informe uma data de retorno válida a partir de hoje.');
 if(absence===null&&body.return_date!==null)throw new Error('Remova a data de retorno quando o usuário não estiver ausente.');
 result.status={user_unknown:body.user_unknown,user_not_found:body.user_not_found,absence_type:absence,return_date:absence?body.return_date as string:null};
 return result;
}
