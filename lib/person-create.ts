import {isEmail} from './teams';
import {CONTACT_ROLES,isContactBlocked} from './contacts';
export function parsePersonCreate(input:unknown){
 if(!input||typeof input!=='object')throw new Error('Dados inválidos.');
 const body=input as Record<string,unknown>;
 if(Object.keys(body).some(k=>!['name','area','email','role'].includes(k)))throw new Error('Há campos que não podem ser informados no cadastro.');
 if(typeof body.name!=='string'||typeof body.area!=='string')throw new Error('Informe nome e área.');
 const name=body.name.trim().replace(/\s+/g,' '),area=body.area.trim().replace(/\s+/g,' ');
 if(name.length<2||name.length>160)throw new Error('Informe um nome de 2 a 160 caracteres.');
 if(area.length<2||area.length>160)throw new Error('Informe uma área de 2 a 160 caracteres.');
 if(typeof body.role!=='string'||!CONTACT_ROLES.includes(body.role as typeof CONTACT_ROLES[number]))throw new Error('Selecione um cargo válido.');
 if(body.email!==undefined&&body.email!==null&&typeof body.email!=='string')throw new Error('Informe um e-mail válido.');
 const email=typeof body.email==='string'?body.email.trim().toLowerCase()||null:null;
 if(email&&!isEmail(email))throw new Error('Informe um e-mail válido.');
 return {name,area,email,role:body.role,blocked:isContactBlocked({role:body.role,blocked:false})};
}
