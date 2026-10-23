'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Network,ShieldCheck} from 'lucide-react';
import {authClient} from '@/lib/browser';
import {authErrorMessage} from '@/lib/auth/errors';
import {passwordValid} from '@/lib/auth/password-reset';

export default function PasswordRecovery({reset=false}:{reset?:boolean}){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const[token,setToken]=useState(''),[checked,setChecked]=useState(!reset),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const[busy,setBusy]=useState(false),[done,setDone]=useState(false),[cooldown,setCooldown]=useState(0);
 useEffect(()=>{
  if(!reset)return;
  const params=new URLSearchParams(window.location.search);
  const value=params.get('token');
  if(value && value!=='INVALID_TOKEN' && !params.has('error'))setToken(value);
  else setError('O link está ausente, é inválido ou expirou. Solicite um novo link de recuperação.');
  setChecked(true);
 },[reset]);
 useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(cooldown-1),1000);return()=>clearTimeout(timer);},[cooldown]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setNotice('');
  if(reset && (!passwordValid(password)||password!==confirm)){setError('Use uma senha de 8 a 128 caracteres e confirme a mesma senha nos dois campos.');return;}
  setBusy(true);
  try{
   if(reset){
    if(!token)throw new Error('Abra o link de recuperação enviado para seu e-mail.');
    const {error}=await authClient.resetPassword({newPassword:password,token});
    if(error)throw new Error(authErrorMessage(error,'Não foi possível redefinir a senha. Solicite um novo link e tente novamente.'));
    setToken('');setPassword('');setConfirm('');setDone(true);
    window.history.replaceState(null,'','/reset-password');
    setNotice('Senha redefinida! Entre com sua nova senha.');
   }else{
    const {error}=await authClient.requestPasswordReset({email:email.trim(),redirectTo:window.location.origin+'/reset-password'});
    if(error)throw new Error(authErrorMessage(error,'Não foi possível solicitar a recuperação. Tente novamente.'));
    setCooldown(60);setNotice('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Confira também a caixa de spam.');
   }
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir. Tente novamente.');}finally{setBusy(false);}
 }
 return <main className="login"><section className="login-art"><Link href="/login" className="brand"><Network/> DITEC<span>conecta</span></Link><div><span className="eyebrow">SEU ACESSO, DE VOLTA.</span><h1>Vamos recuperar<br/>sua conexão.</h1><p>Redefina sua senha e continue suas conversas com a equipe.</p></div><small>Diretoria de Tecnologia da Informação</small></section><section className="login-form"><ShieldCheck size={28}/><h2>{reset?'Defina sua nova senha':'Esqueceu sua senha?'}</h2><p>{reset?'Escolha uma nova senha para a sua conta.':'Informe o e-mail da sua conta para receber um link de recuperação.'}</p>{!checked?<p role="status">Preparando formulário…</p>:!done&&(!reset||token)?<form onSubmit={submit}>{reset?<><label>Nova senha<input autoFocus type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirmar nova senha<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required disabled={busy} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label></>:<label>E-mail<input autoFocus type="email" autoComplete="email" required disabled={busy} value={email} onChange={e=>setEmail(e.target.value)}/></label>}{error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="success" role="status">{notice}</p>}<button className="primary" disabled={busy||(!reset&&cooldown>0)}>{busy?'Aguarde…':reset?'Salvar nova senha':cooldown>0?`Reenviar em ${cooldown}s`:'Enviar link de recuperação'}<ArrowUpRight size={18}/></button></form>:<>{error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="success">{notice}</p>}</>}{reset&&!done&&checked&&<Link className="secondary" href="/forgot-password" style={{display:'flex',marginTop:14}}>Solicitar novo link</Link>}<Link className="secondary" href="/login" style={{display:'flex',marginTop:18}}>Voltar para o login</Link><small>A recuperação mantém sua conta e suas permissões.</small></section></main>;
}
