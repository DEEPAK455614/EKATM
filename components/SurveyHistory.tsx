'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {downloadSimpleSurveyPdf} from '@/lib/simple-report';
import s from './SimpleSurvey.module.css';
export default function SurveyHistory({formId}:{formId:string}){
 const [rows,setRows]=useState<any[]>([]),[message,setMessage]=useState('');
 useEffect(()=>{supabase.from('simple_survey_versions').select('id,revision,status,created_at,review_notes').eq('form_id',formId).order('revision',{ascending:false}).limit(50).then(({data,error})=>{setRows(data||[]);if(error)setMessage(error.message)});},[formId]);
 const download=async(id:string)=>{const {data,error}=await supabase.from('simple_survey_versions').select('form_data,revision').eq('id',id).single();if(error){setMessage(error.message);return;}await downloadSimpleSurveyPdf(data.form_data,`Survey_version_${data.revision}.pdf`);};
 return <details className={s.sectionCard} style={{margin:'16px 0'}}><summary>Saved version history ({rows.length}{rows.length===50?'+':''})</summary><p>Latest 50 saved versions. Each records the survey exactly as it was saved at that time.</p>{message&&<p role="status">{message}</p>}{rows.map(r=><div className={s.readItem} key={r.id}><b>Version {r.revision} · {r.status}</b><p>{new Date(r.created_at).toLocaleString()} · {r.review_notes}</p><button className={s.secondary} onClick={()=>download(r.id)}>Download this version</button></div>)}</details>;
}
