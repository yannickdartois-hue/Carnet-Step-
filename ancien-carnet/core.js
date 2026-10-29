/* ===================== CARNET STEP · CA5 · Seconde · cœur commun (élève + prof) ===================== */
'use strict';
const APP_VER=1, APP_VERSION='v3.2 · 29/10/2026', SCHEMA=1, STORE='step2_carnet_v1', PSTORE='step2_prof_v1';
const R=x=>Math.floor(x+0.5);
const num=v=>{if(v===''||v==null)return null;const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n};
const fc1=x=>x==null||isNaN(x)?'–':String(R(x*10)/10).replace('.',',');
{{esc}}

/* ---- filières, formats, zones (identiques à l’outil de cycle) ---- */
const FIL={A:{nom:'A · bref et intense',court:'A',but:'développer ma puissance aérobie',zone:[80,95],rpe:'7 à 9',parole:'quelques mots',prio:'propulsion et bras'},
           B:{nom:'B · long et modéré',court:'B',but:'m’entretenir, durer',zone:[55,70],rpe:'3 à 5',parole:'des phrases',prio:'amplitude et bras, sans saut'}};
const FMT={eval:{A:{e:[4,4,4,4],r:3},B:{e:[10,10],r:5}},s5:{A:{e:[4,4,4],r:3},B:{e:[8,8],r:2}},s6:{A:{e:[3,3,3],r:2},B:{e:[13],r:0}},s4:{A:{e:[2,2,2],r:2},B:{e:[10],r:0}}};
const FMT_TXT=(f,k)=>{const F=FMT[k][f];return F.e.length+' × '+F.e[0]+' min'+(F.r?', récupération '+F.r+' min':' continues')};
/* mesures d’un format : A = fin de chaque série ; B = mi-série et fin de série */
function mesures(f,k){const F=FMT[k][f];const L=[];F.e.forEach((d,i)=>{const sr=F.e.length>1?'Série '+(i+1)+' · ':'';if(f==='B'){L.push([sr+'à '+mm(d/2),i]);L.push([sr+'fin ('+d+' min)',i])}else L.push([sr+'fin ('+d+' min)',i])});return L}
const mm=x=>{const m=Math.floor(x),s=R((x-m)*60);return s?m+' min '+s:m+' min'};
const CURS=[['H','Hauteur',['sans réhausse','1 réhausse','2 réhausses']],['B','Bras',['bas','épaules','au-dessus']],['P','Propulsion',['aucun saut','impulsion','pas sautés']],['A','Amplitude',['petite','moyenne','grande']]];

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

/* ---- séances (Seconde, 8 séances) ---- */
const SESS=[
 {id:'s1',n:'S1',t:'Sécurité, FC de repos, bloc 1',goal:'je fais le bloc 1 en suivant le prof, et ma 2e FC est plus haute que la 1re.',
  crit:['Pied entier posé, sans bruit','Descend toujours en arrière','Reste sur le temps de la musique'],blocks:['fcr',['bloc',1],['mes','m1','Premier effort, première mesure',[['Effort 1 · 6 min de bloc 1, mains aux hanches, sans saut','basse'],['Effort 2 · 3 min de bloc 1, bras au-dessus des épaules, genou plus haut que la hanche','haute']]]]},
 {id:'s2',n:'S2',t:'Bloc 2 et test des leviers',goal:'je sais dire quel réglage me fait gagner le plus de pulsations.',
  crit:['Jamais de descente en avant (reverse)','Regard devant, pas sur ses pieds','Ne change qu’un réglage à la fois'],blocks:[['coord',['canon']],['bloc',2],['mes','lv','Test des leviers : 3 × 3 min de bloc 1',[['Série 1 · step sans réhausse, mains aux hanches, aucun saut','version basse'],['Série 2 · + propulsion (genoux et tap up sautés)','+ propulsion'],['Série 3 · + propulsion, 1 réhausse, bras au-dessus des épaules','+ réhausse + bras']]],'zcalc']},
 {id:'s3',n:'S3',t:'Bloc 3, bref contre long, Juste Pouls',goal:'je vis les deux filières (3 × 1 min intense, 12 min sans arrêt) et j’annonce ma FC à 10 près.',
  crit:['Back sans saut, réception stable','Effort régulier sur les 12 min','Annonce faite avant de bouger'],blocks:[['coord',['ronde','annonce']],['bloc',3],['mes','bi','Juste Pouls : essai bref et intense, 3 × 1 min',[['FC après la 3e minute','A']]],['mes','lg','Effort long : 12 min de blocs 1 et 2, version basse',[['FC à 6 min','B'],['FC à 12 min','B']]]]},
 {id:'s4',n:'S4',t:'Les 3 blocs, curseurs, choix de la filière',goal:'au moins 2 mesures sur 3 dans la zone visée, et mon choix est argumenté.',
  crit:['3 blocs enchaînés sans l’enseignant','Sauts du jumping jack sur la plateforme','Annonce son réglage (H B P A)'],blocks:['tri',['coord',['chef']],'cur','vise','essai','choix']},
 {id:'s5',n:'S5',t:'S’entraîner 1 : régler sa charge',goal:'au moins 2 mesures sur 3 (A) ou 3 sur 4 (B) dans ma zone.',
  crit:['Échauffement progressif et complet','Ne change qu’un curseur à la fois','Continuité : pas d’arrêt hors mesures'],blocks:['warm',['coord',['chef']],'perso','regl',['fil','s5']]},
 {id:'s6',n:'S6',t:'S’entraîner 2 : le coach lit l’effort',goal:'mon coach relève toutes mes mesures et me donne 2 conseils utiles.',
  crit:['Coach : oxymètre dans les 5 s','Coach : conseil = constat + action','Pratiquant : pied entier, gainage'],blocks:['warm',['coord',['chef']],['fil','s6'],'obs']},
 {id:'s7',n:'S7',t:'Répétition générale (25 min)',goal:'3 mesures sur 4 dans ma zone et une analyse complète.',
  crit:['Plan écrit avant de commencer','Réglage modifié si hors zone','Analyse : constat, cause, régulation'],blocks:['warm',['coord',['chef']],'plan','regl',['fil','eval'],'analyse']},
 {id:'s8',n:'S8',t:'Évaluation',goal:'je réalise ma séance comme prévu et je l’analyse.',eval:true,
  crit:['Échauffement seul et complet','Coach précis : FC, arrêts, réglages','Séance réalisée comme annoncée'],blocks:['warm','plan',['fil','eval'],'obs','afl1','analyse','situe']}
];
/* ---- défis de coordination (réussi / pas encore, sans points) ---- */
const COORD={canon:['Le canon','Par rangée, bloc 1 en boucle : chacun démarre 8 temps après son voisin. Réussi si la vague tient 2 tours du bloc.'],
 ronde:['La ronde','Traverse de step en step, sans arrêt. Réussi si un seul élève par step, tous sur le même temps, 3 tours.'],
 annonce:['L’annonce','Pendant un pas, j’annonce le pas suivant à voix haute. Réussi si les blocs 1 et 2 sont annoncés sans erreur.'],
 chef:['Chef d’orchestre','Meneur devant sa rangée, de dos : 4 fois les 3 blocs sans aide et sans erreur = badge Chef d’orchestre.']};
const COORD_OPT={chef:[['1','✓ réussi : badge'],['0','pas encore'],['n','pas meneur aujourd’hui']]};
function coordOf(run){const se=run.seances||{};const L=[];SESS.forEach(s=>{const co=se[s.id]&&se[s.id].co;if(co)Object.keys(co).forEach(k=>{if(co[k]==='1'&&!L.includes(k))L.push(k)})});return L}
const SBY=Object.fromEntries(SESS.map(s=>[s.id,s]));
const bk=b=>Array.isArray(b)?b:[b];
const BLOC={1:['Genou G','Genou D','V step','V ¼ de tour à droite','Traverse','Cheval','Tap up'],2:['Pendule','Reverse','Talons G','Talons D','Lunge','Jazz square','Basique'],3:['Tap up','Back','V step','Hélicoptère','3 genoux','Jumping jack sur le step']};
const WARM_EX=[[['so','Marche, genoux, talons-fesses au sol'],['br','Step touch avec les bras']],[['bs','Basique, V step, tap up'],['ge','Genou, talons']],[['b1','Bloc 1 version basse'],['b2','Bloc 2 version basse'],['b3','Bloc 3 version basse']],[['fi','1 bloc au réglage de ma filière'],['fc','FC mesurée à la fin']]];
const WARM_NAME=Object.fromEntries([].concat(...WARM_EX));

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
const ST_TXT={abs:'absent',bl:'blessé / dispensé'};
const WHY_TXT={abs:'binôme absent',bl:'binôme blessé ou dispensé',autre:'autre raison'};
const DEG_TXT={1:'¼ · copieur-colleur',2:'⅓ · zappeur',3:'⅔ · sensitif',4:'¾ · concepteur'};

/* ---- défis (S3 à S7) : Juste Pouls, Pile dans la cible, badges ---- */
const DEFI_S=['s3','s4','s5','s6','s7'];
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
const BADGES=[['memoire','Mémoire','3 blocs enchaînés seul (S4)'],['endurant','Endurant','12 min sans arrêt (S3)'],['devin','Devin','au moins 6 annonces Juste Pouls à ± 5, et au moins la moitié de tes annonces'],['regleur','Régleur','2 séances de filière à 3 mesures sur 4 dans la zone'],['coach','Coach','pronostic à ± 5 % deux fois'],['chef','Chef d’orchestre','4 fois les 3 blocs devant sa rangée, sans erreur (S4 à S7)']];
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
/* Filière A : la FC chute de 10 à 20 pulsations dans les secondes qui suivent l'arrêt ; pour la note, une mesure jusqu'à 5 pulsations sous la zone compte comme dans la zone. */
const TOL_A=5;
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
function qrPayload(bin,sid,only){
  return 'SP2'+JSON.stringify({v:APP_VER,s:sid,c:bin.classe,b:bin.id,r:bin.runners.map((r,i)=>[r,i]).filter(([r,i])=>only==null||i===only).map(([r,i])=>({i,p:r.prenom,n:r.nom,x:r.sexe,a:r.age,fr:r.fcrM,d:slimSeance(r.seances[sid])}))})}
function parsePayload(raw){raw=String(raw||'').trim();if(!raw.startsWith('SP2')||raw.startsWith('SP2R'))throw new Error('Ce QR ne vient pas d’une fin de séance du carnet step.');
  const o=JSON.parse(raw.slice(3));if(!o.s||!SBY[o.s]||!Array.isArray(o.r))throw new Error('QR incomplet.');return o}
function restorePayload(bin,runs){return 'SP2R'+JSON.stringify({b:bin.b,c:bin.c,r:runs})}
{{chunk}}
