import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'DITEC Conecta | Diretório de equipes',description:'Encontre sua equipe e prepare conversas no Teams.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
