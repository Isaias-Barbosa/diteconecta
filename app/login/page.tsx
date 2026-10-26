'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {authClient} from '@/lib/browser';
import {authErrorMessage} from '@/lib/auth/errors';
import {isEmail} from '@/lib/teams';
import {ArrowUpRight,Network,ShieldCheck} from 'lucide-react';

export default function Login(){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[code,setCode]=useState('');
 const[step,setStep]=useState<'login'|'verify'>('login'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[cooldown,setCooldown]=useState(0);
 useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(cooldown-1),1000);return()=>clearTimeout(timer);},[cooldown]);
 function openVerification(){setStep('verify');setPassword('');setCode('');setError('');setNotice('Informe o código recebido no e-mail. Se expirou, solicite um novo.');}
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');setNotice('');
  try{
   const {error}=await authClient.signIn.email({email:email.trim(),password});
   if(error){
    if(error.code==='EMAIL_NOT_VERIFIED'){openVerification();return;}
    throw new Error(authErrorMessage(error,error.status===503?'Configure o Neon Auth na Vercel. Consulte o README.':'Não foi possível entrar. Confira e-mail e senha. Se falta verificar a conta, use “Confirmar e-mail com código”.'));
   }
   window.location.assign('/');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar. Tente novamente.');}finally{setBusy(false);}
 }
 async function verify(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');setNotice('');
  try{
   const {error}=await authClient.emailOtp.verifyEmail({email:email.trim(),otp:code.trim()});
   if(error)throw new Error(authErrorMessage(error,'Não foi possível confirmar. Confira o código e o e-mail ou solicite um novo código.'));
   setCode('');setPassword('');setStep('login');setNotice('E-mail confirmado! Entre com sua senha para continuar.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível verificar o e-mail.');}finally{setBusy(false);}
 }
 async function resend(){
  if(!isEmail(email.trim())){setError('Informe um e-mail válido para receber o código.');return;}
  setBusy(true);setError('');setNotice('');
  try{
   const {error}=await authClient.emailOtp.sendVerificationOtp({email:email.trim(),type:'email-verification'});
   if(error)throw new Error(authErrorMessage(error,'Não foi possível solicitar o código. Confira o e-mail e tente novamente.'));
   setCooldown(60);setCode('');setNotice('Se a conta precisar de confirmação, um novo código será enviado. Confira também a caixa de spam.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível reenviar o código.');}finally{setBusy(false);}
 }
 return <main className="login"><section className="login-art"><div className="brand"><Network/> DITEC<span>conecta</span></div><div><span className="eyebrow">PESSOAS. EQUIPES. CONVERSAS.</span><h1>A conexão certa<br/>começa aqui.</h1><p>Seu diretório de equipes, organizado para facilitar o próximo contato.</p></div><small>Diretoria de Tecnologia da Informação</small></section><section className="login-form"><ShieldCheck size={28}/><h2>{step==='verify'?'Confirme seu e-mail':'Bem-vindo de volta'}</h2><p>{step==='verify'?'Digite o código enviado ao e-mail usado na criação da conta.':'Entre com sua conta aprovada pelo administrador.'}</p><form onSubmit={step==='verify'?verify:submit}><label>E-mail<input type="email" required disabled={busy} value={email} onChange={e=>{setEmail(e.target.value);setCode('');setError('');}} autoComplete="username"/></label>{step==='verify'?<label>Código de verificação<input key="otp" autoFocus type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4,10}" minLength={4} maxLength={10} required disabled={busy} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="Código recebido no e-mail"/></label>:<label>Senha<input key="password" type="password" required disabled={busy} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>}{error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="success">{notice}</p>}<button className="primary" disabled={busy}>{busy?'Aguarde…':step==='verify'?'Confirmar e-mail':'Entrar no diretório'}<ArrowUpRight size={18}/></button>{step==='verify'?<div style={{display:'grid',gap:12,marginTop:18}}><button type="button" className="secondary" disabled={busy||cooldown>0} onClick={resend}>{cooldown>0?`Reenviar em ${cooldown}s`:'Reenviar código'}</button><button type="button" disabled={busy} onClick={()=>{setStep('login');setCode('');setError('');setNotice('');}}>Voltar para o login</button></div>:<><Link href="/register" className="secondary" style={{display:'flex',marginTop:14}}>Criar conta / solicitar acesso</Link><Link href="/forgot-password" className="secondary" style={{display:'flex',marginTop:14}}>Esqueci minha senha</Link><button type="button" className="secondary" style={{width:'100%',marginTop:14}} disabled={busy} onClick={openVerification}>Confirmar e-mail com código</button></>}</form><small>Acesso restrito aos usuários autorizados.</small></section></main>;
}
