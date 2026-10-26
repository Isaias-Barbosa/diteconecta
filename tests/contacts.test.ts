import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyContactPolicy,isSuperintendent} from '../lib/contacts';
import seed from '../data/people.json';
test('política normaliza bancos antigos sem alterar e-mail, nome ou função',()=>{
 const source={...seed.find(p=>p.role==='Superintendente')!,blocked:false,email:'contato@example.com'};
 const result=applyContactPolicy(source);
 assert.equal(result.blocked,true);assert.equal(result.email,source.email);assert.equal(result.role,source.role);assert.equal(source.blocked,false);
 assert.equal(isSuperintendent({...source,role:' Superintendente '}),true);
});
test('seis superintendentes ficam somente para consulta, sem bloquear integrantes',()=>{
 const result=seed.map(applyContactPolicy);
 assert.equal(result.filter(p=>p.blocked).length,29);
 assert.ok(result.filter(isSuperintendent).every(p=>p.blocked));
 assert.ok(result.filter(p=>p.role==='Integrante').every(p=>!p.blocked));
});
