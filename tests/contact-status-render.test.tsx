import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import ContactStatus from '../components/ContactStatus';
import seed from '../data/people.json';
const person=seed.find(p=>!p.blocked)!;
test('cards apresentam identificação, férias e retorno com destaque correto',()=>{
 const html=renderToStaticMarkup(<ContactStatus person={{...person,user_not_found:true,absence_type:'vacation',return_date:'2026-11-10'}} today="2026-10-26"/>);
 assert.match(html,/Usuário não encontrado/);assert.match(html,/Férias/);assert.match(html,/10\/11\/2026/);assert.match(html,/status-away/);assert.doesNotMatch(html,/Disponível para contato/);
 const unknown=renderToStaticMarkup(<ContactStatus person={{...person,user_unknown:true}} today="2026-10-26"/>);assert.match(unknown,/Usuário desconhecido/);assert.match(unknown,/status-unknown/);
});
test('retorno encerra indicação de ausência e cargo mantém somente consulta',()=>{
 const html=renderToStaticMarkup(<ContactStatus person={{...person,email:'test@example.com',absence_type:'temporary',return_date:'2026-10-26'}} today="2026-10-26"/>);assert.doesNotMatch(html,/status-away/);assert.match(html,/Disponível para contato/);
 const blocked=renderToStaticMarkup(<ContactStatus person={{...person,role:'Gerente',blocked:true,absence_type:'vacation',return_date:'2026-11-10'}} today="2026-10-26"/>);assert.match(blocked,/somente consulta/);assert.match(blocked,/Férias/);
});
