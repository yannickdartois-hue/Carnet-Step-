/* =====================================================================
   prof.js — Step · outil prof (Lycée G. Pompidou)
   Récupère les séances des élèves (QR codes scannés, fichiers JSON, dossier .zip du Nuage,
   copies de secours), suit chaque élève séance par séance, prépare la note (AFL1, AFL2, AFL3).
   Données gardées sur cet appareil uniquement (localStorage) : exporter des sauvegardes.
   ===================================================================== */
'use strict';
const APP_VERSION='v4 · 29/10/2026';
const CLEP='spp-v1';
const $=s=>document.querySelector(s);
const nk=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dateFr=d=>{try{return d?new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}):''}catch(e){return ''}};
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),3000)}
function modal(html){$('#modal-body').innerHTML=icons(html);$('#modal').classList.add('on')}
function closeModal(){$('#modal').classList.remove('on');if(RQ.h){clearInterval(RQ.h);RQ.h=null}}
let AC=null;
function beep(f,ms){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f||880;g.gain.value=.25;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+(ms||150)/1000)}catch(e){}}
/* les écrans du carnet (vues.js) attendent ces objets : ils servent ici aux courbes de la fiche élève */
const DB={binomes:[],opts:{}};let V={};

/* ---------- Base ----------
   P.eleves[k] = {classe,cy,full,prenom,nom,sexe,age,fcrM,seances:{sid:d},recu:{sid:{ts,src}},groupe:{sid:[noms]},coach:{sid:{n,rep}},afl2,afl3,ana}
   k = classe|nom normalisés (avec les fusions décidées par le prof : P.alias) */
let DEMO=false;
function vide(){return {v:1,eleves:{},alias:{},classesL:{},appel:{},stars:{},journal:[],vue:'classes',classe:'',seance:'',eleve:null,tri:'nom',saveAt:0}}
function charger(){try{const o=JSON.parse(localStorage.getItem(CLEP));if(o&&o.eleves)return Object.assign(vide(),o)}catch(e){}return vide()}
let P=charger();
function sauver(){if(DEMO)return;try{localStorage.setItem(CLEP,JSON.stringify(P))}catch(e){alert('Mémoire de l’appareil pleine : exporte une sauvegarde.')}}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
function cleEleve(classe,nom){let k=nk(classe)+'|'+nk(nom);const seen=new Set();while(P.alias[k]&&!seen.has(k)){seen.add(k);k=P.alias[k]}return k}
const nomAff=k=>{const e=P.eleves[k];return e?e.full:k.split('|')[1]};
const nomTri=k=>{const e=P.eleves[k];return e?(e.nom+' '+e.prenom):k};
const nm=e=>'<b>'+esc((e.nom||'').toUpperCase())+'</b> '+esc(e.prenom||'');
function eleveDe(classe,full,cy){const k=cleEleve(classe,full);let e=P.eleves[k];
  if(!e)e=P.eleves[k]={classe,cy:'S',full,prenom:prenomDe(full),nom:nomDe(full),sexe:'',age:'',fcrM:'',seances:{},recu:{},groupe:{},coach:{}};
  return [k,e]}

/* ---------- Import ---------- */
/* r = {classe,eleve,sexe,age,fcrM,seance,date,ts,src,groupe,coach,coachRemplacant,d} */
function ajouterSeance(r){
  if(!r.eleve||!SBY[r.seance])throw new Error('séance incomplète');
  const [k,e]=eleveDe(r.classe,r.eleve);const old=e.recu[r.seance];
  if(old&&(old.ts||0)>=(r.ts||0)&&r.ts)return [k,'déjà à jour'];
  if(r.sexe)e.sexe=r.sexe;if(r.age)e.age=r.age;if(r.fcrM)e.fcrM=r.fcrM;
  e.seances[r.seance]=r.d||{};e.recu[r.seance]={ts:r.ts||0,src:r.src,date:r.date||''};
  if(r.groupe&&r.groupe.length)e.groupe[r.seance]=r.groupe;if(r.coach)e.coach[r.seance]={n:r.coach,rep:!!r.coachRemplacant};
  if(!P.classesL[r.classe])P.classesL[r.classe]={eleves:[],lien:'',cy:'S'};
  return [k,old?'mis à jour':'nouveau'];
}
function importerObjet(o){
  if(o&&o.carnetST)throw new Error('C’est la sauvegarde d’une tablette (« Reprendre un carnet » côté élève), pas un fichier de séance.');
  if(!o||o.app!=='step-eleves')throw new Error('fichier non reconnu');
  const ts=Math.round((Date.parse(o.exportedAt)||0)/1000);
  const [k,res]=ajouterSeance({classe:o.classe||'',eleve:o.eleve,sexe:o.sexe,age:o.age,fcrM:o.fcrM,seance:o.seance,date:o.date,ts,src:'fichier',groupe:o.groupe,coach:o.coach,coachRemplacant:o.coachRemplacant,d:o.donnees});
  return o.eleve+' · '+SBY[o.seance].n+' ('+res+')';
}
function importerQR(q){
  if(q.t==='C')throw new Error('C’est le QR de démarrage de la classe (pour les tablettes).');
  if(q.t==='T')throw new Error('C’est un QR de changement de groupe (pour une tablette d’élève).');
  if(q.t==='G'){/* QR d'un binôme : la séance de chaque élève */
    const L=(q.R||[]).map(r=>{const [k,res]=ajouterSeance({classe:q.c||'',eleve:r.e,sexe:r.x,age:r.g,fcrM:r.fr,seance:q.s,date:q.d,ts:q.ts||0,src:'qr',groupe:q.gr,coach:r.co,coachRemplacant:!!r.cr,d:r.D});return prenomDe(r.e)+' ('+res+')'});
    return SBY[q.s].n+' · '+L.join(', ')}
  if(q.t!=='S')throw new Error('QR non reconnu.');
  const [k,res]=ajouterSeance({classe:q.c||'',eleve:q.e,sexe:q.x,age:q.g,fcrM:q.fr,seance:q.s,date:q.d,ts:q.ts||0,src:'qr',groupe:q.gr,coach:q.co,coachRemplacant:!!q.cr,d:q.D});
  return q.e+' · '+SBY[q.s].n+' ('+res+')';
}
/* anciens QR du carnet step (SP2 = fin de séance, SP3 = rattrapage, SPP = morceaux) */
function importerAncien(raw){
  const run=(o,r,sid,d)=>{const full=((r.p||'')+' '+String(r.n||'').toUpperCase()).trim();const date=today();
    const grp=(o.r||[]).map(x=>((x.p||'')+' '+String(x.n||'').toUpperCase()).trim());
    return ajouterSeance({classe:o.c,eleve:full,sexe:r.x,age:r.a,fcrM:r.fr,seance:sid,date,ts:Math.round(Date.now()/1000),src:'qr',groupe:grp,d:Object.assign({},d)})};
  if(raw.startsWith('SP2R'))throw new Error('Ancien QR de restauration : rien à importer ici.');
  if(raw.startsWith('SP3')){const o=JSON.parse(raw.slice(3));let n=0;o.r.forEach(r=>Object.entries(r.se||{}).forEach(([sid,d])=>{run(o,r,sid,d);n++}));return 'ancien carnet · rattrapage : '+n+' séance(s)'}
  const o=JSON.parse(raw.slice(3));o.r.forEach(r=>run(o,r,o.s,r.d));return 'ancien carnet · '+SBY[o.s].n+' · '+o.r.map(r=>r.p).join(', ');
}
let PCH={tag:null,n:0,parts:{}};
async function lireTexteQR(t){t=String(t||'').trim();
  if(t.startsWith('SPEP|')||t.startsWith('SPP|')){const m=/^(SPEP|SPP)\|(\w+)\|(\d+)\/(\d+)\|([\s\S]*)$/.exec(t);if(!m)throw new Error('Morceau de QR illisible.');
    if(PCH.tag!==m[2])PCH={tag:m[2],n:+m[4],parts:{}};PCH.parts[+m[3]]=m[5];const got=Object.keys(PCH.parts).length;
    if(got<PCH.n)return '… '+got+' / '+PCH.n+' morceaux';let s='';for(let i=1;i<=PCH.n;i++)s+=PCH.parts[i];PCH={tag:null,n:0,parts:{}};t=s}
  if(/^SP[23]/.test(t))return importerAncien(/Ã|Â/.test(t)?decodeURIComponent(escape(t)):t);
  if(/^DF/.test(t))throw new Error('Ce QR vient de l’appli de demi-fond, pas du step.');
  const q=await STQR.decoder(t);if(q.t==='K')return deblocage(q);
  return importerQR(q);
}
/* code oublié côté élève : la tablette montre la clé du carnet chiffrée pour ma clé ; je la rends par un QR */
const b64s=u=>{let x='';new Uint8Array(u).forEach(c=>x+=String.fromCharCode(c));return btoa(x)};
async function deblocage(q){if(DEMO)throw new Error('Pas de déverrouillage en démo.');
  let raw;try{raw=await ouvrirBrut(q.p)}catch(e){throw new Error('Ce carnet a été chiffré pour un autre appareil prof (restaure ta sauvegarde).')}
  const txt=await STQR.encoder({a:'SPE',v:1,t:'U',i:q.i,k:b64s(raw)});
  setTimeout(()=>qrPlein('Déverrouillage · '+(q.n||[]).map(esc).join(' · '),'Sur la tablette : « Scanner la réponse du prof », puis le groupe choisit un nouveau code.',[txt]),300);
  journal('Carnet déverrouillé : '+(q.n||[]).join(', ')+' ('+(q.c||'')+')');return 'QR de déverrouillage affiché · '+(q.n||[]).join(', ')}
async function importerFichiers(files){
  let ok=0;const err=[];
  async function un(nom,texte){try{const o=JSON.parse(texte);if(o&&o.app==='st-secours')await importerSecours(o);else importerObjet(o);ok++}catch(e){err.push(nom+' : '+(e.message||e))}}
  for(const f of files){
    if(/\.zip$/i.test(f.name)){try{const z=await JSZip.loadAsync(f);for(const x of Object.values(z.files).filter(x=>!x.dir&&/\.json$/i.test(x.name)))await un(x.name.split('/').pop(),await x.async('string'))}catch(e){err.push(f.name+' : zip illisible')}}
    else if(/\.json$/i.test(f.name)||f.type==='application/json')await un(f.name,await f.text());
    else if(/\.txt$/i.test(f.name)){try{await lireTexteQR(await f.text());ok++}catch(e){err.push(f.name+' : '+(e.message||e))}}
    else err.push(f.name+' : ni .json ni .zip');
  }
  journal(ok+' fichier'+(ok>1?'s':'')+' importé'+(ok>1?'s':'')+(err.length?' · '+err.length+' refusé'+(err.length>1?'s':''):''),err);
  classeParDefaut();sauver();rendre();if(ok)proposerSauvegarde();
}
function journal(t,err){P.journal.unshift({t,err:err||[],d:new Date().toISOString()});P.journal=P.journal.slice(0,20)}

/* ---------- Classes, élèves ---------- */
function classes(){const s=new Set(Object.keys(P.classesL));Object.values(P.eleves).forEach(e=>s.add(e.classe||''));return [...s].filter(Boolean).sort((a,b)=>a.localeCompare(b,'fr'))}
function classeParDefaut(){const C=classes();if(!C.includes(P.classe))P.classe=C[0]||''}
const clsCy=c=>{const L=P.classesL[c];if(L&&L.cy)return L.cy;const e=Object.values(P.eleves).find(x=>x.classe===c);return e&&e.cy==='T'?'T':'S'};
const liste=()=>(P.classesL[P.classe]||{eleves:[]}).eleves;
function eleves(c){c=c||P.classe;const s=new Set();(P.classesL[c]||{eleves:[]}).eleves.forEach(n=>{const [k]=eleveDe(c,n);s.add(k)});
  Object.entries(P.eleves).forEach(([k,e])=>{if(e.classe===c&&!P.alias[k])s.add(k)});
  return [...s].sort((a,b)=>nomTri(a).localeCompare(nomTri(b),'fr'))}
const runOf=e=>({sexe:e.sexe,age:e.age,fcrM:e.fcrM,seances:e.seances});
const starOf=(k,sid)=>(P.stars[k]&&P.stars[k][sid])||{};
function totaux(e){let T=0,N=0;sessOf(e.cy).forEach(s=>{const [t,n]=tenR(runOf(e),s.id);T+=t;N+=n});return [T,N]}
const fc=x=>x==null||x===''?'–':String(x).replace('.',',');
/* écart moyen à la zone (séances de filière, /min) : début → fin, il doit baisser */
function ecTrend(e){const run=runOf(e);const v=sessOf(e.cy).map(s=>ecartOf(s.id,e.seances[s.id],run)).filter(x=>x!=null);if(!v.length)return '–';const a=R(v[0]),b=R(v[v.length-1]);return v.length<2?a+' /min':`${a} → <b class="${b<a?'ok':b>a?'ko':''}">${b} /min</b>`}
/* AFL3 : ce que l'élève produit comme coach, mesuré chez les élèves qu'il a coachés */
/* Contrôle du prof : il mesure lui-même la FC d'un élève (la 1re mesure de la séance de filière, ou la 1re mesure de la séance).
   L'écart avec la FC notée par le coach dit si le coach est fiable (AFL3) et si les données du carnet sont justes. */
function refFC(d){if(!d)return null;const c=[getPath(d,'fl.m.0.fc'),getPath(d,'es.m.0.fc'),getPath(d,'rg.1.fc'),getPath(d,'vs.1.fc'),getPath(d,'cu.lo.fc'),getPath(d,'lg.0.fc'),getPath(d,'bi.0.fc'),getPath(d,'lv.0.fc'),getPath(d,'m1.0.fc')];
  for(const x of c){const v=num(x);if(v!=null)return v}return null}
function ctrlDe(k,sid){const v=P.ctrl&&P.ctrl[k]&&P.ctrl[k][sid];const e=P.eleves[k];const d=e&&e.seances[sid];if(v==null||v===''||!d)return null;
  const x=num(v);const r=refFC(d);if(x==null||!x||r==null)return {x,r:null};
  return {x,r,err:R(Math.abs(x-r)/x*1000)/10}}
const moy=a=>a.length?R(a.reduce((s,x)=>s+x,0)/a.length*10)/10:null;
function coachDe(k){const e=P.eleves[k];if(!e)return null;const me=nk(e.full),pr=nk(e.prenom);let yes=0,tot=0,n=0;const er=[],fi=[];
  Object.entries(P.eleves).forEach(([ko,o])=>{if(o===e||o.classe!==e.classe)return;sessOf(o.cy).forEach(s=>{const c=o.coach[s.id];const d=o.seances[s.id];if(!c||!d||d.st)return;
    const cn=nk(c.n);if(cn!==me&&!(c.rep&&cn.startsWith(pr)))return;n++;const bl=d.bl||{};if(bl.aide==='1'||bl.aide==='0'){tot++;if(bl.aide==='1')yes++}const x=pronoErr(s,d);if(x!=null)er.push(x);
    const ct=ctrlDe(ko,s.id);if(ct&&ct.err!=null)fi.push(ct.err)})});
  return {n,yes,tot,err:er.length?R(moy(er)):null,fiab:moy(fi),nf:fi.length}}
function coachTxt(k){const c=coachDe(k);if(!c||!c.n)return '–';return [c.nf?`contrôle ±${fc(c.fiab)} %`:'',c.err!=null?`pronostic ±${c.err} %`:'',c.tot?`aide ${c.yes}/${c.tot}`:''].filter(Boolean).join('<br><small>')+(c.nf||c.err!=null||c.tot?'':c.n+' séance'+(c.n>1?'s':''))}
/* statut d'un élève à une séance (appel) */
const STATUTS={present:'Présent',disp:'Dispensé / blessé',absent:'Absent',abj:'Absent justifié',oubli:'Oubli d’envoi',rien:'Rien reçu',retard:'En retard',tenue:'Oubli de tenue'};
/* retards et oublis de tenue d'un élève sur le cycle (appel manuel) */
function tenueRetard(k,c){const L=sessOf(clsCy(c||P.classe));let rt=0,tn=0;L.forEach(s=>{const o=P.appel[nk(c||P.classe)+'|'+s.id+'|'+k];if(o==='retard')rt++;if(o==='tenue')tn++});return [rt,tn]}
function statut(k,sid){const o=P.appel[nk(P.classe)+'|'+sid+'|'+k];if(o)return {c:o,manuel:true};const e=P.eleves[k];const d=e&&e.seances[sid];
  if(!d)return {c:'rien'};if(d.st==='abs')return {c:'absent'};if(d.st==='bl')return {c:'disp'};return {c:'present'}}
/* alertes pédagogiques de la classe */
function alertes(c){const L=SESS,K=eleves(c);const out=[];
  let last=-1;K.forEach(k=>L.forEach((s,i)=>{if(P.eleves[k]&&P.eleves[k].seances[s.id]&&i>last)last=i}));
  if(last>=0){const sid=L[last].id;const miss=K.filter(k=>!(P.eleves[k]&&P.eleves[k].seances[sid])&&!P.appel[nk(c)+'|'+sid+'|'+k]);if(miss.length)out.push(['qr',`Rien reçu en ${L[last].n} : ${miss.map(k=>esc(nomAff(k))).join(', ')}`])}
  K.forEach(k=>{const e=P.eleves[k];if(!e)return;const run=runOf(e);const done=L.filter(s=>hasData(e.seances[s.id])&&!e.seances[s.id].st);
    if(last>=1&&done.length&&!zonesOf(run))out.push(['zone',`${nm(e)} : zones non calculables (${fcMax(run)==null?'âge':'FC de repos'} manquant)`]);
    if(last>=4&&done.length&&!filOf(run))out.push(['ko',`${nm(e)} : pas de filière choisie`]);
    const fil=done.filter(s=>['s5','s6','s7','s8'].includes(s.id));
    if(fil.length>=2&&fil.slice(-2).every(s=>{const [t,n]=tenR(run,s.id);return n>0&&t===0}))out.push(['ko',`${nm(e)} : aucune mesure dans sa zone sur ses 2 dernières séances de filière`]);
    const ab=L.filter(s=>e.seances[s.id]&&e.seances[s.id].st==='abs').length;if(ab>=2)out.push(['abs',`${nm(e)} : ${ab} absences`]);
    L.forEach(s=>{const ct=ctrlDe(k,s.id);if(ct&&ct.err!=null&&ct.err>8)out.push(['coach',`${s.n} : ta mesure de ${nm(e)} diffère de ${fc(ct.err)} % de la FC notée par son coach${e.coach[s.id]?' ('+esc(e.coach[s.id].n)+')':''}`])});
    const fx=[];L.forEach(s=>{const d=e.seances[s.id];if(!d)return;const w=o=>{if(!o||typeof o!=='object')return;for(const q in o){if(q==='fc'){const v=num(o[q]);if(v!=null&&(v<45||v>230))fx.push(s.n)}else w(o[q])}};w(d)});if(fx.length)out.push(['zone',`${nm(e)} : FC invraisemblable (moins de 45 ou plus de 230) en ${[...new Set(fx)].join(', ')} : vérifie la mesure`]);
    const rp=done.map(s=>num((e.seances[s.id].bl||{}).rpe)).filter(x=>x!=null);if(rp.length>=3&&rp.slice(-3).every(x=>x>=9))out.push(['rpe',`${nm(e)} : effort ressenti 9-10 sur ses 3 dernières séances`]);
    if(done.length>=3&&!done.some(s=>(e.seances[s.id].bl||{}).reu))out.push(['coach',`${nm(e)} : son coach n’a jamais écrit « Ta réussite » (${done.length} séances)`]);
  });return out}
const ICA={qr:'📵',ko:'🎯',zone:'✎',abs:'🚫',coach:'⏱',rpe:'💡'};
const heat=r=>r>=0.75?'h3':r>=0.5?'h2':r>=0.25?'h1':'h0';
/* signe en plus de la couleur (daltonisme : rouge et vert se confondent pour 8 % des garçons) */
const sig=r=>`<em class="sig">${r>=0.75?'✓✓':r>=0.5?'✓':r>=0.25?'!':'✗'}</em>`;
const zoneTxt=e=>{const run=runOf(e);const f=filOf(run);const z=zonesOf(run);return f&&z?f+' · '+z[f][0]+'-'+z[f][1]:(z?'A '+z.A[0]+'-'+z.A[1]+' / B '+z.B[0]+'-'+z.B[1]:'–')};

/* ---------- Protection des données ---------- */
const installee=()=>{try{return navigator.standalone===true||matchMedia('(display-mode: standalone)').matches}catch(e){return false}};
function telecharger(nom,texte,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([texte],{type:type||'text/csv;charset=utf-8'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
function sauvegarder(nom){if(DEMO)return toast('Pas de sauvegarde en démo.');P.saveAt=Date.now();sauver();telecharger((nom||'Step_prof_sauvegarde_')+today()+'.json',JSON.stringify(Object.assign({stProf:1},P)),'application/json')}
function proposerSauvegarde(){if(!DEMO&&Date.now()-(P.saveAt||0)>864e5&&confirm('Séances importées. Enregistrer une sauvegarde maintenant ? (La dernière date de plus d’un jour.)'))sauvegarder()}
function bandeauSauvegarde(){
  if(DEMO||!Object.keys(P.eleves).length)return '';
  const j=P.saveAt?Math.floor((Date.now()-P.saveAt)/864e5):null;
  const msg=j==null?'Aucune sauvegarde : si l’iPad efface les données, tout est perdu.':j>=2?`Dernière sauvegarde il y a ${j} jours.`:'';
  const inst=installee()?'':'Installe l’outil sur l’écran d’accueil (Safari → Partager → « Sur l’écran d’accueil ») : sinon Safari peut effacer ses données après 7 jours sans ouverture.';
  if(!msg&&!inst)return '';
  return `<div class="bandeau ${j==null||j>=7?'rouge':''}">${msg?`<span>${msg}</span><button class="btn sm" data-act="sauvegarde">Sauvegarder maintenant</button>`:''}${inst?`<span class="small">${inst}</span>`:''}</div>`;
}

/* ---------- Affichage ---------- */
/* onglets rangés par moment : avant le cycle, pendant la séance, après la séance */
const ONGLETS=[['Avant'],['classes','Classes'],['Pendant'],['appel','Appel'],['import','Recevoir'],['chrono','Chrono'],['Après'],['seance','Séance'],['eleves','Élèves'],['defis','Défis'],['note','Note'],['pilotage','Pilotage'],['export','Exporter']];
function rendre(){
  const C=classes();if(P.classe&&!C.includes(P.classe))classeParDefaut();
  document.body.dataset.cy='S';
  $('#classes').innerHTML=C.length?`<select id="selClasse" class="in sel" aria-label="Classe">${C.map(c=>`<option${c===P.classe?' selected':''}>${esc(c)}</option>`).join('')}</select>`:'';
  $('#onglets').innerHTML=ONGLETS.map(o=>o.length<2?`<span class="og">${o[0]}</span>`:`<button data-act="vue" data-v="${o[0]}" class="${P.vue===o[0]||(P.vue==='fiche'&&o[0]==='eleves')?'ici':''}">${o[1]}</button>`).join('');
  if(P.vue!=='chrono'&&CH.run)chStop();
  const Vs={classes:vClasses,import:vImport,appel:vAppel,seance:vSeance,eleves:vEleves,fiche:vFiche,defis:vDefis,note:vNote,pilotage:vPilotage,chrono:chronoView,export:vExport};
  $('#main').innerHTML=icons((DEMO?bandeauDemo():'')+bandeauSauvegarde()+(Vs[P.vue]||vClasses)());
}
const render=rendre;                                     /* nom attendu par vues.js et le chrono */
const pasDeClasse=t=>`<section class="card"><h2>${t}</h2><p class="muted">Importe d’abord la liste d’une classe (onglet Classes) ou des séances (onglet Importer).</p></section>`;
function stripSeances(cy,cur,act){return `<div class="seg">${sessOf(cy).map(s=>`<button class="chip ${cur===s.id?'on':''}" data-act="${act||'seance'}" data-v="${s.id}">${s.n}</button>`).join('')}</div>`}
function seanceCourante(cy){const L=sessOf(cy);if(P.seance&&L.some(s=>s.id===P.seance))return P.seance;
  let der=0;eleves().forEach(k=>{const e=P.eleves[k];if(e)L.forEach((s,i)=>{if(e.seances[s.id]&&i>der)der=i})});return P.seance=L[der].id}

/* ----- Classes ----- */
function decouperNom(t){t=String(t||'').replace(/\s+/g,' ').trim();if(!t)return null;const w=t.split(' '),maj=x=>x===x.toUpperCase()&&/[A-ZÀ-Ý]/.test(x);
  const nom=w.filter(maj),pre=w.filter(x=>!maj(x));if(nom.length&&pre.length)return pre.join(' ')+' '+nom.join(' ');return t}
/* âge le jour de l'import, depuis la date de naissance Pronote (jj/mm/aaaa) */
function ageDe(t){const m=/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(String(t||''));if(!m)return '';let y=+m[3];if(y<100)y+=2000;const n=new Date(y,+m[2]-1,+m[1]),d=new Date();
  let a=d.getFullYear()-n.getFullYear();if(d.getMonth()<n.getMonth()||(d.getMonth()===n.getMonth()&&d.getDate()<n.getDate()))a--;return a>=12&&a<=22?a:''}
function lireLignes(rows,classeDefaut){
  rows=rows.map(r=>(r||[]).map(c=>c==null?'':String(c).trim()));
  const hi=rows.findIndex(r=>r.some(c=>/^(é|e)l(è|e)ve|^nom\b|^nom$|pr(é|e)nom/i.test(c)));const H=hi>=0?rows[hi].map(c=>nk(c)):[];
  const col=re=>H.findIndex(h=>re.test(h));const iNom=col(/^nom( de famille)?$/),iPre=col(/^prenom/),iEl=col(/^eleve|^nom prenom|^nom et prenom|^identite/),iCl=col(/^classe/),iSx=col(/^sexe|^genre/),iNe=col(/^ne e? le|^nee? le|^ne le|naissance/);
  const out={};rows.slice(hi+1).forEach(r=>{let n='';
    if(iNom>=0&&iPre>=0&&r[iNom])n=r[iPre]+' '+r[iNom].toUpperCase();else if(iEl>=0)n=decouperNom(r[iEl]);else if(hi<0)n=decouperNom(r[0]);
    if(!n||/^(total|effectif)/i.test(n))return;const c=(iCl>=0&&r[iCl])||classeDefaut;if(!c)return;(out[c]=out[c]||new Map()).set(n.trim(),{sx:iSx>=0?r[iSx]:'',age:iNe>=0?ageDe(r[iNe]):''})});
  return out}
async function importerListe(files,texte,classeDefaut){
  const lots=[];for(const f of files||[]){const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});wb.SheetNames.forEach(sn=>lots.push(XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:false,defval:''})))}
  if(texte&&texte.trim())lots.push(texte.trim().split(/\r?\n/).map(l=>l.split(/\t|;/)));
  const tout={};lots.forEach(rows=>Object.entries(lireLignes(rows,classeDefaut)).forEach(([c,m])=>{tout[c]=tout[c]||new Map();m.forEach((x,n)=>tout[c].set(n,x))}));
  const C=Object.keys(tout);if(!C.length){alert(classeDefaut?'Aucun nom trouvé.':'Pas de colonne « Classe » dans le fichier : écris le nom de la classe avant d’importer.');return}
  C.forEach(c=>{const old=P.classesL[c]||{lien:''};const L=[...tout[c].keys()].sort((a,b)=>nomDe(a).localeCompare(nomDe(b),'fr')||a.localeCompare(b,'fr'));
    P.classesL[c]={eleves:L,lien:old.lien||'',cy:'S'};
    tout[c].forEach((x,n)=>{const [k,e]=eleveDe(c,n);const s=String(x.sx||'').trim().toUpperCase();if(s&&!e.sexe)e.sexe=/^F/.test(s)?'F':/^(M|G|H)/.test(s)?'G':'';if(x.age&&!e.age)e.age=x.age})});
  journal('Listes importées : '+C.map(c=>c+' ('+tout[c].size+')').join(', '));P.classe=C[0];sauver();rendre();
}
const b64u=u=>{let x='';new Uint8Array(u).forEach(c=>x+=String.fromCharCode(c));return btoa(x).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const deb64=t=>Uint8Array.from(atob(String(t).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function clePublique(){if(!crypto.subtle||DEMO)return '';
  if(!P.cle){const p=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey']);P.cle={pub:b64u(await crypto.subtle.exportKey('raw',p.publicKey)),priv:await crypto.subtle.exportKey('jwk',p.privateKey)};sauver()}
  return P.cle.pub}
let RQ={h:null};
function svgQR(t){try{return STQR.svgQR(t)}catch(e){return '<p class="warn">Trop de données pour un seul QR.</p>'}}
function morceaux(txt,max){max=max||1400;if(txt.length<=max)return [txt];const tag=Math.random().toString(36).slice(2,6),n=Math.ceil(txt.length/max),o=[];for(let i=0;i<n;i++)o.push('SPEP|'+tag+'|'+(i+1)+'/'+n+'|'+txt.slice(i*max,(i+1)*max));return o}
function qrPlein(titre,sous,parts){const d=document.createElement('div');d.className='qr-plein';
  d.innerHTML=`<div><h2>${titre}</h2><p>${sous}</p><div class="qr" id="qpz"></div><p class="small center" id="qpn"></p><button class="btn pri big" type="button">Fermer</button></div>`;
  let i=0;const z=d.querySelector('#qpz'),n=d.querySelector('#qpn');z.innerHTML=svgQR(parts[0]);if(parts.length>1)n.textContent='1 / '+parts.length+' · la tablette vise jusqu’au bout';
  const h=parts.length>1?setInterval(()=>{i=(i+1)%parts.length;z.innerHTML=svgQR(parts[i]);n.textContent=(i+1)+' / '+parts.length+' · la tablette vise jusqu’au bout'},1100):null;
  d.querySelector('button').onclick=()=>{if(h)clearInterval(h);d.remove()};document.body.appendChild(d)}
async function qrDemarrage(c){const L=P.classesL[c],k=await clePublique();
  const ex=L.eleves.map(n=>P.eleves[cleEleve(c,n)]||{});
  const txt=await STQR.encoder({a:'SPE',v:1,t:'C',c,y:'S',l:L.eleves,x:ex.map(e=>e.sexe||''),g:ex.map(e=>e.age||''),u:L.lien||'',k});
  qrPlein('Classe '+esc(c)+' · carnet step','Appli élève : « Scanner le QR de la classe » (accueil, ou Groupe → Nouvelle liste de classe)',[txt])}
/* rappel d'archivage : des séances reçues pendant une année scolaire précédente (l'année scolaire commence le 15 août) */
const anneeSco=ms=>{const d=new Date(ms);return d.getFullYear()-((d.getMonth()<7||(d.getMonth()===7&&d.getDate()<15))?1:0)};
function vieilleAnnee(){if(DEMO)return null;const now=anneeSco(Date.now());let old=null;
  Object.values(P.eleves).forEach(e=>Object.values(e.recu||{}).forEach(r=>{if(r&&r.ts){const y=anneeSco(r.ts*1000);if(y<now&&(old==null||y<old))old=y}}));return old}
function rappelArchive(){const y=vieilleAnnee();return y==null?'':`<section class="card rappel-archive"><h3>Nouvelle année scolaire</h3><p class="small">L’outil contient encore des séances de ${y}-${y+1}. Archive-les avant d’importer les classes de cette année : la sauvegarde est téléchargée, puis l’outil repart à zéro.</p><button class="btn sm pri" data-act="archiver">Archiver ${y}-${y+1} et repartir à zéro</button></section>`}
function vClasses(){
  const C=Object.keys(P.classesL).sort((a,b)=>a.localeCompare(b,'fr'));
  return `${rappelArchive()}${DEMO?'':`<section class="card demo-carte"><h3>👀 Découvrir l’outil (démo)</h3><p class="small muted">Une classe fictive déjà remplie (S1 à S8) : appel, suivi des séances, fiches élèves, défis, note, pilotage. Rien n’est enregistré et tes vraies données ne sont pas touchées. Idéal pour montrer l’outil à un collègue.</p><div class="row wrap"><button class="btn pri" data-act="demo">Ouvrir la démo</button><a class="btn" href="../?demo">Démo de l’appli élève</a></div></section>`}
  <section class="card"><h2>Classes</h2><h3>Importer une liste Pronote</h3>
    <p class="small muted">Pronote : liste des élèves → Exporter (xlsx, xls ou csv). Avec une colonne « Classe », plusieurs classes s’importent d’un coup ; une colonne « Sexe » remplit fille/garçon et une colonne « Né(e) le » donne l’âge (il sert à calculer la FC max). Tu peux aussi coller la liste (un élève par ligne, « NOM Prénom »).</p>
    <div class="row wrap"><label>Classe (si le fichier ne la donne pas)<input id="cl-nom" class="in" placeholder="2nde 3"></label></div>
    <div class="row wrap"><label class="btn pri" for="cl-fic">Choisir le fichier Pronote</label><input id="cl-fic" type="file" accept=".xlsx,.xls,.csv,.ods,.txt" hidden multiple></div>
    <label>Ou coller la liste<textarea id="cl-txt" class="in" rows="4" placeholder="DUPONT Marie&#10;MARTIN Léo"></textarea></label><button class="btn sm" data-act="clcoller">Importer la liste collée</button></section>
  ${C.length?C.map(c=>{const L=P.classesL[c];return `<section class="card"><h3>${esc(c)} <span class="small muted">· ${L.eleves.length} élèves</span></h3>
    <div class="row wrap"><label style="flex:1 1 320px">Lien d’envoi en ligne (Nuage, « Demande de fichier ») — jamais visible par les élèves<input type="url" class="in cl-lien" style="max-width:none" data-cl="${esc(c)}" value="${esc(L.lien)}" placeholder="https://nuage03.apps.education.fr/s/…"></label></div>
    <div class="row wrap"><button class="btn pri" data-act="qrdem" data-v="${esc(c)}">QR de démarrage</button><button class="btn sm ghost" data-act="clsuppr" data-v="${esc(c)}">Retirer la liste</button></div>
    <details><summary class="small">Voir la liste</summary><ol class="small">${L.eleves.map(n=>{const e=P.eleves[cleEleve(c,n)]||{};return `<li>${esc(n)}${e.sexe||e.age?` <span class="muted">· ${e.sexe==='F'?'fille':e.sexe==='G'?'garçon':''}${e.age?' · '+esc(e.age)+' ans':''}</span>`:''}</li>`}).join('')}</ol></details></section>`}).join('')+`<p class="small muted">Le QR contient la liste (avec sexe et âge s’ils sont connus), le lien et ta clé de copie de secours. Si tu changes la liste ou le lien, les groupes rescannent le nouveau QR (Groupe → Nouvelle liste de classe).</p>`:''}
  <section class="card"><h3>Fin d’année</h3><p class="small muted">Télécharge une sauvegarde complète, puis vide l’outil pour la rentrée suivante.</p><button class="btn sm ghost" data-act="archiver">Archiver l’année et repartir à zéro</button></section>
  <p class="ver">Step · outil prof ${APP_VERSION} · lien de démonstration pour un collègue : <b>${esc(location.origin+location.pathname)}?demo</b></p>`;
}
/* ----- Importer ----- */
function vImport(){const n=Object.values(P.eleves).reduce((s,e)=>s+Object.keys(e.seances).length,0);
  return `${rappelArchive()}<section class="card"><h2>Récupérer les séances</h2><div class="grid2">
    <div class="sub"><h3>QR codes</h3><p class="small muted">En fin de séance, chaque élève montre son QR : scanne-les à la suite, la caméra reste ouverte. Les anciens QR du carnet numérique sont aussi acceptés.</p><button class="btn pri big" data-act="scanner">Scanner les QR codes</button></div>
    <div class="sub"><h3>Fichiers</h3><p class="small muted">Les fichiers .json déposés par les élèves, ou le dossier du Nuage téléchargé en .zip. Sur ordinateur, tu peux aussi les glisser ici.</p><label class="btn pri big" for="fic">Choisir des fichiers</label><input id="fic" type="file" multiple accept=".json,.zip,.txt,application/json,application/zip" hidden></div></div>
    <p>${n} séance${n>1?'s':''} d’élèves dans l’outil. Réimporter les mêmes fichiers ne crée pas de doublon.</p>
    ${P.journal.length?`<ul class="small">${P.journal.slice(0,6).map(j=>`<li>${new Date(j.d).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} · ${esc(j.t)}${j.err.length?`<ul>${j.err.slice(0,8).map(e=>`<li class="ko">${esc(e)}</li>`).join('')}</ul>`:''}</li>`).join('')}</ul>`:''}</section>
  ${ancienProf()?`<section class="card todo"><h3>Ancien carnet numérique</h3><p class="small">Le mode prof de l’ancien carnet contient ${ancienProf()} élève${ancienProf()>1?'s':''} sur cet appareil. Importe-les ici (séances, ★, notes AFL2/AFL3) : rien n’est effacé dans l’ancien carnet.</p><button class="btn pri" data-act="migrer">Importer l’ancien carnet</button></section>`:''}
  ${vSecours()}
  <section class="card"><h3>Passer de l’iPad au PC</h3><p class="small muted">Les données restent sur cet appareil. Exporte une sauvegarde, range-la dans ton espace personnel, puis restaure-la sur l’autre appareil.</p>
    <div class="row wrap"><button class="btn sm" data-act="sauvegarde">Exporter une sauvegarde</button><label class="btn sm" for="resto">Restaurer une sauvegarde</label><input id="resto" type="file" accept=".json" hidden><button class="btn sm ghost" data-act="effacer">Tout effacer</button></div></section>`}
/* copies de secours des carnets (chiffrées pour la clé du prof) */
async function ouvrirBrut(o){if(!P.cle)throw new Error('clé du professeur absente (restaure ta sauvegarde).');
  const priv=await crypto.subtle.importKey('jwk',P.cle.priv,{name:'ECDH',namedCurve:'P-256'},false,['deriveKey']);
  const pub=await crypto.subtle.importKey('raw',deb64(o.epk),{name:'ECDH',namedCurve:'P-256'},false,[]);
  const cle=await crypto.subtle.deriveKey({name:'ECDH',public:pub},priv,{name:'AES-GCM',length:256},false,['decrypt']);
  return crypto.subtle.decrypt({name:'AES-GCM',iv:deb64(o.iv)},cle,deb64(o.data))}
async function ouvrirSecours(o){let b;try{b=await ouvrirBrut(o)}catch(e){throw new Error(P.cle?'copie de secours chiffrée avec une autre clé (autre appareil prof ?).':'copie de secours : clé du professeur absente (restaure ta sauvegarde).')}return new TextDecoder().decode(b)}
async function importerSecours(o){const c=JSON.parse(await ouvrirSecours(o));if(!c.carnetST)throw new Error('copie de secours illisible');
  P.secours=P.secours||{};const id=nk(o.classe)+'|'+(o.noms||[]).map(nk).sort().join('#'),old=P.secours[id];
  if(old&&old.date>o.date)return;P.secours[id]={classe:o.classe,noms:o.noms,seance:o.seance,date:o.date,epk:o.epk,iv:o.iv,data:o.data}}
function vSecours(){const L=Object.entries(P.secours||{}).filter(([,x])=>!P.classe||x.classe===P.classe).sort((a,b)=>a[1].noms.join().localeCompare(b[1].noms.join(),'fr'));
  return `<section class="card"><h3>Copies de secours des carnets ${P.classe?'· '+esc(P.classe):''}</h3>
    <p class="small muted">À chaque envoi en ligne, le carnet complet du groupe arrive aussi, chiffré : seul cet outil (ta clé) peut l’ouvrir. Tablette perdue ou effacée ? Télécharge le carnet ici puis, sur la nouvelle tablette : Groupe → « Reprendre un carnet ». Le groupe choisit un nouveau code.</p>
    ${L.length?`<ul class="wl">${L.map(([id,x])=>`<li><span><b>${x.noms.map(esc).join(' · ')}</b> <span class="small muted">${esc(x.classe)} · ${esc(String(x.seance||'').toUpperCase())} · ${esc(x.date)}</span></span><button class="btn sm" data-act="secours" data-v="${esc(id)}">Télécharger le carnet</button></li>`).join('')}</ul>`:'<p class="muted small">Aucune copie reçue pour l’instant (elles arrivent avec l’envoi en ligne, après le QR de démarrage).</p>'}
    ${P.cle?'':'<p class="small warn">La clé est créée au premier « QR de démarrage » : garde une sauvegarde de l’outil, sans elle les copies ne s’ouvrent plus.</p>'}</section>`}
async function telechargerSecours(id){const x=P.secours&&P.secours[id];if(!x)return;
  try{telecharger('Carnet_Step_'+slug(x.classe)+'_'+x.noms.map(n=>slug(prenomDe(n))).join('-')+'.json',await ouvrirSecours(x),'application/json')}catch(e){alert(e.message||e)}}
/* ancien carnet step (mode prof du carnet tout-en-un, même site) */
function ancienPDB(){try{const o=JSON.parse(localStorage.getItem('step2_prof_v1'));return o&&o.students?o:null}catch(e){return null}}
function ancienProf(){if(DEMO||P.migre)return 0;const o=ancienPDB();return o?Object.keys(o.students).length:0}
function migrerProf(){const o=ancienPDB();if(!o)return;let n=0;
  Object.entries(o.students).forEach(([ok,st])=>{const full=((st.prenom||'')+' '+String(st.nom||'').toUpperCase()).trim();if(!full||!st.classe)return;
    Object.entries(st.seances||{}).forEach(([sid,d])=>{if(!SBY[sid])return;const t0=(st.recu||{})[sid];const ts=Math.round((typeof t0==='number'?t0:Date.now())/1000);
      try{ajouterSeance({classe:st.classe,eleve:full,sexe:st.sexe,age:st.age,fcrM:st.fcrM,seance:sid,date:new Date(ts*1000).toISOString().slice(0,10),ts,src:'qr',d});n++}catch(e){}});
    const [k,e]=eleveDe(st.classe,full);['afl2','afl3','an'].forEach(f=>{if(st[f]&&!e[f==='an'?'ana':f])e[f==='an'?'ana':f]=st[f]});if(st.sexe&&!e.sexe)e.sexe=st.sexe;if(st.age&&!e.age)e.age=st.age;
    if(o.stars&&o.stars[ok])P.stars[k]=Object.assign({},o.stars[ok],P.stars[k]||{})});
  P.migre=Date.now();journal('Ancien carnet importé : '+n+' séance(s)');classeParDefaut();sauver();rendre()}
/* ----- Appel ----- */
const cleGroupe=L=>L.map(n=>cleEleve(P.classe,n)).sort().join('#');
function groupesAppel(sid){
  const K=eleves(),recu=new Set(K.filter(k=>P.eleves[k]&&P.eleves[k].seances[sid]));const L=sessOf(clsCy(P.classe)),i=L.findIndex(s=>s.id===sid);
  const env={};K.forEach(k=>{const e=P.eleves[k];const g=e&&e.groupe[sid];if(!g)return;const c=cleGroupe(g);const r=e.recu[sid]||{};(env[c]=env[c]||{noms:g,src:new Set,ts:0}).src.add(r.src==='qr'?'QR':'en ligne');env[c].ts=Math.max(env[c].ts,r.ts||0)});
  const manq={};K.forEach(k=>{if(recu.has(k))return;const e=P.eleves[k];if(!e)return;let g=null,s0=null;for(let j=i-1;j>=0&&!g;j--){if(e.groupe[L[j].id]){g=e.groupe[L[j].id];s0=L[j].n}}
    if(!g)return;const c=cleGroupe(g);(manq[c]=manq[c]||{noms:g,s:s0,qui:[]}).qui.push(k)});
  const E=Object.values(env),M=Object.values(manq);if(!E.length&&!M.length)return '';
  const h=t=>t?new Date(t*1000).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'';
  return `<section class="card"><h3>Groupes · ${SBY[sid].n}</h3>
    ${M.length?`<p class="ko">⚠ Rien reçu de :</p><ul>${M.map(g=>`<li><b>${g.qui.map(k=>esc(nomAff(k))).join(' · ')}</b> <span class="small muted">(groupe en ${g.s} : ${g.noms.map(esc).join(', ')})</span></li>`).join('')}</ul><p class="small muted">Absents, ou envoi oublié ? Le carnet reste sur leur tablette : il suffit d’ouvrir la séance et d’envoyer (le rappel s’affiche chez eux).</p>`:''}
    ${E.length?`<p class="ok">✓ Ont envoyé :</p><ul class="small">${E.map(g=>`<li>${g.noms.map(esc).join(' · ')} — ${[...g.src].join(' + ')} ${h(g.ts)}</li>`).join('')}</ul>`:''}</section>`}
function vAppel(){if(!P.classe)return pasDeClasse('Appel');const cy=clsCy(P.classe),sid=seanceCourante(cy),K=eleves();const inList=new Set(liste().map(n=>cleEleve(P.classe,n)));
  const st=K.map(k=>[k,statut(k,sid)]);const cpt={};st.forEach(([,x])=>cpt[x.c]=(cpt[x.c]||0)+1);
  return `<section class="card"><h2>Appel · ${SBY[sid].n}</h2>${stripSeances(cy,sid)}
    <p>${Object.entries(cpt).map(([c,n])=>`<span class="badge st-${c}">${STATUTS[c]} : ${n}</span>`).join(' ')}</p>
    <div class="tw"><table class="tt l"><tr><th>Élève</th><th>Statut</th><th>Reçu</th><th>Corriger</th></tr>
    ${st.map(([k,x])=>{const e=P.eleves[k],r=e&&e.recu[sid];return `<tr class="st-${x.c}"><td><button class="lnk" data-act="fiche" data-k="${esc(k)}">${esc(nomAff(k))}</button>${inList.has(k)||!inList.size?'':' <span class="badge">hors liste</span>'}</td><td>${STATUTS[x.c]}${x.manuel?' <span class="small muted">(corrigé)</span>':''}</td><td class="small">${r?(r.src==='qr'?'QR':'en ligne')+(r.date?' · '+esc(dateFr(r.date)):''):'–'}</td>
      <td><select class="in sel" data-appel="${esc(k)}"><option value="">auto</option>${['present','retard','tenue','disp','absent','abj','oubli'].map(c=>`<option value="${c}"${x.manuel&&x.c===c?' selected':''}>${STATUTS[c]}</option>`).join('')}</select></td></tr>`}).join('')}</table></div>
    <p class="small muted">Auto : séance reçue = présent ; « absent » ou « blessé / dispensé » coché par le groupe = absent ou dispensé ; rien = rien reçu. « Hors liste » : nom absent de la liste Pronote, à fusionner depuis sa fiche.</p></section>${groupesAppel(sid)}`}
/* ----- Séance (classe entière) ----- */
function vSeance(){if(!P.classe)return pasDeClasse('Séance');const cy='S',sid=seanceCourante(cy),s=SBY[sid];
  return `<section class="card"><h2>${s.n} · ${esc(s.t)}</h2>${stripSeances(cy,sid)}
  <div class="tw"><table class="tt pt"><tr><th>Élève</th><th>Réussites</th><th>Écart zone</th><th>Coach a vu</th><th>Effort · charge</th><th>Rôle</th><th>Prochaine fois</th><th>Contrôle prof<br><small>FC 1re mesure</small></th><th>★ AFL2</th><th>★ AFL3</th></tr>${eleves().map(k=>{const e=P.eleves[k];const d=e&&e.seances[sid];const sr=starOf(k,sid);
    const n0=`<th class="l"><button class="lnk" data-act="fiche" data-k="${esc(k)}">${e?nm(e):esc(nomAff(k))}</button>`;
    if(!d)return `<tr class="no">${n0}</th><td colspan="9">rien reçu</td></tr>`;if(d.st==='abs')return `<tr class="no">${n0}</th><td colspan="9">absent(e)</td></tr>`;
    const ct=ctrlDe(k,sid),cv=(P.ctrl&&P.ctrl[k]&&P.ctrl[k][sid])||'';const run=runOf(e);
    const [t,n]=tenR(run,sid);const bl=d.bl||{};const cr=(bl.cr||[]).filter(Boolean).length;const ec=ecartOf(sid,d,run);
    return `<tr>${n0}${d.st==='bl'?'<br><small>ne pratique pas</small>':''}${d.cx?'<br><small>coach : '+esc(d.cx.n)+'</small>':''}${d.ad?'<br><small>adapté</small>':''}</th><td><button class="cell" data-act="det" data-k="${esc(k)}" data-v="${sid}">${n?t+'/'+n:'✓'}</button></td><td>${ec!=null?R(ec)+' /min':'–'}</td><td>${cr}/3</td><td>${bl.rpe!=null&&bl.rpe!==''?'RPE '+esc(bl.rpe)+' · '+chargeOf(d)+' UA':'–'}</td><td>${esc(bl.role||'–')}</td><td class="l small">${esc(DEC_TXT[bl.dc]||bl.nx||'')}</td>
     <td>${!d.st?`<input class="in w" data-ctrl="${esc(k)}|${sid}" inputmode="numeric" value="${esc(cv)}" placeholder="FC">${ct&&ct.err!=null?`<br><small class="${ct.err<=5?'ok':'ko'}">coach ${R(ct.r)} · ±${fc(ct.err)} %</small>`:''}`:'–'}</td>
     <td><button class="star ${sr.a2?'on':''}" data-act="star" data-k="${esc(k)}" data-v="${sid}|a2">★</button></td><td><button class="star ${sr.a3?'on':''}" data-act="star" data-k="${esc(k)}" data-v="${sid}|a3">★</button></td></tr>`}).join('')}</table></div>
  <p class="small muted">Touche le nombre de réussites pour le détail de la séance. <b>Contrôle prof</b> : mesure toi-même la FC d’un ou deux élèves à la 1re mesure (celle de la séance de filière à partir de S5) ; l’écart avec la FC notée par leur coach sert à l’AFL3 et repère les données fausses. ★ = observation du prof pour l’AFL2 / l’AFL3 (reprise dans l’onglet Note).</p></section>`}
/* ----- Élèves : tableau du cycle ----- */
/* Colonnes « écart, coach, blanche, S8 » : repliées par défaut (une ligne par élève), réglage gardé sur l'appareil */
let EL_PLUS=(()=>{try{return localStorage.getItem('stp-eleves-plus')==='1'}catch(e){return false}})();
document.addEventListener('click',ev=>{if(!ev.target.closest('[data-elplus]'))return;EL_PLUS=!EL_PLUS;try{localStorage.setItem('stp-eleves-plus',EL_PLUS?'1':'0')}catch(e){}const y=scrollY;render();scrollTo(0,y)});
function vEleves(){if(!P.classe)return pasDeClasse('Élèves');const cy='S',L=SESS;
  const al=alertes(P.classe),plus=EL_PLUS;
  return `<section class="card"><h2>Élèves · ${esc(P.classe)}</h2>${al.length?`<details class="alerts" open><summary>⚠ ${al.length} point${al.length>1?'s':''} d’attention</summary><ul>${al.map(a=>`<li><span>${ICA[a[0]]}</span>${a[1]}</li>`).join('')}</ul></details>`:''}
  <div class="row wrap noprint"><button class="btn sm" type="button" data-elplus="1" aria-pressed="${plus}">${plus?'Moins de colonnes':'Plus de colonnes : écart, coach, blanche, S8'}</button></div>
  <div class="tw"><table class="tt pt${plus?'':' compact'}"><tr><th>Élève</th><th>Filière · zone</th>${L.map(s=>`<th>${s.n}</th>`).join('')}<th>Réussites</th>${plus?'<th>Écart zone<br><small>début → fin</small></th><th>Comme coach</th><th>Blanche S7<br><small>produire /8</small></th><th>S8<br><small>produire /8</small></th>':''}</tr>
  ${eleves().map(k=>{const e=P.eleves[k];if(!e)return `<tr class="no"><th class="l">${esc(nomAff(k))}</th><td colspan="${L.length+(plus?6:2)}">rien reçu</td></tr>`;const run=runOf(e);const [TT,N]=totaux(e);const dg=degreeOf(TT,N);
    const b7=afl1(run,e.seances.s7),e8=afl1(run,e.seances.s8);
    return `<tr><th class="l"><button class="lnk" data-act="fiche" data-k="${esc(k)}">${nm(e)}</button></th><td class="small">${esc(zoneTxt(e))}</td>${L.map(s=>{const d=e.seances[s.id];const st=statut(k,s.id).c;if(!d)return `<td class="no">${st==='abj'||st==='absent'?'abs':st==='oubli'?'oubli':'·'}</td>`;const [t,n]=tenR(run,s.id);const sr=starOf(k,s.id);
      if(d.st)return `<td class="abs"><button class="cell" data-act="det" data-k="${esc(k)}" data-v="${s.id}">${d.st==='abs'?'abs':'disp'}</button></td>`;
      return `<td class="yes ${n?heat(t/n):''}"><button class="cell" data-act="det" data-k="${esc(k)}" data-v="${s.id}">${n?sig(t/n)+t+'/'+n:'✓'}${d.ad?(plus?'<i>adapté</i>':'<i title="pratique adaptée">ad.</i>'):''}${d.cx?(plus?'<i>coach ↺</i>':'<i title="coach remplacé">↺</i>'):''}${sr.a2?'<i>★2</i>':''}${sr.a3?'<i>★3</i>':''}</button></td>`}).join('')}
     <td class="${N?heat(TT/N):''}">${N?(plus?sig(TT/N)+TT+'/'+N+' · '+R(100*TT/N)+' %<br><small>degré '+dg+'</small>':`<span title="${TT}/${N} · degré ${dg}">${sig(TT/N)}${R(100*TT/N)} %</span>`):'–'}</td>${plus?`<td>${ecTrend(e)}</td><td>${coachTxt(k)}</td><td>${fc(b7&&b7.prod)}</td><td>${fc(e8&&e8.prod)}</td>`:''}</tr>`}).join('')}</table></div>
  <p class="muted small">Case = réussites / tentées (dès S4 : mesures dans la zone) · ✓✓ ¾ et plus, ✓ ½, ! ¼, ✗ moins · ↺ coach remplacé, ad. pratique adaptée. Touche une case pour le détail, un nom pour la fiche (courbes, coach, écart).</p></section>`}
/* ----- Défis : points et badges (ils n'entrent pas dans la note) ----- */
function vDefis(){if(!P.classe)return pasDeClasse('Défis');const K=eleves().filter(k=>P.eleves[k]);
  const mateOf=k=>{const e=P.eleves[k];for(const s of SESS){const g=e.groupe[s.id];if(g&&g.length){const o=g.find(n=>nk(n)!==nk(e.full));if(o){const ko=cleEleve(e.classe,o);if(P.eleves[ko])return runOf(P.eleves[ko])}}}return null};
  const rows=K.map(k=>{const e=P.eleves[k];const run=runOf(e);const sc=scoreRun(run);return {k,e,sc,bg:badgesOf(run,mateOf(k)),co:coordOf(run)}}).sort((a,b)=>b.sc.tot-a.sc.tot);
  return `<section class="card"><h2>Défis · ${esc(P.classe)}</h2><p class="muted small">Points Juste Pouls + Pile dans la cible (S3 à S7), badges et défis de coordination (S2 à S7). Ils motivent ; ils n’entrent pas dans la note.</p>
  <div class="tw"><table class="tt pt"><tr><th>#</th><th>Élève</th><th>Juste Pouls</th><th>Cible</th><th>Total</th><th>Badges</th><th>Coordination</th></tr>${rows.map((r,i)=>`<tr><td>${i+1}</td><th class="l"><button class="lnk" data-act="fiche" data-k="${esc(r.k)}">${nm(r.e)}</button></th><td>${r.sc.jp}</td><td>${r.sc.ci}</td><td><b>${r.sc.tot}</b></td><td class="l small">${r.bg.length?r.bg.map(b=>'🏅 '+BADGES.find(x=>x[0]===b)[1]).join(' '):'–'}</td><td class="l small">${r.co.length?r.co.map(c=>COORD[c][0]).join(', '):'–'}</td></tr>`).join('')}</table></div></section>`}
/* ----- Fiche élève ----- */
function vFiche(){const k=P.eleve,e=P.eleves[k];if(!e){P.vue='eleves';return vEleves()}
  const cy='S',L=SESS,run=runOf(e);const [TT,N]=totaux(e);const dg=degreeOf(TT,N);const autres=eleves().filter(x=>x!==k);const z=zonesOf(run);
  /* courbes : on réutilise l'écran « Ma progression » du carnet sur un groupe d'un seul élève */
  DB.binomes=[{id:'fiche',cy,runners:[Object.assign({prenom:e.prenom,nom:e.nom},run)]}];V={bin:'fiche',v:'prog'};
  const prog=progView().replace('<h2>Ma progression</h2>','').replace(/<h3>[^<]*<\/h3>/,'');
  return `<div class="row wrap"><button class="btn sm" data-act="vue" data-v="eleves">← Élèves</button><button class="btn sm" data-act="imprimer">Imprimer la fiche</button></div>
  <section class="card"><h2>${nm(e)} <span class="cls s">${esc(e.classe)}</span></h2>
   <div class="outs">${out('Filière · zone',esc(zoneTxt(e)))}${out('FC repos · FC max',z?z.rep+' · '+z.max+(z.obs?' (observée)':''):'–')}${out('Réussites',N?TT+' / '+N+' ('+R(100*TT/N)+' %)':'–','hi')}${out('Degré AFL2',dg?DEG_TXT[dg]:'–')}${out('Comme coach',coachTxt(k))}${out('Écart zone début → fin',ecTrend(e))}${(([rt,tn])=>rt||tn?out('Retards · tenue',rt+' · '+tn):'')(tenueRetard(k,e.classe))}</div>
   ${e.sexe&&e.age?'':`<p class="warn small">${e.sexe?'':`Fille ou garçon ? <button class="btn sm" data-act="sexe" data-k="${esc(k)}" data-v="F">Fille</button> <button class="btn sm" data-act="sexe" data-k="${esc(k)}" data-v="G">Garçon</button> `}${e.age?'':`Âge ? ${[14,15,16,17,18].map(a=>`<button class="btn sm" data-act="age" data-k="${esc(k)}" data-v="${a}">${a}</button>`).join(' ')}`} (FC max)</p>`}</section>
  <section class="card"><h3>Séances</h3><div class="tw"><table class="tt l"><tr><th>Séance</th><th>Statut</th><th>Réussites</th><th>Reçu</th><th>Groupe · coach</th><th>Ce que dit le coach</th></tr>${L.map(s=>{const d=e.seances[s.id],st=statut(k,s.id),r=e.recu[s.id];const [t,n]=d?tenR(run,s.id):[0,0];const bl=(d&&d.bl)||{};
    return `<tr><th>${s.n}</th><td>${STATUTS[st.c]}</td><td>${d&&!d.st?`<button class="cell" data-act="det" data-k="${esc(k)}" data-v="${s.id}">${n?t+'/'+n:'✓'}</button>`:'–'}</td><td class="small">${r?(r.src==='qr'?'QR':'en ligne')+' '+esc(dateFr(r.date)):'–'}</td><td class="small">${(e.groupe[s.id]||[]).map(x=>esc(prenomDe(x))).join(', ')}${e.coach[s.id]?' · coach '+esc(prenomDe(e.coach[s.id].n))+(e.coach[s.id].rep?' (remplaçant)':''):''}</td><td class="small">${esc(bl.reu||'')}${bl.con?' · '+esc(bl.con):''}</td></tr>`}).join('')}</table></div></section>
  <section class="card">${prog}</section>
  <section class="card"><h3>QR de reprise</h3><p class="small muted">Tablette perdue, code oublié, changement de groupe sans l’ancienne tablette : ce QR rend à l’élève toutes les séances que tu as reçues. Dans son groupe : Groupe → « Scanner le QR de l’élève ».</p><button class="btn pri" data-act="reprise" data-k="${esc(k)}">Afficher le QR de reprise</button></section>
  ${autres.length?`<section class="card"><h3>Même élève sous un autre nom ?</h3><p class="small muted">Si ${esc(e.full)} apparaît aussi avec une faute de frappe, fusionne les deux.</p>
    <div class="row wrap"><select id="fusion" class="in sel"><option value="">— Choisir —</option>${autres.map(a=>`<option value="${esc(a)}">${esc(nomAff(a))}</option>`).join('')}</select><button class="btn sm" data-act="fusionner">Fusionner dans ${esc(e.prenom)}</button></div></section>`:''}`}
async function qrReprise(k){const e=P.eleves[k];const se={};Object.entries(e.seances).forEach(([sid,d])=>{if(hasData(d))se[sid]=d});
  const txt=await STQR.encoder({a:'SPE',v:1,t:'T',c:e.classe,y:'S',e:e.full,x:e.sexe||'',g:e.age||'',fr:e.fcrM||'',se});
  qrPlein(esc(e.full)+' · reprise','Appli élève : Groupe → « Scanner le QR de l’élève »',morceaux(txt))}
function detail(k,sid){const e=P.eleves[k];const d=e.seances[sid];const s=SBY[sid];const run=runOf(e);const f=filOf(run);const z=zoneFor(run,f);
  const [t,n]=tenR(run,sid);const bl=d.bl||{};const L=[];const v=x=>esc(x==null||x===''?'–':x);
  const fcl=(arr)=>arr.map(x=>x&&x.fc!=null?esc(x.fc)+(x.an!=null?' (annonce '+esc(x.an)+')':'')+(x.rp!=null?' (ressenti '+esc(x.rp)+')':''):'·').join(' · ');
  if(d.fcr)L.push(['FC de repos','provisoire '+v(d.fcr.pv)+' · matins '+(d.fcr.m||[]).map(x=>x||'·').join(' / ')]);
  ['m1','lv','bi','lg'].forEach(key=>{if(d[key])L.push([{m1:'Premier effort',lv:'Test des leviers',bi:'Essai bref et intense',lg:'Effort long'}[key],fcl(d[key])+(key==='lg'&&d.lgar!=null?' · '+v(d.lgar)+' arrêt(s)':'')])});
  [1,2,3].forEach(i=>{const x=d['b'+i];if(x)L.push(['Bloc '+i,'enchaînés '+v(x.en)+' · erreurs '+v(x.er)+(x.df&&x.df.length?' · difficiles : '+esc(x.df.join(', ')):'')])});
  if(d.zc)L.push(['Calcul des zones',['mx','fr','a0','a1','b0','b1'].map(q=>v(d.zc[q])).join(' · ')+(d.zc.vu?' · vérifié':'')]);
  if(d.co)L.push(['Coordination',Object.entries(d.co).map(([c,x])=>(COORD[c]?COORD[c][0]:c)+' : '+(x==='1'?'réussi':x==='n'?'pas meneur':'pas encore')).join(' · ')]);
  if(d.tri)L.push(['3 blocs enchaînés seul',d.tri==='1'?'oui (badge Mémoire)':'pas encore']);
  if(d.cu)L.push(['Curseurs','basse '+v(regTot(d.cu.lo&&d.cu.lo.r))+' → '+v(d.cu.lo&&d.cu.lo.fc)+' · haute '+v(regTot(d.cu.hi&&d.cu.hi.r))+' → '+v(d.cu.hi&&d.cu.hi.fc)]);
  if(d.vs)L.push(['Viser le milieu (zone '+v(d.vs.f)+')',[1,2].map(i=>d.vs[i]?v(regTot(d.vs[i].r))+' → '+v(d.vs[i].fc)+(d.vs[i].an?' (annonce '+esc(d.vs[i].an)+')':''):'·').join(' · ')]);
  if(d.es)L.push(['Essai filière '+v(d.es.f),fcl(d.es.m||[])]);
  if(d.ch)L.push(['Choix','filière '+v(d.ch.f)+' · répartition '+v(d.ch.rep)+'<br>'+[d.ch.a1,d.ch.a2,d.ch.a3].filter(Boolean).map(esc).join('<br>')]);
  if(d.wc)L.push(['Échauffement',(d.wc||[]).length+'/9 · '+(d.wc||[]).map(c=>esc(WARM_NAME[c]||c)).join(', ')]);
  if(d.ps)L.push(['Version perso',[1,2,3].map(i=>'B'+i+' '+v(regTot(d.ps['b'+i]))+(d.ps['b'+i]&&d.ps['b'+i].r?' ('+esc(d.ps['b'+i].r)+')':'')).join(' · ')]);
  if(d.rg)L.push(['Réglage 2 × 2 min',[1,2].map(i=>d.rg[i]?v(regTot(d.rg[i].r))+' → '+v(d.rg[i].fc):'·').join(' · ')]);
  if(d.pl)L.push(['Plan',(d.pl.r||[]).map(x=>v(x)).join(' / ')+(d.pl.si?' · '+esc(d.pl.si):'')]);
  if(d.fl)L.push(['Séance de filière (FC · arrêts)',((d.fl.m)||[]).map(x=>x?v(x.fc)+(inZ(num(x.fc),z)?' ✓':' ✗')+(num(x.ar)?' · '+x.ar+' arr.':''):'·').join(' · ')+'<br>réglages : '+((d.fl.s)||[]).map(r=>v(regTot(r))).join(' / ')]);
  if(DEFI_S.includes(sid)){const sc=scoreSeance(sid,d,run);const an=annonces(d);if(an.length||sc.ci)L.push(['Défis','Juste Pouls '+sc.jp+' pts ('+an.map(([a,f])=>a+'→'+f).join(', ')+')'+(sc.ci?' · cible '+sc.ci+' pts':'')])}
  if(d.ob)L.push(['Coach juge','sécurité '+v(d.ob.sec)+' · plan '+v(d.ob.pl)]);
  if(d.an)L.push(['Analyse',[d.an.c,d.an.k,d.an.r].map(v).join('<br>')]);
  if(d.situe)L.push(['Se situe','AFL2 degré '+v(d.situe.a2)+' · AFL3 degré '+v(d.situe.a3)]);
  if(d.ad)L.unshift(['Présence','pratique adaptée (tolérance de 6 pulsations)']);if(d.st)L.unshift(['Présence',ST_TXT[d.st]+(d.mot?' · '+esc(d.mot):'')+(bl.role?' · rôle : '+esc(bl.role):'')]);if(d.cx)L.unshift(['Coach remplaçant',esc(d.cx.n)+' · '+esc(WHY_TXT[d.cx.why]||'')]);
  const a=s.eval||sid==='s7'?afl1(run,d):null;const pe=pronoErrD(d);
  modal(`<h2>${esc(e.full)} · ${s.n}</h2><p class="muted small">${f?'Filière '+f+' · zone '+(z?z[0]+'-'+z[1]:'?')+' · ':''}réussites ${n?t+'/'+n:'–'}${a?' · produire '+fc(a.prod)+'/8':''}</p>
   <table class="tt l">${L.map(l=>`<tr><th>${l[0]}</th><td>${l[1]}</td></tr>`).join('')}
   <tr><th>Coach a vu</th><td>${s.crit.map((c,i)=>(bl.cr&&bl.cr[i]?'☑ ':'☐ ')+esc(c)).join('<br>')}</td></tr>
   <tr><th>Réussite / conseil</th><td>${v(bl.reu)} / ${v(bl.con)}</td></tr><tr><th>Effort · charge</th><td>${bl.rpe!=null&&bl.rpe!==''?'RPE '+esc(bl.rpe)+' · '+chargeOf(d)+' UA':'–'}</td></tr>
   <tr><th>Coach</th><td>pronostic ${v(bl.pr)}${pe!=null?' (±'+R(pe)+' %)':''} · conseil utile : ${bl.aide==='1'?'oui':bl.aide==='0'?'non':'–'}</td></tr>
   <tr><th>Décision · prochaine fois</th><td>${esc(DEC_TXT[bl.dc]||'–')} · ${v(bl.nx)}</td></tr></table><div class="row wrap"><button class="btn" data-act="closem">Fermer</button></div>`)}
/* ----- Note ----- */
/* répartition AFL2 / AFL3 (8 points) choisie par l'élève en S4 (6/2, 4/4 ou 2/6) */
const AFLMAX=(cy,e)=>{const rep=(e.seances.s4&&e.seances.s4.ch&&e.seances.s4.ch.rep)||'4/4';const m=String(rep).split('/').map(Number);return m.length===2&&m.every(x=>!isNaN(x))?m:[4,4]};
const arr=(x,p)=>Math.round(x/(p||0.5))*(p||0.5);
/* AFL2 « s'entraîner » : la moitié (2 points au plus) sur les réussites (zone de FC tenue séance après séance),
   le reste sur la préparation : échauffement complet, plan écrit, régulation écrite (décision, analyse). ★ AFL2 du prof : +0,5 à partir de 2. */
const FR=[0.25,0.5,0.75,1];
function prepa(e){const ech=[],pla=[],reg=[];
  SESS.forEach(s=>{const d=e.seances[s.id];if(!hasData(d)||d.st)return;
    s.blocks.map(bk).forEach(([ty])=>{
      if(ty==='warm')ech.push(Math.min(1,(d.wc||[]).length/9));
      if(ty==='plan')pla.push(d.pl&&(d.pl.r||[]).some(x=>x!==''&&x!=null)?(d.pl.si?1:0.5):0);
      if(ty==='analyse')reg.push(d.an?['c','k','r'].filter(q=>String(d.an[q]||'').trim().length>=5).length/3:0);
      if(ty==='choix')reg.push(d.ch&&d.ch.f?[d.ch.a1,d.ch.a2,d.ch.a3].filter(x=>String(x||'').trim().length>=3).length/3:0)});
    if(SESS.findIndex(x=>x.id===s.id)>=3&&!s.eval)reg.push((d.bl||{}).dc||String((d.bl||{}).nx||'').trim().length>=5?1:0)});
  const parts=[['échauffement',moy(ech)],['plan',moy(pla)],['régulation écrite',moy(reg)]].filter(x=>x[1]!=null);
  return parts.length?{v:moy(parts.map(x=>x[1])),parts}:null}
function sugAFL2(e,cy){const [T,N]=totaux(e);const dg=degreeOf(T,N);const mx=AFLMAX(cy,e)[0],mt=Math.min(2,mx/2),mp=mx-mt;const pr=prepa(e);if(!dg&&!pr)return null;
  const st=Object.values(P.stars[cleEleve(e.classe,e.full)]||{}).filter(x=>x.a2).length;
  const a=dg?mt*FR[dg-1]:0,b=pr?mp*pr.v:0;
  return {v:Math.min(mx,arr(a+b+(st>=2?0.5:0))),d:`réussites ${fc(arr(a,0.25))}/${fc(mt)} · prépa ${fc(arr(b,0.25))}/${fc(mp)}${pr?' ('+pr.parts.map(x=>x[0]+' '+R(x[1]*100)+' %').join(', ')+')':''}${st>=2?' · ★ +0,5':''}`}}
/* AFL3 « coacher » : fiabilité mesurée par le contrôle du prof (poids 2), justesse du pronostic (poids 1),
   conseil jugé utile par le pratiquant (poids ½ : avis d'un camarade, souvent complaisant). ★ AFL3 : +0,5 à partir de 2. */
function sugAFL3(k,e,cy){const c=coachDe(k);const st=Object.values(P.stars[k]||{}).filter(x=>x.a3).length;if(!c||(!c.nf&&!c.tot&&c.err==null))return null;
  const sc=x=>x<=2?1:x<=5?0.75:x<=10?0.5:0.25;const W=[];if(c.nf)W.push([sc(c.fiab),2]);if(c.err!=null)W.push([sc(c.err/2),1]);if(c.tot)W.push([c.yes/c.tot,0.5]);
  const r=W.reduce((s,x)=>s+x[0]*x[1],0)/W.reduce((s,x)=>s+x[1],0);const dg=r>=0.85?4:r>=0.65?3:r>=0.4?2:1;const mx=AFLMAX(cy,e)[1];
  return {v:Math.min(mx,arr(mx*FR[dg-1]+(st>=2?0.5:0))),d:[c.nf?'contrôle ±'+fc(c.fiab)+' %':'pas de contrôle prof',c.err!=null?'pronostic ±'+c.err+' %':'',c.tot?'aide '+c.yes+'/'+c.tot:''].filter(Boolean).join(' · ')+(st>=2?' · ★ +0,5':'')}}
/* Note : justification des suggestions repliée par défaut (une ligne par élève) */
let NOTE_DET=(()=>{try{return localStorage.getItem('stp-note-det')==='1'}catch(e){return false}})();
document.addEventListener('click',ev=>{if(!ev.target.closest('[data-notedet]'))return;NOTE_DET=!NOTE_DET;try{localStorage.setItem('stp-note-det',NOTE_DET?'1':'0')}catch(e){}const y=scrollY;render();scrollTo(0,y)});
function vNote(){if(!P.classe)return pasDeClasse('Note');const cy='S';
  return `<section class="card"><h2>Note · ${esc(P.classe)}</h2>
  <div class="row wrap noprint"><button class="btn sm" type="button" data-notedet="1" aria-pressed="${NOTE_DET}">${NOTE_DET?'Masquer le détail des calculs':'Afficher le détail des calculs'}</button></div>
  <details class="small muted noprint"><summary>Comment sont calculées la note et les suggestions</summary><p><b>AFL1 /12</b> = produire /8 calculé depuis la séance d’évaluation S8 (zone /3 — en filière A, une mesure jusqu’à 5 pulsations sous la zone compte —, continuité /2, sécurité /2 et respect du plan /1 jugés par le coach) + <b>analyse /4</b> que tu notes en lisant l’analyse de l’élève. <b>Suggestions</b> (c’est toi qui décides : « ← » reprend la suggestion) — AFL2 : la moitié sur les réussites, le reste sur la préparation (échauffement, plan, régulation écrite). AFL3 : fiabilité du coach mesurée par tes contrôles (onglet Séance), justesse de ses pronostics, et un peu l’avis du pratiquant. ★ : +0,5 à partir de deux. AFL2 + AFL3 = 8 points répartis selon le choix de l’élève en S4 (6/2, 4/4 ou 2/6).</p></details>
  <div class="tw"><table class="tt pt"><tr><th>Élève</th><th>Blanche S7<br><small>/8</small></th><th>Produire S8<br><small>/8</small></th><th>Analyse<br><small>/4</small></th><th>AFL1 /12</th><th>Répart.</th><th>AFL2</th><th>AFL3</th><th>/20</th></tr>
  ${eleves().map(k=>{const e=P.eleves[k];if(!e)return `<tr class="no"><th class="l">${esc(nomAff(k))}</th><td colspan="8">rien reçu</td></tr>`;const run=runOf(e);const b7=afl1(run,e.seances.s7),e8=afl1(run,e.seances.s8);
    const mx=AFLMAX(cy,e);const s2=sugAFL2(e,cy),s3=sugAFL3(k,e,cy);const a2=num(e.afl2),a3=num(e.afl3),an=num(e.ana);const a1=e8&&an!=null?e8.prod+an:null;const tot=a1!=null&&a2!=null&&a3!=null?R((a1+a2+a3)*10)/10:null;
    const cel=(f,v,sg,m)=>`<td class="l"><input class="in w" data-af="${esc(k)}|${f}" inputmode="decimal" value="${esc(v||'')}" placeholder="/${m}">${sg?`<button class="lnk small" data-act="sug" data-k="${esc(k)}" data-v="${f}|${sg.v}" title="Reprendre la suggestion : ${esc(String(sg.d).replace(/<[^>]+>/g,''))}">← ${fc(sg.v)}</button>${NOTE_DET?`<br><small class="muted">${sg.d}</small>`:''}`:''}</td>`;
    const ana=e.seances.s8&&e.seances.s8.an;
    return `<tr><th class="l"><button class="lnk" data-act="fiche" data-k="${esc(k)}">${nm(e)}</button>${e.sexe&&e.age?'':'<br><small class="warn">sexe ou âge ?</small>'}</th><td>${fc(b7&&b7.prod)}</td><td><b>${fc(e8&&e8.prod)}</b>${NOTE_DET&&e8?`<br><small>zone ${fc(e8.zn)} (${e8.dz}/${e8.nm}) · cont. ${fc(e8.co)} · sécu ${fc(e8.sec)} · plan ${fc(e8.pl)}${e8.complet?'':' · incomplet'}</small>`:''}</td>
      <td class="l"><input class="in w" data-af="${esc(k)}|ana" inputmode="decimal" value="${esc(e.ana||'')}" placeholder="/4">${ana?` <button class="lnk small" data-act="det" data-k="${esc(k)}" data-v="s8" title="Lire l’analyse écrite en S8">lire</button>`:''}</td><td><b>${fc(a1)}</b></td><td>${mx.join('/')}</td>${cel('afl2',e.afl2,s2,mx[0])}${cel('afl3',e.afl3,s3,mx[1])}<td><b>${fc(tot)}</b></td></tr>`}).join('')}</table></div></section>`}
/* ----- Pilotage ----- */
function vPilotage(){if(!P.classe)return pasDeClasse('Pilotage');const L=SESS,K=eleves();const al=alertes(P.classe);
  const F={A:[],B:[],'?':[]};K.forEach(k=>{const e=P.eleves[k];const f=e?filOf(runOf(e)):null;F[f||'?'].push(k)});
  const recus=L.map(s=>K.filter(k=>P.eleves[k]&&P.eleves[k].seances[s.id]).length);
  const moy_=L.map(s=>{const v=K.map(k=>{const e=P.eleves[k];const d=e&&e.seances[s.id];if(!d||d.st)return null;const [t,n]=tenR(runOf(e),s.id);return n?t/n:null}).filter(x=>x!=null);return v.length?v.reduce((a,x)=>a+x,0)/v.length:null});
  const rpe=L.map(s=>{const v=K.map(k=>{const e=P.eleves[k];const d=e&&e.seances[s.id];return d&&!d.st?num((d.bl||{}).rpe):null}).filter(x=>x!=null);return v.length?R(v.reduce((a,x)=>a+x,0)/v.length*10)/10:null});
  const ecz=L.map(s=>{const v=K.map(k=>{const e=P.eleves[k];return e?ecartOf(s.id,e.seances[s.id],runOf(e)):null}).filter(x=>x!=null);return v.length?R(v.reduce((a,x)=>a+x,0)/v.length*10)/10:null});
  return `<section class="card"><h2>Pilotage · ${esc(P.classe)}</h2>
   <div class="tw"><table class="tt"><tr><th></th>${L.map(s=>`<th>${s.n}</th>`).join('')}</tr><tr><th class="l">Séances reçues</th>${recus.map(n=>`<td>${n}/${K.length}</td>`).join('')}</tr>
   <tr><th class="l">Réussites (moyenne)</th>${moy_.map(x=>`<td>${x==null?'–':R(x*100)+' %'}</td>`).join('')}</tr><tr><th class="l">Écart à la zone (moyenne, /min)</th>${ecz.map(x=>`<td>${fc(x)}</td>`).join('')}</tr><tr><th class="l">Effort ressenti (moyenne)</th>${rpe.map(x=>`<td>${fc(x)}</td>`).join('')}</tr></table></div>
   ${barTenus(L.map(s=>s.n),moy_)}</section>
  <section class="card"><h3>Filières</h3><p class="small muted">Choix faits en S4. Un binôme peut mélanger A et B : un seul chrono, A et B démarrent et finissent ensemble.</p>
   <div class="grid2">${Object.entries(F).filter(([f,L])=>L.length).map(([f,L])=>`<div class="sub"><h3>${f==='?'?'Pas encore choisie':esc(FIL[f].nom)} <span class="small muted">· ${L.length}</span></h3><p class="small">${L.map(k=>{const e=P.eleves[k];const z=e?zoneFor(runOf(e),f):null;return esc(nomAff(k))+(z?' <span class="muted">'+z[0]+'-'+z[1]+'</span>':'')}).join('<br>')}</p></div>`).join('')}</div></section>
  <section class="card"><h3>Points d’attention</h3>${al.length?`<ul class="alist">${al.map(a=>`<li><span>${ICA[a[0]]}</span>${a[1]}</li>`).join('')}</ul>`:'<p class="muted">Rien à signaler.</p>'}</section>`}
/* ----- Exporter ----- */
function csv(L){return '﻿'+L.map(l=>l.map(v=>{if(typeof v==='number')v=String(v).replace('.',',');v=v==null?'':String(v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(';')).join('\r\n')}
function vExport(){return `<section class="card"><h2>Exporter · ${esc(P.classe||'—')}</h2><p class="muted small">Fichiers .csv à ouvrir dans Excel ou LibreOffice (séparateur point-virgule).</p><div class="grid2">
  <div class="sub"><h3>Bilan et note</h3><p class="small muted">Une ligne par élève : filière, zone, réussites par séance, ★, défis, AFL1 (blanche et évaluation), AFL2, AFL3, total /20.</p><button class="btn pri" data-act="csv" data-v="bilan">Télécharger</button></div>
  <div class="sub"><h3>Séances</h3><p class="small muted">Une ligne par élève et par séance : statut, réussites, écart à la zone, effort, charge, coach, réussite, conseil.</p><button class="btn pri" data-act="csv" data-v="seances">Télécharger</button></div></div></section>`}
function exporter(type){if(!P.classe)return toast('Choisis une classe.');const cy='S',L=SESS;let rows;
  if(type==='bilan'){rows=[['Classe','Nom','Prénom','Sexe','Âge','FC repos','FC max','Filière','Zone bas','Zone haut','Réussites','Tentées','%','Degré AFL2',...L.map(s=>s.n+' réussites'),...L.map(s=>s.n+' ★AFL2'),...L.map(s=>s.n+' ★AFL3'),'Juste Pouls','Cible','Badges','Coordination','Blanche S7 produire /8','S8 zone /3','S8 continuité /2','S8 sécurité /2','S8 plan /1','S8 produire /8','Analyse /4','AFL1 /12','Répartition','AFL2','AFL3','Total /20','Retards','Oublis de tenue']];
    eleves().forEach(k=>{const e=P.eleves[k];if(!e)return;const run=runOf(e);const [TT,N]=totaux(e);const f=filOf(run);const z=zonesOf(run);const b7=afl1(run,e.seances.s7),e8=afl1(run,e.seances.s8);const a2=num(e.afl2),a3=num(e.afl3),an=num(e.ana);const a1=e8&&an!=null?e8.prod+an:null;const sc=scoreRun(run);
      rows.push([e.classe,e.nom,e.prenom,e.sexe||'',e.age||'',z?z.rep:'',z?z.max:'',f||'',f&&z?z[f][0]:'',f&&z?z[f][1]:'',TT,N,N?R(100*TT/N):'',degreeOf(TT,N)||'',...L.map(s=>{const x=tenR(run,s.id);return x[1]?x[0]+'/'+x[1]:(e.seances[s.id]&&e.seances[s.id].st)||''}),...L.map(s=>starOf(k,s.id).a2?1:''),...L.map(s=>starOf(k,s.id).a3?1:''),
        sc.jp,sc.ci,badgesOf(run,null).map(b=>BADGES.find(x=>x[0]===b)[1]).join(' '),coordOf(run).map(c=>COORD[c][0]).join(' '),b7?b7.prod:'',e8?e8.zn:'',e8?e8.co:'',e8&&e8.sec!=null?e8.sec:'',e8&&e8.pl!=null?e8.pl:'',e8?e8.prod:'',e.ana||'',a1!=null?a1:'',AFLMAX(cy,e).join('/'),e.afl2||'',e.afl3||'',a1!=null&&a2!=null&&a3!=null?R((a1+a2+a3)*10)/10:'',...tenueRetard(k).map(x=>x||'')])})}
  else{rows=[['Classe','Élève','Séance','Date','Reçu par','Statut','Réussites','Tentées','Écart à la zone (/min)','Effort (RPE)','Charge (UA)','Juste Pouls','Cible','Coach','Coach remplaçant','Pratique adaptée','Réussite','Conseil','Décision','Prochaine fois']];
    eleves().forEach(k=>{const e=P.eleves[k];if(!e)return;const run=runOf(e);L.forEach(s=>{const d=e.seances[s.id];if(!d)return;const r=e.recu[s.id]||{};const [t,n]=tenR(run,s.id);const bl=d.bl||{};const c=e.coach[s.id];const sc=scoreSeance(s.id,d,run);
      const sm=statut(k,s.id);rows.push([e.classe,e.full,s.n,r.date||'',r.src==='qr'?'QR':'fichier',sm.manuel?STATUTS[sm.c]:d.st?ST_TXT[d.st]:'présent',n?t:'',n||'',(x=>x==null?'':R(x))(ecartOf(s.id,d,run)),bl.rpe||'',chargeOf(d)||'',sc.jp||'',sc.ci||'',c?c.n:'',c&&c.rep?'oui':'',d.ad?'oui':'',bl.reu||'',bl.con||'',DEC_TXT[bl.dc]||'',bl.nx||''])})})}
  telecharger('Step_'+slug(P.classe)+'_'+type+'.csv',csv(rows))}

/* ---------- Évènements ---------- */
document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-act],[data-chf]');if(!b)return;const a=b.dataset.act,v=b.dataset.v,k=b.dataset.k;
  if(b.dataset.chf!==undefined){CH.fmt=b.dataset.chf;return rendre()}
  switch(a){
    case 'vue':P.vue=v;if(v!=='fiche')P.eleve=null;break;
    case 'seance':P.seance=v;break;
    case 'fiche':P.eleve=k;P.vue='fiche';window.scrollTo(0,0);break;
    case 'det':return detail(k,v);
    case 'closem':return closeModal();
    case 'reload':return location.reload();
    case 'star':{const [sid,w]=v.split('|');P.stars[k]=P.stars[k]||{};const s=P.stars[k][sid]=P.stars[k][sid]||{};s[w]=!s[w];sauver();const y=window.scrollY;rendre();window.scrollTo(0,y);return}
    case 'sug':{const [f,x]=v.split('|');P.eleves[k][f]=String(x).replace('.',',');sauver();const y=window.scrollY;rendre();window.scrollTo(0,y);return}
    case 'sexe':P.eleves[k].sexe=v;break;
    case 'age':P.eleves[k].age=+v;break;
    case 'scanner':{let n0=0;STQR.scanner(async t=>{const r=await lireTexteQR(t);if(!String(r).startsWith('…')){n0++;sauver();beep()}return String(r).startsWith('…')?r:'✓ '+r},
      {continu:true,titre:'QR codes des élèves',aide:'Montre les QR un par un devant la caméra.',onClose:()=>{if(n0)journal(n0+' QR code'+(n0>1?'s':'')+' scanné'+(n0>1?'s':''));classeParDefaut();sauver();rendre();if(n0)proposerSauvegarde()}});return}
    case 'secours':return telechargerSecours(v);
    case 'migrer':return migrerProf();
    case 'sauvegarde':return sauvegarder();
    case 'effacer':if(DEMO)return toast('Pas disponible en démo.');if(!confirm('Effacer toutes les données de l’outil sur cet appareil ? (Exporte d’abord une sauvegarde.)'))return;P=vide();break;
    case 'csv':return exporter(v);
    case 'imprimer':return window.print();
    case 'qrdem':return qrDemarrage(v);
    case 'reprise':return qrReprise(k);
    case 'clcoller':return importerListe([],$('#cl-txt').value,$('#cl-nom').value.trim());
    case 'clsuppr':if(!confirm('Retirer la liste de la classe '+v+' ? (Les séances reçues sont gardées.)'))return;delete P.classesL[v];classeParDefaut();break;
    case 'archiver':{if(DEMO)return toast('Pas disponible en démo.');if(!confirm('Télécharger la sauvegarde de l’année puis tout effacer ?'))return;sauvegarder('Step_prof_archive_');
      setTimeout(()=>{if(confirm('La sauvegarde est-elle bien enregistrée ? Effacer maintenant ?')){const cle=P.cle;P=vide();P.cle=cle;sauver();rendre()}},800);return}
    case 'fusionner':{const src=$('#fusion').value,dst=P.eleve;if(!src)return;if(!confirm('Fusionner « '+nomAff(src)+' » dans « '+nomAff(dst)+' » ?'))return;
      const S=P.eleves[src],D=P.eleves[dst];if(S&&D){Object.keys(S.seances).forEach(sid=>{if(!D.seances[sid]||((S.recu[sid]||{}).ts||0)>((D.recu[sid]||{}).ts||0)){D.seances[sid]=S.seances[sid];D.recu[sid]=S.recu[sid];if(S.groupe[sid])D.groupe[sid]=S.groupe[sid];if(S.coach[sid])D.coach[sid]=S.coach[sid]}});
        if(!D.sexe)D.sexe=S.sexe;if(!D.age)D.age=S.age;if(!D.fcrM)D.fcrM=S.fcrM}
      if(P.ctrl&&P.ctrl[src]){P.ctrl[dst]=Object.assign({},P.ctrl[src],P.ctrl[dst]||{});delete P.ctrl[src]}
      if(P.stars[src]){P.stars[dst]=Object.assign({},P.stars[src],P.stars[dst]||{});delete P.stars[src]}
      /* le nom fusionné devient un alias : les prochains envois sous ce nom iront dans la bonne fiche */
      P.alias[src]=dst;delete P.eleves[src];break}
    case 'chgo':beep(700,60);return chStart();
    case 'chpause':chPause();return rendre();
    case 'chstop':chStop();return rendre();
    case 'demoQuitter':location.href=location.pathname;return;
    case 'demo':window.scrollTo(0,0);return ouvrirDemoProf();
    default:return;
  }
  sauver();rendre();
});
document.addEventListener('change',async ev=>{const t=ev.target;
  if(t.id==='selClasse'){P.classe=t.value;P.eleve=null;P.seance='';if(P.vue==='fiche')P.vue='eleves';sauver();return rendre()}
  if(t.id==='fic'&&t.files.length){await importerFichiers([...t.files]);t.value='';return}
  if(t.id==='cl-fic'&&t.files.length){try{await importerListe([...t.files],'',$('#cl-nom').value.trim())}catch(x){alert('Fichier illisible : '+(x.message||x))}t.value='';return}
  if(t.classList.contains('cl-lien')){const u=t.value.trim();if(u&&!/^https:\/\//.test(u)){alert('Le lien doit commencer par https://');return}P.classesL[t.dataset.cl].lien=u;sauver();return toast('Lien enregistré : refais afficher le QR de démarrage.')}
  if(t.dataset.appel!=null){const id=nk(P.classe)+'|'+P.seance+'|'+t.dataset.appel;if(t.value)P.appel[id]=t.value;else delete P.appel[id];sauver();return rendre()}
  if(t.dataset.ctrl){const [k,sid]=t.dataset.ctrl.split('|');P.ctrl=P.ctrl||{};P.ctrl[k]=P.ctrl[k]||{};if(t.value.trim())P.ctrl[k][sid]=t.value.trim();else delete P.ctrl[k][sid];sauver();const y=window.scrollY;rendre();window.scrollTo(0,y);return}
  if(t.dataset.af){const [k,f]=t.dataset.af.split('|');P.eleves[k][f]=t.value.trim();sauver();const y=window.scrollY;rendre();window.scrollTo(0,y);return}
  if(t.id==='chvoice'){CH.voice=t.checked;return}
  if(t.id==='resto'&&t.files[0]){try{const o=JSON.parse(await t.files[0].text());if(!o.stProf)throw 0;if(!confirm('Remplacer les données de cet appareil par cette sauvegarde ?'))return;delete o.stProf;P=Object.assign(vide(),o);sauver();rendre()}catch(x){alert('Ce fichier n’est pas une sauvegarde de l’outil prof.')}}
});
['dragover','drop'].forEach(n=>document.addEventListener(n,e=>{e.preventDefault();if(n==='drop'&&e.dataTransfer.files.length){const F=[...e.dataTransfer.files];if(P.vue==='classes')importerListe(F,'',($('#cl-nom')||{}).value||'');else{P.vue='import';importerFichiers(F)}}}));
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
if('serviceWorker' in navigator&&location.protocol==='https:'){let had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had){const u=$('#upd');u.innerHTML='Nouvelle version de l’outil installée. <button class="btn sm" data-act="reload">Recharger</button>';u.classList.add('on')}had=true});
  navigator.serviceWorker.register('../sw.js').then(r=>r.update().catch(()=>{})).catch(()=>{})}

/* chrono qui reprend après rechargement : on rouvre son écran */
function chOuvrir(){P.vue='chrono'}
