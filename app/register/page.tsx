'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Network,UserPlus} from 'lucide-react';
import {authClient} from '@/lib/browser';
import {authErrorMessage} from '@/lib/auth/errors';
export default function Register(){
 const[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');if(password!==confirm){setError('As senhas devem ser iguais.');return;}
  setBusy(true);try{
   const {error}=await authClient.signUp.email({name:name.trim(),email:email.trim().toLowerCase(),password});
   if(error)throw new Error(authErrorMessage(error,'Não foi possível cadastrar. Se você já possui conta, entre ou recupere sua senha.'));
   setPassword('');setConfirm('');setDone(true);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <main className="login"><section className="login-art"><Link href="/login" className="brand"><Network/> DITEC<span>conecta</span></Link><div><span className="eyebrow">ACESSO AO DIRETÓRIO</span><h1>Faça parte<br/>dessa conexão.</h1><p>Cadastre sua conta para solicitar acesso ao DITEC Conecta.</p></div><small>Diretoria de Tecnologia da Informação</small></section><section className="login-form"><UserPlus size={28}/><h2>{done?'Cadastro realizado':'Crie sua conta'}</h2>{done?<><p role="status">Seu cadastro aguarda aprovação de um administrador. Se receber um código por e-mail, confirme a conta pela opção “Confirmar e-mail com código” na página de login.</p><Link className="primary" href="/login">Ir para o login</Link></>:<><p>Após o cadastro, um administrador precisa liberar seu acesso.</p><form onSubmit={submit}><fieldset className="registration-fields" disabled={busy}><label>Nome completo<input required minLength={2} maxLength={160} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label><label>E-mail corporativo<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Senha<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar senha<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label></fieldset>{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy?'Cadastrando…':'Solicitar acesso'}</button></form><Link href="/login" className="secondary" style={{display:'flex',marginTop:14}}>Já tenho uma conta</Link></>}</section></main>;
}
