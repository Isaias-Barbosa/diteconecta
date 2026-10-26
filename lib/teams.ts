import type { Person } from './types';
import {isContactBlocked} from './contacts';
export const isEmail=(value:string)=>value.length<=254 && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);
export function teamsLink(person:Person,message:string){
 if(isContactBlocked(person)) throw new Error('Contato bloqueado para mensagens.');
 if(!person.email || !isEmail(person.email)) throw new Error('Cadastre um e-mail válido para este contato.');
 const text=message.trim();
 if(!text || text.length>1500) throw new Error('Escreva uma mensagem de até 1.500 caracteres.');
 const url=new URL('https://teams.microsoft.com/l/chat/0/0');
 url.searchParams.set('users',person.email);url.searchParams.set('message',text);
 return url.toString();
}
