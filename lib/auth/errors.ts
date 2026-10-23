type AuthError={code?:string;message?:string;status?:number};
const messages:Record<string,string>={
 INVALID_TOKEN:'O link de recuperação é inválido ou expirou. Solicite um novo link.',
 TOKEN_EXPIRED:'O link de recuperação expirou. Solicite um novo link.',
 PASSWORD_TOO_SHORT:'A senha deve ter pelo menos 8 caracteres.',
 PASSWORD_TOO_LONG:'A senha deve ter no máximo 128 caracteres.',
 INVALID_ORIGIN:'O domínio do site não está autorizado no Neon Auth. Confira Auth → Configuration → Domains.',
 EMAIL_NOT_VERIFIED:'Este e-mail ainda não foi confirmado.',
 OTP_EXPIRED:'O código expirou. Solicite um novo e use o código mais recente.',
 INVALID_OTP:'O código é inválido ou expirou. Confira o código mais recente recebido por e-mail.',
 OTP_NOT_FOUND:'Não há código válido para esse e-mail. Solicite um novo código.',
 TOO_MANY_ATTEMPTS:'Muitas tentativas. Aguarde antes de tentar novamente.',
 TOO_MANY_REQUESTS:'Muitas solicitações. Aguarde antes de solicitar outro código.',
 EMAIL_ALREADY_VERIFIED:'Este e-mail já foi confirmado. Volte ao login e entre com sua senha.',
 EMAIL_VERIFICATION_DISABLED:'A confirmação por e-mail está desabilitada no Neon Auth.',
 EMAIL_VERIFICATION_IS_DISABLED:'A confirmação por e-mail está desabilitada no Neon Auth.',
};
export function authErrorMessage(error:AuthError,fallback:string){
 const code=typeof error.code==='string'?error.code:'';
 const detail=typeof error.message==='string'?error.message.trim().slice(0,250):'';
 const message=messages[code] || (error.status===429?'Muitas solicitações. Aguarde antes de tentar novamente.':detail||fallback);
 // Preserve the provider's diagnostic code; never include request data or auth tokens.
 return code?`${message} [${code}]`:message;
}
