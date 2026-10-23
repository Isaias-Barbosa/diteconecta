import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authErrorMessage} from '../lib/auth/errors';
test('código expirado e domínio recusado geram ações distintas',()=>{
 assert.match(authErrorMessage({code:'OTP_EXPIRED',status:400},'Erro'),/código expirou/);
 assert.match(authErrorMessage({code:'INVALID_ORIGIN',status:403},'Erro'),/Domains/);
});
test('recusa desconhecida preserva o diagnóstico do provedor',()=>{
 assert.equal(authErrorMessage({code:'PROVIDER_REJECTED',message:'Provider blocked verification',status:403},'Erro genérico'),'Provider blocked verification [PROVIDER_REJECTED]');
 assert.equal(authErrorMessage({},'Tente novamente'),'Tente novamente');
 assert.match(authErrorMessage({status:429},'Erro'),/Aguarde/);
});
