import type {Person} from './types';
export const isSuperintendent=(person:Pick<Person,'role'>)=>person.role.trim().toLowerCase()==='superintendente';
// Apply the role rule even when an existing database still has blocked=false.
export const isContactBlocked=(person:Pick<Person,'role'|'blocked'>)=>person.blocked||isSuperintendent(person);
export function applyContactPolicy(person:Person):Person{return {...person,blocked:isContactBlocked(person)};}
