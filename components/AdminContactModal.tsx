'use client';
import {useEffect,useRef,useState} from 'react';
import {LoaderCircle,Pencil,Trash2,X} from 'lucide-react';
import {api} from '@/lib/browser';
import type {AbsenceType,Person} from '@/lib/types';
import {activeAbsence,businessDate} from '@/lib/contact-status';
import {parsePersonUpdate} from '@/lib/person-update';

export function EditContactModal({person,onSave,onClose}:{person:Person;onSave:(person:Person)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const initialAbsence=activeAbsence(person);
 const[email,setEmail]=useState(person.email??''),[unknown,setUnknown]=useState(person.user_unknown??false),[notFound,setNotFound]=useState(person.user_not_found??false);
 const[absence,setAbsence]=useState<AbsenceType|''>(initialAbsence??''),[returnDate,setReturnDate]=useState(initialAbsence?person.return_date??'':'');
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
 async function save(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');
  const body={id:person.id,email:email.trim()||null,user_unknown:unknown,user_not_found:notFound,absence_type:absence||null,return_date:absence?returnDate:null};
  try{parsePersonUpdate(body);}catch(e){setError((e as Error).message);return;}
  setBusy(true);
  try{const {person:updated}=await api('/api/people',{method:'PATCH',body:JSON.stringify(body)});onSave(updated);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <dialog ref={dialog} className="message-modal edit-contact-modal" aria-labelledby="edit-contact-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><div className="modal-header"><div className="modal-icon"><Pencil size={22}/></div><button disabled={busy} aria-label="Fechar edição" onClick={onClose}><X size={20}/></button></div><span className="eyebrow">ADMINISTRAÇÃO DO CONTATO</span><h2 id="edit-contact-title">Editar contato</h2><div className="edit-contact-person"><strong>{person.name}</strong><small>{person.area}</small></div><form onSubmit={save}><fieldset disabled={busy} className="edit-fields"><label htmlFor="contact-email">E-mail do Teams (UPN)</label><input autoFocus id="contact-email" type="email" maxLength={254} autoComplete="off" placeholder="nome@empresa.com.br" value={email} onChange={e=>setEmail(e.target.value)}/><div className="status-checkboxes"><label><input type="checkbox" checked={unknown} onChange={e=>{setUnknown(e.target.checked);if(e.target.checked)setNotFound(false);}}/>Usuário desconhecido</label><label><input type="checkbox" checked={notFound} onChange={e=>{setNotFound(e.target.checked);if(e.target.checked)setUnknown(false);}}/>Usuário não encontrado</label></div><label htmlFor="contact-absence">Usuário ausente?</label><select id="contact-absence" value={absence} onChange={e=>{setAbsence(e.target.value as AbsenceType|'');setReturnDate('');}}><option value="">Não está ausente</option><option value="temporary">Ausência temporária</option><option value="vacation">Férias</option></select>{absence&&<><label htmlFor="contact-return">{absence==='vacation'?'Retorno das férias':'Retorno da ausência'}</label><input id="contact-return" type="date" required min={businessDate()} max="9999-12-31" value={returnDate} onChange={e=>setReturnDate(e.target.value)}/><small className="return-hint">Na data informada, o contato volta a aparecer sem a indicação de ausência.</small></>}{person.blocked&&<div className="modal-note"><p>Este contato continua somente para consulta, conforme seu cargo.</p></div>}</fieldset>{error&&<p className="error" role="alert">{error}</p>}<div className="modal-actions"><button className="secondary" type="button" disabled={busy} onClick={onClose}>Cancelar</button><button className="primary" disabled={busy}>{busy?<LoaderCircle size={16} className="spin"/>:<Pencil size={16}/>} {busy?'Salvando…':'Salvar alterações'}</button></div></form></dialog>;
}
export function DeleteContactModal({person,onDeleted,onClose}:{person:Person;onDeleted:(id:string)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);const[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
 async function remove(){setBusy(true);setError('');try{const {id}=await api('/api/people',{method:'DELETE',body:JSON.stringify({id:person.id})});onDeleted(id);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <dialog ref={dialog} className="message-modal" aria-labelledby="delete-contact-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><div className="modal-header"><div className="modal-icon delete-icon"><Trash2 size={22}/></div><button disabled={busy} aria-label="Cancelar exclusão" onClick={onClose}><X size={20}/></button></div><h2 id="delete-contact-title">Excluir contato?</h2><p><strong>{person.name}</strong> deixará de aparecer no diretório e na administração.</p><p className="modal-description">Isso não exclui nenhuma conta de acesso ao site. Os dados do contato são preservados para recuperação administrativa.</p>{error&&<p className="error" role="alert">{error}</p>}<div className="modal-actions"><button autoFocus className="secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="danger-button" disabled={busy} onClick={remove}>{busy?<LoaderCircle className="spin" size={16}/>:<Trash2 size={16}/>} {busy?'Excluindo…':'Excluir contato'}</button></div></dialog>;
}
