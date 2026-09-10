'use client';
import type {SimpleSurveyData} from './simple-survey';

import {reportSections,reportLines,type ReportMeta} from './survey-report-model';

async function createSurveyPdf(d:SimpleSurveyData,fileName:string,meta:ReportMeta={},dayId?:string){
 const {jsPDF}=await import('jspdf');
 const doc=new jsPDF({unit:'pt',format:'a4'});let y=52;
 const add=(text:string,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const lines=doc.splitTextToSize(text,500);for(const line of lines){if(y+size+4>785){doc.addPage();y=52;}doc.text(line,44,y);y+=size+5;}y+=7;};
 add('EKATMA YATRA',20,true);
 add(dayId?'DAILY ACTIVITY REPORT':'COMPREHENSIVE STATE SURVEY REPORT',13,true);
 add(`State: ${d.meta.state||'Not recorded'}`);
 add('Information recorded by the survey team. Unfilled fields are marked Not recorded. Supporting files remain private in the survey portal.');
 const sections=reportSections(d,meta,dayId);
 add('REPORT CONTENTS',13,true);sections.forEach((section,i)=>add(`${i+1}. ${section.title}`));
 for(const section of sections){doc.addPage();y=52;add(section.title,15,true);for(const line of reportLines(section.value))add(line);}
 for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(`EKATMA SURVEY | Page ${page} of ${doc.getNumberOfPages()}`,44,822);}
 doc.save(fileName);
}
export async function downloadSimpleSurveyPdf(d:SimpleSurveyData,fileName?:string,meta:ReportMeta={}){
 await createSurveyPdf(d,fileName||`Ekatma_Yatra_Survey_${(d.meta.state||'Draft').replace(/\W+/g,'_')}.pdf`,meta);
}
export async function downloadDailySurveyPdf(d:SimpleSurveyData,dayId:string,meta:ReportMeta={}){
 const day=d.dailyLogs.find(x=>x.id===dayId);if(!day)return;
 await createSurveyPdf(d,`Ekatma_Day_${day.dayNo}_${day.date||'undated'}.pdf`,meta,dayId);
}

// Browser printing preserves Hindi and other Unicode scripts using the device's
// text shaping. All field content is escaped; no survey text becomes markup.
export function printSimpleSurvey(d:SimpleSurveyData){
 const popup=window.open('','_blank');if(!popup){window.alert('Allow pop-ups for this site to open the printable report.');return;}
 const escape=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const label=(key:string)=>key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
 const render=(value:any):string=>{if(value===null||value===undefined||value==='')return '<span>—</span>';if(typeof value==='boolean')return value?'Yes':'No';if(typeof value!=='object')return escape(value);if(Array.isArray(value))return value.length?'<ol>'+value.map(x=>'<li>'+render(x)+'</li>').join('')+'</ol>':'No entries';return '<dl>'+Object.entries(value).filter(([k])=>!['id','path'].includes(k)).map(([k,v])=>'<div><dt>'+escape(label(k))+'</dt><dd>'+render(v)+'</dd></div>').join('')+'</dl>';};
 const sections:[string,any][]=[['02 · State Survey Team',d.meta],['03 · State at a Glance',d.stateProfile],['04 · Daily Activity Log',d.dailyLogs],['05–08 · Organizations, Contacts, Participation & Logistics',d.organizations],['09 · Rath Yatra Plan',d.rathPlans],['10 · Events & Festivals',{events:d.events,observations:d.eventObservations}],['11 · Strategic Action',{actions:d.strategicActions,importantDecisions:d.importantDecisions}],['12–14 · Proposed Committees',d.committees],['15–16 · Final Route',d.finalRoute],['Supporting documents',d.attachments||[]]];
 popup.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Ekatma Survey Report</title><style>body{font:14px/1.65 system-ui,sans-serif;color:#28221e;max-width:900px;margin:32px auto;padding:20px}h1{color:#91420f}h2{border-bottom:2px solid #91420f;padding-bottom:8px}dt{font-weight:650}dd{margin:0 0 10px 14px;white-space:pre-wrap;overflow-wrap:anywhere}li{margin-bottom:14px}section{margin-bottom:28px}button{padding:12px 20px;font:inherit}h2,dt{break-after:avoid}@page{size:A4;margin:18mm}@media print{button{display:none}body{margin:0;padding:0;max-width:none}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button><h1>EKATMA YATRA — Comprehensive Survey Report</h1><p>'+escape(d.meta.state)+'</p>'+sections.map(([title,value])=>'<section><h2>'+escape(title)+'</h2>'+render(value)+'</section>').join('')+'</body></html>');popup.document.close();popup.opener=null;
}
