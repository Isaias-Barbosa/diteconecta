import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isAllowedAuthRoute} from '../lib/auth/routes';
test('confirmação e reenvio liberados somente por POST, sem cadastro ou login OTP',()=>{
 for(const endpoint of ['email-otp/send-verification-otp','email-otp/verify-email']){
  assert.equal(isAllowedAuthRoute('POST',endpoint),true);
  for(const method of ['GET','PATCH','DELETE'])assert.equal(isAllowedAuthRoute(method,endpoint),false);
 }
 for(const endpoint of ['sign-up/email','admin/create-user','admin/set-role','sign-in/email-otp','email-otp/reset-password','email-otp/check-verification-otp'])assert.equal(isAllowedAuthRoute('POST',endpoint),false);
});
