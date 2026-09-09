'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import s from './SimpleSurvey.module.css';
export default function SurveyProfile({user,onClose}:{user:any;onClose:()=>void}){
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[designation,setDesignation]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{supabase.from('profiles').select('full_name,phone,designation').eq('id',user.id).single().then(({data,error})=>{if(error)setMessage(error.message);if(data){setName(data.full_name||'');setPhone(data.phone||'');setDesignation(data.designation||'');}})},[user.id]);
 const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);const {error}=await supabase.from('profiles').update({full_name:name.trim(),phone:phone.trim(),designation:designation.trim()}).eq('id',user.id);setMessage(error?error.message:'Profile updated. Your administrator can see these details.');setBusy(false);};
 return <section className={s.sectionCard} style={{maxWidth:680,margin:'20px auto'}}><div className={s.cardTitle}><h2>My surveyor profile</h2><button className={s.secondary} onClick={onClose}>Close</button></div><p>{user.email}</p><form onSubmit={save}><label className={s.field}><span>Full name</span><input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label className={s.field}><span>Phone</span><input type="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)}/></label><label className={s.field}><span>Role / designation</span><input maxLength={120} value={designation} onChange={e=>setDesignation(e.target.value)}/></label><button className={s.primary} disabled={busy}>Save profile</button>{message&&<p role="status">{message}</p>}</form></section>;
}
