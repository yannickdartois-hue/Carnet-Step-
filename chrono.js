/* =====================================================================
   chrono.js — Step : chrono des filières (une seule musique, A et B démarrent et finissent ensemble).
   COMMUN à l'appli élève (onglet Chrono) et à l'outil prof. Calé sur l'heure réelle : reprend après une mise en veille ou un rechargement.
   ===================================================================== */
'use strict';
let CH={fmt:'eval',voice:true,run:null};
function segsF(k,fmt){const F=FMT[fmt][k],out_=[];let t=0;F.e.forEach((d,i)=>{out_.push({type:'E',n:i+1,a:t,b:t+d*60});t+=d*60;if(i<F.e.length-1&&F.r){out_.push({type:'R',n:i+1,a:t,b:t+F.r*60});t+=F.r*60}});return out_}
function mPoints(fmt){const p=[];['A','B'].forEach(k=>segsF(k,fmt).forEach(s=>{if(s.type==='E'){p.push(s.b);if(k==='B')p.push(R((s.a+s.b)/2))}}));return [...new Set(p)].sort((a,b)=>a-b)}
const fmS=s=>{s=Math.max(0,R(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function chronoView(){chRestore();const r=CH.run;const F=['eval','s5','s6','s4'];const lab={eval:'Évaluation (S7, S8) · 25 min',s5:'Format réduit (S5) · 18 min',s6:'Passage coaché (S6) · 13 min',s4:'Essai de filière (S4) · 10 min'};
  return `<section class="card chrono"><h2>⏱ Chrono des filières</h2><p class="muted small">Pour ton téléphone branché sur l’enceinte : A et B démarrent et finissent ensemble. Bips, 3-2-1 avant chaque changement, « Mesure » à chaque prise de FC.</p>
  ${r?'':`<div class="seg">${F.map(k=>`<button class="chip ${CH.fmt===k?'on':''}" data-chf="${k}">${lab[k]}</button>`).join('')}</div><label class="tog"><input type="checkbox" id="chvoice" ${CH.voice?'checked':''}> Voix (« Effort », « Récupération », « Mesure »)</label>`}
  <div class="chtot" id="chtot">${fmS(r?r.t:0)}</div><div class="chgrid">${['A','B'].map(k=>`<div class="chf f${k}" id="ch${k}"></div>`).join('')}</div><div id="chfc" class="chfc" hidden>MESURE FC</div>
  <div class="row wrap center">${r?`<button class="btn big" data-act="chpause">${r.paused?'▶ Reprendre':'Ⅱ Pause'}</button><button class="btn big ghost" data-act="chstop">■ Arrêter</button>`:`<button class="btn pri huge" data-act="chgo">▶ Lancer (départ dans 5 s)</button>`}</div></section>`}
function chDraw(){const r=CH.run;const t=r?r.t:0;const el=$('#chtot');if(!el)return;el.textContent=r&&r.pre>0?'Départ dans '+Math.ceil(r.pre):fmS(t);
  ['A','B'].forEach(k=>{const S=segsF(k,CH.fmt),end=S[S.length-1].b;const cur=S.find(s=>t>=s.a&&t<s.b);const box=$('#ch'+k);if(!box)return;
    box.classList.toggle('rec',!!cur&&cur.type==='R');
    box.innerHTML=`<span class="chk">${FIL[k].nom}</span>${!r||r.pre>0?'<b>Prêt</b>':!cur?(t>=end?'<b>Terminé</b>':'<b>Prêt</b>'):`<small>${cur.type==='E'?'EFFORT '+cur.n+' / '+FMT[CH.fmt][k].e.length:'RÉCUPÉRATION ACTIVE'}</small><b>${fmS(cur.b-t)}</b>`}`});
  const fcOn=r&&r.pre<=0&&mPoints(CH.fmt).some(p=>t>=p&&t<p+15);const f=$('#chfc');if(f)f.hidden=!fcOn}
/* Chrono calé sur l'heure réelle : juste après une mise en veille, et repris après un rechargement (en rouvrant l'onglet Chrono). */
const CHRONO_CLE='step-chrono';
function chSave(){try{CH.run?localStorage.setItem(CHRONO_CLE,JSON.stringify({fmt:CH.fmt,run:CH.run,ts:Date.now()})):localStorage.removeItem(CHRONO_CLE)}catch(e){}}
function chRestore(){if(CH.run)return;try{const o=JSON.parse(localStorage.getItem(CHRONO_CLE)||'null');if(!o||!o.run||Date.now()-o.ts>3*3600e3)return;
  CH.fmt=o.fmt;CH.run=o.run;clearInterval(CH.h);CH.h=setInterval(chTick,250);try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>CH.lock=l).catch(()=>{})}catch(e){}}catch(e){}}
function chSec(k,snd){const r=CH.run;
  if(k<0){r.pre=-k;if(snd&&r.pre<=3)beep(880,120);return}
  if(k===0){r.pre=0;r.t=0;if(snd){beep(1000,600);say('Effort')}return}
  r.pre=0;r.t=k;const ch=new Set();['A','B'].forEach(x=>segsF(x,CH.fmt).forEach(s=>{ch.add(s.a);ch.add(s.b)}));const pts=mPoints(CH.fmt);
  if(snd){if([...ch].some(b=>b-r.t>0&&b-r.t<=3))beep(660,120);
    if(pts.includes(r.t)){beep(990,500);say('Mesure')}else if(ch.has(r.t)){beep(990,500);const recA=segsF('A',CH.fmt).find(s=>s.a===r.t);say(recA&&recA.type==='R'?'Récupération':'Effort')}}
  const end=Math.max(...['A','B'].map(x=>{const S=segsF(x,CH.fmt);return S[S.length-1].b}));if(r.t>=end+15){chStop();beep(600,900);say('Terminé');render();return true}}
function chTick(){const r=CH.run;if(!r||r.paused)return;
  const s=Math.floor((Date.now()-r.t0)/1000);if(s<=r.last)return;
  for(let k=Math.max(r.last+1,s-3600);k<=s;k++){if(chSec(k,k===s))return}
  r.last=s;chDraw()}
function chStart(){CH.run={t0:Date.now()+5000,last:-6,t:0,pre:5,paused:false};chSave();say('Départ dans 5 secondes');try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>CH.lock=l).catch(()=>{})}catch(e){}
  clearInterval(CH.h);CH.h=setInterval(chTick,250);render();chDraw()}
function chPause(){const r=CH.run;if(!r)return;if(r.paused){r.t0+=Date.now()-r.pAt;r.paused=false}else{r.paused=true;r.pAt=Date.now()}chSave()}
function chStop(){clearInterval(CH.h);CH.run=null;chSave();try{CH.lock&&CH.lock.release()}catch(e){}try{speechSynthesis.cancel()}catch(e){}}
function say(t){if(!CH.voice||!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(t);u.lang='fr-FR';u.rate=1.05;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
