import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validResetRequest,validResetSubmission,passwordValid} from '../lib/auth/password-reset';
import {isAllowedAuthRoute} from '../lib/auth/routes';
const origin='https://diteconecta.vercel.app';
test('recuperação aceita somente retorno para a página do próprio site',()=>{
 assert.equal(validResetRequest({email:'pessoa@example.com',redirectTo:origin+'/reset-password'},origin),true);
 for(const redirectTo of ['https://evil.example/reset-password',origin+'/login',origin+'/reset-password?next=https://evil.example',origin+'/reset-password#fragment','//evil.example/reset-password']){
  assert.equal(validResetRequest({email:'pessoa@example.com',redirectTo},origin),false);
 }
 assert.equal(validResetRequest({email:'invalido',redirectTo:origin+'/reset-password'},origin),false);
});
test('nova senha exige token e tamanho permitido',()=>{
 assert.equal(validResetSubmission({token:'example-token',newPassword:'uma-nova-senha'}),true);
 for(const value of [null,{}, {token:'',newPassword:'uma-nova-senha'},{token:'example-token',newPassword:'curta'},{token:'example-token',newPassword:'x'.repeat(129)}])assert.equal(validResetSubmission(value),false);
 assert.equal(passwordValid('x'.repeat(8)),true);assert.equal(passwordValid('x'.repeat(128)),true);
});
test('endpoints de recuperação são POST, sem administração pública de senha',()=>{
 for(const endpoint of ['request-password-reset','reset-password']){
  assert.equal(isAllowedAuthRoute('POST',endpoint),true);assert.equal(isAllowedAuthRoute('GET',endpoint),false);
 }
 for(const endpoint of ['admin/set-user-password','admin/set-role'])assert.equal(isAllowedAuthRoute('POST',endpoint),false);
});
