'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {downloadSimpleSurveyPdf,downloadDailySurveyPdf} from '@/lib/simple-report';
import {reportEntries,reportLabel,reportSections,type ReportMeta} from '@/lib/survey-report-model';
import type {SimpleSurveyData} from '@/lib/simple-survey';
import s from './SimpleSurvey.module.css';

function RecordValue({value}:{value:unknown}){
 if(value===null||value===undefined||value==='')return <span>Not recorded</span>;
 if(typeof value==='boolean')return <span>{value?'Yes':'No'}</span>;
 if(typeof value!=='object')return <span>{String(value)}</span>;
 if(Array.isArray(value))return value.length?<ol>{value.map((x,i)=><li key={i}><RecordValue value={x}/></li>)}</ol>:<p>No entries recorded</p>;
 return <dl>{reportEntries(value).map(([key,v])=><div key={key}><dt>{reportLabel(key)}</dt><dd><RecordValue value={v}/></dd></div>)}</dl>;
}
export default function SurveyReport({data,meta={}}:{data:SimpleSurveyData;meta?:ReportMeta}){
 const [open,setOpen]=useState(false),[dayId,setDayId]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const dialog=useRef<HTMLDivElement>(null),opener=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const prior=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);if(e.key==='Tab'){const elements=Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select,a[href]')||[]);const first=elements[0],last=elements.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){e.preventDefault();first?.focus();}}};
  document.addEventListener('keydown',onKey);return()=>{document.body.style.overflow=prior;document.removeEventListener('keydown',onKey);opener.current?.focus();};},[open]);
 const download=async()=>{setBusy(true);setMessage('');try{if(dayId)await downloadDailySurveyPdf(data,dayId,meta);else await downloadSimpleSurveyPdf(data,undefined,meta);}catch{setMessage('Could not create the PDF. Open the detailed report and use Print / Save PDF.');}finally{setBusy(false);}};
 const sections=reportSections(data,meta,dayId||undefined);
 return <section className={s.sectionCard} style={{margin:'16px 0'}}><h3>{['submitted','reviewed'].includes(meta.status||'')?'Your completed survey report':'Detailed survey report'}</h3><p>All daily entries and survey details are compiled automatically. Review the full report here before or after submission.</p><p>For Hindi or mixed-language text, open the report and choose <b>Print / Save PDF</b>.</p><label className={s.field}><span>Report scope</span><select value={dayId} onChange={e=>setDayId(e.target.value)}><option value="">Complete State survey — all days and sections</option>{[...data.dailyLogs].sort((a,b)=>a.dayNo-b.dayNo).map(d=><option key={d.id} value={d.id}>Day {d.dayNo} · {d.date||'Date not recorded'}</option>)}</select></label><div className={s.reviewActions}><button ref={opener} className={s.primary} onClick={()=>setOpen(true)}>View detailed report</button><button className={s.secondary} disabled={busy} onClick={download}>{busy?'Preparing PDF…':'Download PDF (English)'}</button></div>{message&&<p role="status">{message}</p>}
 {open&&createPortal(<div className="survey-report-overlay" role="dialog" aria-modal="true" aria-label="Detailed survey report" tabIndex={-1} ref={dialog}><div className="survey-report-toolbar"><button onClick={()=>setOpen(false)}>Close report</button><button onClick={()=>window.print()}>Print / Save PDF</button></div><article className="survey-report-document"><p className="report-kicker">EKATMA YATRA · STATE SURVEY</p><h1>{data.meta.state} — {dayId?'Daily Activity Report':'Comprehensive Survey Report'}</h1><p>This report contains the information recorded by the survey team. Blank fields mean information has not been recorded. Supporting files remain privately available in the survey portal.</p><nav aria-label="Report contents"><b>Report contents</b><ol>{sections.map((section,i)=><li key={section.title}><a href={`#report-section-${i}`}>{section.title}</a></li>)}</ol></nav>{sections.map((section,i)=><section id={`report-section-${i}`} key={section.title}><h2>{section.title}</h2><RecordValue value={section.value}/></section>)}</article></div>,document.body)}
 </section>;
}
