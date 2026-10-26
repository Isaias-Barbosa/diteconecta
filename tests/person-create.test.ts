import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePersonCreate} from '../lib/person-create';
import {applyContactPolicy,isExecutiveSecretary} from '../lib/contacts';
import {teamsLink} from '../lib/teams';
import seed from '../data/people.json';

test('cadastro normaliza nome, área e e-mail e aceita contato sem e-mail',()=>{
 const person=parsePersonCreate({name:'  Nova   Pessoa ',area:'  Nova Área ',email:' NOVA@example.com ',role:'Integrante'});
 assert.deepEqual(person,{name:'Nova Pessoa',area:'Nova Área',email:'nova@example.com',role:'Integrante',blocked:false});
 assert.equal(parsePersonCreate({name:'Nova Pessoa',area:'Área',role:'Integrante'}).email,null);
});
test('cargos de gestão são bloqueados pelo servidor no cadastro',()=>{
 for(const role of ['Gerente','Superintendente','Diretor','Secretária executiva'])assert.equal(parsePersonCreate({name:'Contato',area:'Área',role}).blocked,true);
 for(const body of [{name:'',area:'Área',role:'Integrante'},{name:'Contato',area:'',role:'Integrante'},{name:'Contato',area:'Área',role:'Admin'},{name:'Contato',area:'Área',role:'Integrante',blocked:false},{name:'Contato',area:'Área',role:'Integrante',email:'invalido'}])assert.throws(()=>parsePersonCreate(body));
});
test('Secretaria Executiva fica bloqueada mesmo no banco antigo',()=>{
 const original=seed.find(p=>p.role==='Secretária executiva')!;
 const legacy={...original,blocked:false,email:'secretaria@example.com'};
 assert.equal(isExecutiveSecretary(legacy),true);
 assert.equal(isExecutiveSecretary({...legacy,role:' Secretaria Executiva '}),true);
 assert.equal(applyContactPolicy(legacy).blocked,true);
 assert.throws(()=>teamsLink(legacy,'Olá'),/bloqueado/);
});
