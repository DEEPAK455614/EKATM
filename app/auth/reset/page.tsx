'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {authMessage} from '@/components/SurveyAuth';
import s from '@/components/SimpleSurvey.module.css';
export default function ResetPassword(){
 const [ready,setReady]=useState(false),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setReady(!!data.session));const {data}=supabase.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'||session)setReady(true);});return()=>data.subscription.unsubscribe();},[]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(password!==confirm){setMessage('Passwords do not match.');return;}setBusy(true);try{const {error}=await supabase.auth.updateUser({password});if(error)throw error;setDone(true);setMessage('Password updated. You can return to your survey.');}catch(error){setMessage(authMessage(error));}finally{setBusy(false);}};
 return <main className={s.home}><form className={s.sectionCard} style={{maxWidth:480,margin:'60px auto'}} onSubmit={submit}><h1>Choose a new password</h1>{!ready?<p>Open the latest reset link from your email. If it has expired, request another from the sign-in page.</p>:!done&&<><label className={s.field}><span>New password</span><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label className={s.field}><span>Confirm new password</span><input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button className={s.primary} disabled={busy}>Update password</button></>}{message&&<p role="status">{message}</p>}<p><a href="/field">Return to Surveyor Portal</a></p></form></main>;
}
