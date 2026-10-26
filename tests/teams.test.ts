import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teamsLink,isEmail} from '../lib/teams';
import seed from '../data/people.json';
const person={...seed.find(p=>!p.blocked)!,email:'pessoa+teste@empresa.com.br'};
test('link preserva destinatário único e texto com acentos, quebras e parâmetros',()=>{
 const message='Olá, Isaías!\nRDM & testes? #123 + revisão';
 const url=new URL(teamsLink(person,message));
 assert.equal(url.origin,'https://teams.microsoft.com');assert.equal(url.pathname,'/l/chat/0/0');
 assert.equal(url.searchParams.get('users'),person.email);assert.equal(url.searchParams.get('message'),message);
});
test('bloqueio independe de existir e-mail',()=>{assert.throws(()=>teamsLink({...person,blocked:true},'Olá'),/bloqueado/);});
test('não abre sem destinatário ou mensagem válida',()=>{
 assert.throws(()=>teamsLink({...person,email:null},'Oi'));
 for(const message of ['', '   ','a'.repeat(1501)])assert.throws(()=>teamsLink(person,message));
 for(const email of ['dois@empresa.com,outro@empresa.com','a@b.com;outro@b.com','x\ny@b.com'])assert.equal(isEmail(email),false);
});
test('base inclui todos os níveis e bloqueia gerentes, diretoria e superintendências',()=>{
 assert.equal(seed.length,112);assert.equal(new Set(seed.map(p=>p.id)).size,112);
 assert.equal(seed.filter(p=>p.blocked).length,29);assert.ok(seed.every(p=>p.email===null));
 const area=seed.filter(p=>p.area==='Área de Sistemas de Adquirência');assert.equal(area.length,6);
 assert.deepEqual(area.filter(p=>p.blocked).map(p=>p.name),['Ricardo Jorge Osório de Cerqueira']);
 assert.equal(seed.filter(p=>p.role==='Superintendente').length,6);
});

test('superintendente é bloqueado mesmo se o banco antigo indicar blocked=false',()=>{
 const superintendent=seed.find(p=>p.role==='Superintendente')!;
 assert.throws(()=>teamsLink({...superintendent,blocked:false,email:'superintendente@example.com'},'Olá'),/bloqueado/);
});
