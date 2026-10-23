'use client';
import { createClient } from '@supabase/supabase-js';
let instance:ReturnType<typeof createClient>|undefined;
export function browserDb(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url || !key) return null;
 return instance??=(createClient(url,key));
}
export async function api(path:string,options:RequestInit={}){
 const db=browserDb();const token=db?(await db.auth.getSession()).data.session?.access_token:null;
 const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...options.headers},cache:'no-store'});
 const data=await response.json();
 if(!response.ok){if(response.status===401)window.location.assign('/login');throw new Error(data.error??'Não foi possível concluir a operação.');}
 return data;
}
