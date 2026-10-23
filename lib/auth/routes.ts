export function isAllowedAuthRoute(method:string,endpoint:string){
 if(method==='GET')return endpoint==='get-session';
 return method==='POST' && ['sign-in/email','sign-out','email-otp/send-verification-otp','email-otp/verify-email'].includes(endpoint);
}
