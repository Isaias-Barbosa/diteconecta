export function isAllowedAuthRoute(method:string,endpoint:string){
 if(method==='GET')return endpoint==='get-session';
 return method==='POST' && ['sign-in/email','sign-out','request-password-reset','reset-password','email-otp/send-verification-otp','email-otp/verify-email'].includes(endpoint);
}
