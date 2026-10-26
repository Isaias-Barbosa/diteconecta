'use client';
import {LoaderCircle,Star} from 'lucide-react';
export default function FavoriteButton({name,favorite,busy,disabled,onClick}:{name:string;favorite:boolean;busy:boolean;disabled:boolean;onClick:()=>void}){
 const label=`${favorite?'Remover':'Adicionar'} ${name} ${favorite?'dos':'aos'} favoritos`;
 return <button type="button" className={`favorite-button ${favorite?'is-favorite':''}`} aria-label={label} title={label} aria-pressed={favorite} aria-busy={busy} disabled={disabled||busy} onClick={onClick}>{busy?<LoaderCircle className="spin" size={16}/>:<Star size={16} fill={favorite?'currentColor':'none'}/>}</button>;
}
