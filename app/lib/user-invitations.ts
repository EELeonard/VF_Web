import { ensureAdminDatabase } from "./admin-db";

const encode=(bytes:Uint8Array)=>{let value="";bytes.forEach(byte=>{value+=String.fromCharCode(byte)});return btoa(value).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")};
async function digest(value:string){const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));return Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("")}

export async function sendUserInvitation(database:D1Database,requestUrl:string,user:{username:string;displayName:string;email:string},runtime:{PUBLIC_SITE_URL?:string;RESEND_API_KEY?:string;ADMIN_EMAIL_FROM?:string;BOOKING_EMAIL_FROM?:string}){
  const db=await ensureAdminDatabase(database),token=encode(crypto.getRandomValues(new Uint8Array(32))),tokenHash=await digest(token),expires=new Date(Date.now()+60*60*1000).toISOString();
  await db.prepare("INSERT INTO password_reset_tokens (username,token_hash,expires_at) VALUES (?,?,?)").bind(user.username,tokenHash,expires).run();
  const origin=(runtime.PUBLIC_SITE_URL??new URL(requestUrl).origin).replace(/\/$/,""),link=`${origin}/admin/reset-password?token=${encodeURIComponent(token)}`,apiKey=runtime.RESEND_API_KEY?.trim(),from=(runtime.ADMIN_EMAIL_FROM??runtime.BOOKING_EMAIL_FROM)?.trim();
  if(!apiKey||!from)return {sent:false,error:"Benutzer wurde angelegt, aber der E-Mail-Dienst ist nicht konfiguriert.",previewLink:process.env.NODE_ENV==="production"?undefined:link};
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({from,to:[user.email],subject:"Ihr Vienna Flight Zugang",text:`Hallo ${user.displayName},\n\nIhr Vienna Flight Benutzerkonto wurde eingerichtet.\n\nBenutzername: ${user.username}\n\nÜber diesen Link legen Sie innerhalb einer Stunde Ihr persönliches Passwort fest:\n${link}\n\nVienna Flight`})});
  return response.ok?{sent:true}:{sent:false,error:"Benutzer wurde angelegt, aber die Einladungs-E-Mail konnte nicht zugestellt werden."};
}
