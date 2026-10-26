import type {AbsenceType,Person} from './types';
export function businessDate(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get=(type:string)=>parts.find(p=>p.type===type)!.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
export function isDate(value:unknown):value is string{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+'T00:00:00Z');
 return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
export const dateLabel=(value:string)=>value.split('-').reverse().join('/');
export function activeAbsence(person:Person,today=businessDate()):AbsenceType|null{
 return person.absence_type&&isDate(person.return_date)&&person.return_date>today?person.absence_type:null;
}
export function absenceLabel(type:AbsenceType){return type==='vacation'?'Férias':'Ausência temporária';}
