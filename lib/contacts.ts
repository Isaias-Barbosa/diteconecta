import type {Person} from './types';
export const isSuperintendent=(person:Pick<Person,'role'>)=>person.role.trim().toLowerCase()==='superintendente';
// Apply the role rule even when an existing database still has blocked=false.
export const isContactBlocked=(person:Pick<Person,'role'|'blocked'>)=>person.blocked||isSuperintendent(person);
function returnDate(value:unknown):string|null{
 if(value instanceof Date)return value.toISOString().slice(0,10);
 return typeof value==='string'?value.slice(0,10):null;
}
export function applyContactPolicy(person:Person):Person{return {...person,blocked:isContactBlocked(person),user_unknown:person.user_unknown??false,user_not_found:person.user_not_found??false,absence_type:person.absence_type??null,return_date:returnDate(person.return_date)};}
