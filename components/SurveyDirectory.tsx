'use client';
import {useMemo,useState} from 'react';
import {surveyDirectory,csvCell} from '@/lib/survey-directory';
import {statusLabel,type SimpleSurveyData} from '@/lib/simple-survey';
import {reportLines} from '@/lib/survey-report-model';
import s from './SimpleSurvey.module.css';
type Row={id:string;state_name:string;status:string;form_data:SimpleSurveyData};
export default function SurveyDirectory({forms,onOpen}:{forms:Row[];onOpen:(id:string)=>void}){
 const [query,setQuery]=useState(''),[kind,setKind]=useState('All');
 const entries=useMemo(()=>forms.flatMap(form=>surveyDirectory(form.form_data).map(entry=>({...entry,form}))),[forms]);
 const visible=entries.filter(e=>(kind==='All'||e.kind===kind)&&JSON.stringify([e.name,e.context,e.value,e.form.state_name]).toLowerCase().includes(query.toLowerCase()));
 const exportCsv=()=>{const rows=[['Type','Name','Context','State','Review Status','Details'],...visible.map(e=>[e.kind,e.name,e.context,e.form.state_name,statusLabel(e.form.status),reportLines(e.value).join('\n')])];const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Ekatma_survey_directory.csv';a.click();URL.revokeObjectURL(url);};
 return <section className={s.sectionCard} style={{marginTop:16}}><h3>People, Organizations, Routes & Events</h3><div className={s.grid2}><label className={s.field}><span>Search every recorded detail</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, mobile, district, route, halt or event"/></label><label className={s.field}><span>Record type</span><select value={kind} onChange={e=>setKind(e.target.value)}>{['All','Person','Organization','Rath Yatra','Major Halt','Night Halt','Gathering','Event','Proposed Route','Action','Committee'].map(v=><option key={v}>{v}</option>)}</select></label></div><button className={s.secondary} onClick={exportCsv}>Export matching details (CSV)</button><p>{visible.length} records · current survey filters apply</p>{visible.map((e,i)=><details className={s.readItem} key={`${e.form.id}:${e.kind}:${i}`}><summary>{e.kind} · {e.name} · {e.form.state_name} · {statusLabel(e.form.status)}</summary><p>{e.context}</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{reportLines(e.value).join('\n')}</p><button className={s.secondary} onClick={()=>onOpen(e.form.id)}>Open survey & evidence</button></details>)}</section>;
}
