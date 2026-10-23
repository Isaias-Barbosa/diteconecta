'use client';
import { createAuthClient } from '@neondatabase/auth/next';
export const authClient=createAuthClient();

export async function api(path:string,options:RequestInit={}){
 const response=await fetch(path,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...options.headers},cache:'no-store'});
 const data=await response.json();
 if(!response.ok){if(response.status===401)window.location.assign('/login');throw new Error(data.error??'Não foi possível concluir a operação.');}
 return data;
}
