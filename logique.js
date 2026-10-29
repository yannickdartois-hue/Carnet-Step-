/* =====================================================================
   logique.js — Step : calculs (zones de FC, réussites, défis, badges, AFL1), format compact, noms de fichiers.
   COMMUN à l'appli élève et à l'outil prof.
   ===================================================================== */
'use strict';
const R=x=>Math.floor(x+0.5);
const num=v=>{if(v===''||v==null)return null;const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n};
const fc1=x=>x==null||isNaN(x)?'–':String(R(x*10)/10).replace('.',',');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
/* ---- FC de repos, FC max, zones (Karvonen) ---- */
function fcRepos(run){if(num(run.fcrM)!=null)return num(run.fcrM);const se=run.seances||{};
  for(const sid of ['s2','s1']){const f=se[sid]&&se[sid].fcr;if(f){const m=(f.m||[]).map(num).filter(x=>x!=null);if(m.length)return m.reduce((a,x)=>a+x,0)/m.length}}
  const p=se.s1&&se.s1.fcr&&num(se.s1.fcr.pv);return p}
function fcMaxTheo(run){const a=num(run.age);if(!a)return null;return (run.sexe==='F'?226:220)-a}
/* FC max observée : la plus haute FC mesurée dans les séances (valeurs vraisemblables seulement).
   220 − âge se trompe d'environ ± 10 pulsations : si l'élève a déjà dépassé sa FC max théorique, c'est la valeur observée qui compte
   (plafonnée à théorique + 20, au-delà c'est une erreur d'oxymètre). */
function fcMaxObs(run){let m=null;const walk=o=>{if(!o||typeof o!=='object')return;for(const k in o){if(k==='fc'){const v=num(o[k]);if(v!=null&&v>=100&&v<=230&&(m==null||v>m))m=v}else walk(o[k])}};
  Object.values(run.seances||{}).forEach(d=>{if(d&&!d.st)walk(d)});return m}
function fcMax(run){const t=fcMaxTheo(run);if(t==null)return null;const o=fcMaxObs(run);return o!=null&&o>t?Math.min(o,t+20):t}
function zonesWith(rep,mx){if(rep==null||mx==null)return null;const fcr=mx-rep;const z=p=>R(rep+fcr*p/100);return {rep:R(rep),max:mx,fcr:R(fcr),A:[z(80),z(95)],B:[z(55),z(70)]}}
/* zones « du calcul » (FC max théorique) : ce que l'élève calcule lui-même en S2 */
function zonesTheo(run){return zonesWith(fcRepos(run),fcMaxTheo(run))}
function zonesOf(run){const rep=fcRepos(run),mx=fcMax(run);if(rep==null||mx==null)return null;const fcr=mx-rep;const z=p=>R(rep+fcr*p/100);
  return {rep:R(rep),max:mx,maxTheo:fcMaxTheo(run),obs:mx>fcMaxTheo(run),fcr:R(fcr),A:[z(80),z(95)],B:[z(55),z(70)]}}
function filOf(run){const se=run.seances||{};for(const sid of ['s8','s7','s6','s5','s4']){const c=se[sid]&&(se[sid].ch||se[sid].pl);if(c&&c.f)return c.f}return run.filM||null}
function zoneFor(run,f){const z=zonesOf(run);return z&&f?z[f]:null}
function inZ(fc,z){return fc!=null&&z?fc>=z[0]&&fc<=z[1]:null}
function hors(fc,z){if(fc==null||!z)return null;return fc<z[0]?fc-z[0]:fc>z[1]?fc-z[1]:0}

function coordOf(run){const se=run.seances||{};const L=[];SESS.forEach(s=>{const co=se[s.id]&&se[s.id].co;if(co)Object.keys(co).forEach(k=>{if(co[k]==='1'&&!L.includes(k))L.push(k)})});return L}
/* ---- réussites d’une séance : [réussies, tentées] ---- */
function regTot(r){if(!r)return null;let t=0,n=0;CURS.forEach(c=>{const v=num(r[c[0]]);if(v!=null){t+=v;n++}});return n?t:null}
function tenus(sid,d,run){
  if(!d||d.st)return [0,0];let t=0,n=0;const add=ok=>{n++;if(ok)t++};const ad=!!d.ad;const tol=ad?6:0;
  const ok=(fc,z)=>{if(fc==null||!z)return null;return fc>=z[0]-tol&&fc<=z[1]+tol};
  SBY[sid].blocks.forEach(b=>{const [ty,a1,a2,a3]=bk(b);
    if(ty==='bloc'){const e=num(d['b'+a1]&&d['b'+a1].en),er=num(d['b'+a1]&&d['b'+a1].er);if(e!=null)add(e>=4&&(er==null||er<=2))}
    if(ty==='mes'&&a1==='m1'){const m=d.m1||[];const f1=num(m[0]&&m[0].fc),f2=num(m[1]&&m[1].fc);if(f1!=null&&f2!=null)add(f2>f1)}
    if(ty==='mes'&&a1==='lg'&&run){const z=zoneFor(run,'B');(d.lg||[]).forEach(x=>{const f=num(x&&x.fc);const k=ok(f,z);if(k!=null)add(k)})}
    if(ty==='tri'){const v=getPath(d,'tri');if(v)add(v==='1')}
    if(ty==='vise'&&run){const z=zoneFor(run,getPath(d,'vs.f'));const k=ok(num(getPath(d,'vs.2.fc')),z);if(k!=null)add(k)}
    if(ty==='cur'){const a=num(getPath(d,'cu.lo.fc')),b2=num(getPath(d,'cu.hi.fc'));if(a!=null&&b2!=null)add(b2-a>=20)}
    if(ty==='essai'&&run){const f=getPath(d,'es.f');const z=zoneFor(run,f);(getPath(d,'es.m')||[]).forEach(x=>{const k=ok(num(x&&x.fc),z);if(k!=null)add(k)})}
    if(ty==='regl'&&run){const z=zoneFor(run,filOf(run));const k=ok(num(getPath(d,'rg.2.fc')),z);if(k!=null)add(k)}
    if(ty==='fil'&&run){const z=zoneFor(run,filOf(run));(getPath(d,'fl.m')||[]).forEach(x=>{const k=ok(num(x&&x.fc),z);if(k!=null)add(k)})}
  });return [t,n]}
/* écart moyen à la zone (bpm, 0 = dans la zone) : l’indicateur de « régler sa charge » */
function ecartOf(sid,d,run){if(!d||d.st||!run)return null;const z=zoneFor(run,filOf(run));if(!z)return null;const m=[];
  ((d.fl&&d.fl.m)||[]).forEach(x=>{const f=num(x&&x.fc);if(f!=null)m.push(Math.abs(hors(f,z)))});return m.length?m.reduce((a,x)=>a+x,0)/m.length:null}
function degreeOf(t,n){if(!n)return null;const r=t/n;return r>=0.75?4:r>=2/3-0.001?3:r>=1/3-0.001?2:1}
const jpPts=(an,fc)=>{if(an==null||fc==null)return null;const e=Math.abs(an-fc);return e<=5?3:e<=10?1:0};
function ciblePts(fc,z){if(fc==null||!z)return null;const mid=(z[0]+z[1])/2;if(Math.abs(fc-mid)<=3)return 3;if(fc>=z[0]&&fc<=z[1])return 2;return Math.abs(hors(fc,z))<=5?1:0}
/* toutes les paires annonce / FC d'une séance */
function annonces(d){if(!d)return [];const L=[];const p=(x)=>{if(x&&num(x.an)!=null&&num(x.fc)!=null)L.push([num(x.an),num(x.fc)])};
  (d.bi||[]).forEach(p);(d.lg||[]).forEach(p);if(d.cu){p(d.cu.lo);p(d.cu.hi)}if(d.vs){p(d.vs[1]);p(d.vs[2])}((d.es&&d.es.m)||[]).forEach(p);if(d.rg){p(d.rg[1]);p(d.rg[2])}((d.fl&&d.fl.m)||[]).forEach(p);return L}
function scoreSeance(sid,d,run){if(!DEFI_S.includes(sid)||!d||d.st)return {jp:0,ci:0,n:0};
  const jp=annonces(d).reduce((a,[x,y])=>a+jpPts(x,y),0);let ci=0;
  if(['s5','s6','s7'].includes(sid)){const z=zoneFor(run,filOf(run));((d.fl&&d.fl.m)||[]).forEach(x=>{const c=ciblePts(num(x&&x.fc),z);if(c)ci+=c})}
  return {jp,ci,tot:jp+ci}}
function scoreRun(run){let jp=0,ci=0;DEFI_S.forEach(sid=>{const s=scoreSeance(sid,run.seances&&run.seances[sid],run);jp+=s.jp;ci+=s.ci});return {jp,ci,tot:jp+ci}}
function pronoErrD(d){if(!d)return null;const p=num(getPath(d,'bl.pr')),f=num(getPath(d,'fl.m.0.fc'));if(p==null||f==null||!f)return null;return Math.abs(p-f)/f*100}
function badgesOf(run,mate){const se=run.seances||{};const B=[];
  if(getPath(se,'s4.tri')==='1')B.push('memoire');
  const lg=se.s3&&se.s3.lg;if(lg&&lg.some(x=>x&&num(x.fc)!=null)&&num(getPath(se,'s3.lgar'))===0)B.push('endurant');
  /* Devin : au moins 6 annonces à ± 5 ET au moins la moitié des annonces (sinon on l'obtient en annonçant au hasard) */
  let dv=0,na=0;DEFI_S.forEach(sid=>annonces(se[sid]).forEach(([a,f])=>{na++;if(Math.abs(a-f)<=5)dv++}));if(dv>=6&&dv*2>=na)B.push('devin');
  const z=zoneFor(run,filOf(run));let rg=0;['s5','s6','s7','s8'].forEach(sid=>{const M=((se[sid]&&se[sid].fl&&se[sid].fl.m)||[]).map(x=>num(x&&x.fc)).filter(x=>x!=null);if(M.length&&M.filter(x=>inZ(x,z)).length/M.length>=0.75)rg++});if(rg>=2)B.push('regleur');
  if(SESS.some(s=>getPath(se,s.id+'.co.chef')==='1'))B.push('chef');
  if(mate){let c=0;SESS.forEach(s=>{const e=pronoErrD(mate.seances&&mate.seances[s.id]);if(e!=null&&e<=5)c++});if(c>=2)B.push('coach')}
  return B}

/* ---- AFL1 (S7 blanche, S8) : produire /8 calculé ; analyser /4 noté par le prof ---- */
const zoneNote=(z,f)=>z&&f==='A'?[z[0]-TOL_A,z[1]]:z;
function afl1(run,d){if(!d||d.st)return null;const f=filOf(run);const z=zoneFor(run,f);const M=(d.fl&&d.fl.m)||[];
  const fcs=M.map(x=>num(x&&x.fc)).filter(x=>x!=null);if(!fcs.length)return null;
  const dz=fcs.filter(x=>inZ(x,zoneNote(z,f))).length;const zn=dz<=1?0:dz===2?1:dz===3?2:3;
  const arr=M.reduce((a,x)=>a+(num(x&&x.ar)||0),0);const co=arr===0?2:arr===1?1.5:arr<=3?1:0;
  const sec=num(getPath(d,'ob.sec')),pl=num(getPath(d,'ob.pl'));
  const prod=zn+co+(sec||0)+(pl||0);return {dz,nm:fcs.length,zn,arr,co,sec,pl,prod,complet:sec!=null&&pl!=null}}

/* ---- format compact pour le QR ---- */
const CUT=(s,n)=>String(s||'').slice(0,n);
function slimSeance(d){if(!d)return {};const o=JSON.parse(JSON.stringify(d));
  if(o.bl){['reu','con','nx'].forEach(k=>{if(o.bl[k])o.bl[k]=CUT(o.bl[k],40)})}
  ['mot','wx'].forEach(k=>{if(o[k])o[k]=CUT(o[k],40)});if(o.cx&&o.cx.n)o.cx.n=CUT(o.cx.n,30);
  if(o.ch)['a1','a2','a3'].forEach(k=>{if(o.ch[k])o.ch[k]=CUT(o.ch[k],50)});
  if(o.an)['c','k','r'].forEach(k=>{if(o.an[k])o.an[k]=CUT(o.an[k],50)});
  if(o.pl&&o.pl.si)o.pl.si=CUT(o.pl.si,40);
  if(o.ps)[1,2,3].forEach(i=>{if(o.ps['b'+i]&&o.ps['b'+i].r)o.ps['b'+i].r=CUT(o.ps['b'+i].r,30)});
  (function clean(x){for(const k in x){if(x[k]===''||x[k]==null)delete x[k];else if(typeof x[k]==='object')clean(x[k])}})(o);return o}
/* charge de séance (effort ressenti × durée, en UA) */
function chargeOf(d){const r=num(getPath(d||{},'bl.rpe'));if(r==null)return null;return R(r*(num(getPath(d,'bl.du'))||60))}
/* pronostic du coach : écart (%) entre la FC qu'il prévoit et la 1re mesure de la séance de filière */
function pronoErr(s,d){return pronoErrD(d)}
/* ---- noms ---- */
const prenomDe=n=>{const w=String(n||'').trim().split(/\s+/);const pre=w.filter(x=>!(x===x.toUpperCase()&&/[A-ZÀ-Ý]/.test(x)));return (pre.length?pre:w).join(' ')};
const nomDe=n=>{const w=String(n||'').trim().split(/\s+/);const up=w.filter(x=>x===x.toUpperCase()&&/[A-ZÀ-Ý]/.test(x));return up.length?up.join(' '):(w.length>1?w[w.length-1]:'')};
function slug(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'').slice(0,24)}
function nomFichier(classe,eleve,sid,suffixe){const nom=nomDe(eleve),pre=prenomDe(eleve);
  return [slug(classe)||'Classe',(slug(nom)+slug(pre).charAt(0)).toUpperCase()||'ELEVE',String(sid).toUpperCase()].join('_')+(suffixe||'')+'.json'}
/* ---- résumé d'une séance (fichier JSON envoyé au prof) ---- */
function resumeSeance(run,sid){const d=run.seances&&run.seances[sid];if(!d)return null;const [t,n]=tenus(sid,d,run);const z=zonesOf(run);const f=filOf(run);
  const sc=scoreSeance(sid,d,run);const a=SBY[sid].eval?afl1(run,d):null;
  return {seance:SBY[sid].n,statut:d.st?ST_TXT[d.st]:'présent',reussites:n?t+'/'+n:'',filiere:f||'',zone:f&&z?z[f].join('-'):'',fcRepos:z?z.rep:'',fcMax:z?z.max:'',
    effort:num((d.bl||{}).rpe),charge:chargeOf(d),justePouls:sc.jp||0,cible:sc.ci||0,afl1Produire:a?a.prod:null,adaptee:!!d.ad}}
