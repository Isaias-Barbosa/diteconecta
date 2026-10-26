import {LockKeyhole,Mail} from 'lucide-react';
import type {Person} from '@/lib/types';
import {activeAbsence,absenceLabel,dateLabel} from '@/lib/contact-status';
export default function ContactStatus({person,today,showDefault=true}:{person:Person;today?:string;showDefault?:boolean}){
 const absence=activeAbsence(person,today);
 const hasStatus=person.user_unknown||person.user_not_found||absence;
 return <>
  {person.user_unknown&&<small className="contact-status status-unknown"><span className="status-dot"/>Usuário desconhecido</small>}
  {person.user_not_found&&<small className="contact-status status-not-found"><span className="status-dot"/>Usuário não encontrado</small>}
  {absence&&<small className="contact-status status-away"><span className="status-dot"/>{absenceLabel(absence)} · retorna em {dateLabel(person.return_date!)}</small>}
  {showDefault&&(!hasStatus||person.blocked)&&<small>{person.blocked?<><LockKeyhole size={11}/>{person.role} · somente consulta</>:person.email?<><span className="ready-dot"/>Disponível para contato</>:<><Mail size={11}/>E-mail não cadastrado</>}</small>}
 </>;
}
