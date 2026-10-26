import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activeAbsence,businessDate,isDate} from '../lib/contact-status';
import {parsePersonUpdate} from '../lib/person-update';
import {applyContactPolicy} from '../lib/contacts';
import seed from '../data/people.json';
const person=seed.find(p=>!p.blocked)!;
const update={id:person.id,email:' PESSOA@example.com ',user_unknown:false,user_not_found:true,absence_type:'vacation',return_date:'2026-11-10'};
test('salva marcações e ausência, normalizando o e-mail',()=>{
 const parsed=parsePersonUpdate(update,'2026-10-26');
 assert.equal(parsed.email,'pessoa@example.com');assert.equal(parsed.status?.user_not_found,true);assert.equal(parsed.status?.return_date,'2026-11-10');
 assert.equal(parsePersonUpdate({id:person.id,email:null}).status,undefined);
});
test('rejeita alteração de cargo, identificação conflitante e data inválida',()=>{
 for(const body of [{...update,blocked:false},{...update,user_unknown:true},{...update,return_date:null},{...update,return_date:'2026-02-30'},{...update,return_date:'2026-10-20'},{...update,absence_type:'other'},{...update,absence_type:null}])assert.throws(()=>parsePersonUpdate(body,'2026-10-26'));
 assert.equal(isDate('2028-02-29'),true);assert.equal(isDate('2026-02-29'),false);
});
test('ausência termina na data de retorno no horário de Brasília',()=>{
 const away={...person,absence_type:'temporary' as const,return_date:'2026-11-10'};
 assert.equal(activeAbsence(away,'2026-11-09'),'temporary');assert.equal(activeAbsence(away,'2026-11-10'),null);
 assert.equal(businessDate(new Date('2026-11-10T01:00:00Z')),'2026-11-09');
 assert.equal(businessDate(new Date('2026-11-10T03:00:00Z')),'2026-11-10');
});
test('retorno é normalizado para data sem hora sem liberar cargos bloqueados',()=>{
 const result=applyContactPolicy({...person,role:'Superintendente',blocked:false,return_date:'2026-11-10T00:00:00.000Z'});
 assert.equal(result.return_date,'2026-11-10');assert.equal(result.blocked,true);
});
