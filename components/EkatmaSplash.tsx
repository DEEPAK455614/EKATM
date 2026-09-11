'use client';
import {useEffect,useState} from 'react';

export default function EkatmaSplash({appName='Ekatma'}:{appName?:string}){
  const [visible,setVisible]=useState(true);
  useEffect(()=>{
    try{
      if(sessionStorage.getItem('ekatma:splash:seen')){setVisible(false);return;}
      sessionStorage.setItem('ekatma:splash:seen','1');
    }catch{}
    const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t=window.setTimeout(()=>setVisible(false),reduce?650:1900);
    return()=>window.clearTimeout(t);
  },[]);
  if(!visible)return null;
  return <div className="ekatmaSplash" role="presentation" aria-hidden="true">
    <div className="ekatmaAura"/>
    <div className="ekatmaParticles"><i/><i/><i/><i/></div>
    <div className="ekatmaMandala"><span className="ring r1"/><span className="ring r2"/><span className="ring r3"/><div className="bindu">ॐ</div></div>
    <div className="ekatmaWord">एकात्म</div>
    <div className="ekatmaApp">{appName}</div>
    <div className="ekatmaLine">A Journey of Oneness</div>
    <style>{`
      .ekatmaSplash{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at 50% 42%,#fff7e8 0 10%,#f7d5a2 34%,#9b4214 72%,#3a1708 100%);color:#fffdf7;animation:ekatmaOut .42s ease 1.5s forwards;pointer-events:all}
      .ekatmaAura{position:absolute;width:min(82vw,520px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(255,244,205,.46),rgba(255,194,92,.13) 48%,transparent 68%);filter:blur(1px);animation:aura 1.5s ease-in-out both}
      .ekatmaMandala{position:relative;width:150px;height:150px;display:grid;place-items:center;margin-bottom:18px;animation:mandalaIn .8s cubic-bezier(.2,.8,.2,1) both}
      .ring{position:absolute;inset:0;border:1px solid rgba(255,248,224,.62);border-radius:50%;box-shadow:0 0 34px rgba(255,212,130,.2)}
      .r1{animation:ringOne 1.25s ease-out both}.r2{inset:18px;animation:ringTwo 1.1s .08s ease-out both}.r3{inset:37px;animation:ringThree .95s .14s ease-out both}
      .bindu{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:rgba(255,251,238,.92);color:#8f3b10;font:600 34px/1 serif;box-shadow:0 10px 40px rgba(65,20,3,.3),0 0 0 8px rgba(255,243,209,.12);animation:bindu .9s .18s cubic-bezier(.2,.8,.2,1) both}
      .ekatmaWord{font-family:"Noto Serif Devanagari","Noto Sans Devanagari",serif;font-size:clamp(40px,10vw,64px);font-weight:700;letter-spacing:.02em;text-shadow:0 8px 30px rgba(58,23,8,.28);animation:wordIn .72s .35s ease both}
      .ekatmaApp{margin-top:4px;font:800 12px/1.2 system-ui,-apple-system,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#ffe8c5;animation:wordIn .7s .52s ease both}
      .ekatmaLine{margin-top:12px;font:500 12px/1.2 system-ui,-apple-system,sans-serif;letter-spacing:.08em;color:rgba(255,247,231,.8);animation:wordIn .7s .65s ease both}
      .ekatmaParticles i{position:absolute;width:8px;height:8px;border-radius:50%;background:#ffe0a3;box-shadow:0 0 18px #ffd384;top:50%;left:50%;opacity:0}.ekatmaParticles i:nth-child(1){animation:p1 1s .1s ease-out both}.ekatmaParticles i:nth-child(2){animation:p2 1s .16s ease-out both}.ekatmaParticles i:nth-child(3){animation:p3 1s .22s ease-out both}.ekatmaParticles i:nth-child(4){animation:p4 1s .28s ease-out both}
      @keyframes mandalaIn{from{opacity:0;transform:scale(.55) rotate(-18deg)}to{opacity:1;transform:scale(1) rotate(0)}}@keyframes aura{0%{opacity:0;transform:scale(.55)}55%{opacity:1}100%{opacity:.86;transform:scale(1.1)}}
      @keyframes ringOne{from{opacity:0;transform:scale(1.7) rotate(35deg)}to{opacity:1;transform:scale(1) rotate(0)}}@keyframes ringTwo{from{opacity:0;transform:scale(.35) rotate(-50deg)}to{opacity:1;transform:scale(1) rotate(0)}}@keyframes ringThree{from{opacity:0;transform:scale(1.5)}to{opacity:1;transform:scale(1)}}@keyframes bindu{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}@keyframes wordIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes p1{0%{opacity:0;transform:translate(-170px,-110px)}55%{opacity:1}100%{opacity:0;transform:translate(-4px,-4px)}}@keyframes p2{0%{opacity:0;transform:translate(165px,-90px)}55%{opacity:1}100%{opacity:0;transform:translate(-4px,-4px)}}@keyframes p3{0%{opacity:0;transform:translate(-150px,120px)}55%{opacity:1}100%{opacity:0;transform:translate(-4px,-4px)}}@keyframes p4{0%{opacity:0;transform:translate(145px,110px)}55%{opacity:1}100%{opacity:0;transform:translate(-4px,-4px)}}
      @keyframes ekatmaOut{to{opacity:0;visibility:hidden;transform:scale(1.02)}}
      @media(prefers-reduced-motion:reduce){.ekatmaSplash,.ekatmaAura,.ekatmaMandala,.ring,.bindu,.ekatmaWord,.ekatmaApp,.ekatmaLine,.ekatmaParticles i{animation:none!important}.ekatmaSplash{animation:ekatmaOut .2s ease .45s forwards!important}}
    `}</style>
  </div>
}
