/* =====================================================================
   app.js — Step · appli élève (Lycée G. Pompidou) · carnet de binôme du cycle CA5 de Seconde
   Une tablette pour plusieurs groupes (binômes ou trinômes) et plusieurs classes.
   Chaque groupe a son carnet, CHIFFRÉ avec son code secret à 4 chiffres : un autre groupe
   ne peut ni l'ouvrir ni le lire. Les données restent sur la tablette ; elles partent
   seulement quand le groupe les envoie au professeur (QR code ou fichier déposé sur le Nuage).
   ===================================================================== */
'use strict';
const APP_VERSION='v4 · 29/10/2026';
const CLE='spe-v1';
/* Envoi en ligne : le lien de dépôt (Nuage, « Demande de fichier ») arrive avec le QR de la classe.
   Il n'apparaît jamais à l'écran. Vide = envoi en ligne pas encore activé (le QR code reste possible). */
const DEPOT_DEFAUT='';
const lienEnvoi=()=>(G&&G.cfg&&G.cfg.lien)||DEPOT_DEFAUT;
const QR_MAX=1400;                                   /* au-delà : QR en plusieurs morceaux qui défilent */

const $=s=>document.querySelector(s);
const uid=()=>Math.random().toString(36).slice(2,9);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const jour=ts=>{if(!ts)return today();const d=new Date(ts);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const heure=t=>new Date(t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),3000)}
function modal(html){$('#modal-body').innerHTML=icons(html);$('#modal').classList.add('on')}
function closeModal(){$('#modal').classList.remove('on');liveStop();if(RQ.h){clearInterval(RQ.h);RQ.h=null}QRS=null;CODE_CB=null}
function keepScroll(fn){const y=window.scrollY;fn();window.scrollTo(0,y)}
function fixP(d){}
let LIVE=null;function liveStop(){}
let AC=null;
function beep(f,ms){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f||880;g.gain.value=.25;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+(ms||150)/1000)}catch(e){}}

/* ---------- État ----------
   ROOT = {v:1, groupes:{id:{classe,cy,noms,sel,wk,pk,iv,data,vu,nonEnv}}, classes:{classe:{classe,cy,eleves,lien,k}}, opts:{dark,one}}
   G = carnet du groupe ouvert (en mémoire seulement) : {id,classe,cy,runners:[{id,full,prenom,nom,sexe,age,fcrM,seances,imp}],sent,mod,dates,envoi,cfg}
   DB = vue « carnet » de G pour les écrans de séance (repris du carnet v12). */
function charger(){let o=null;try{o=JSON.parse(localStorage.getItem(CLE))}catch(e){}
  const R={v:1,groupes:{},classes:{},opts:{}};if(o&&o.v===1&&o.groupes)return Object.assign(R,o);return R}
let ROOT=charger(),G=null,ACTIF=null,CLEF=null,DEMO=false;
const DB={binomes:[],opts:ROOT.opts};
let V={tab:'seance'};
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
document.documentElement.dataset.theme=ROOT.opts.dark?'dark':'light';
function ecrireRoot(){if(DEMO)return;try{localStorage.setItem(CLE,JSON.stringify(ROOT))}catch(e){toast('Mémoire pleine : envoyez vos séances puis supprimez les anciens groupes.')}}
const b64=u=>{let x='';new Uint8Array(u).forEach(c=>x+=String.fromCharCode(c));return btoa(x)};
const deb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function deriver(code,sel){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode('spe|'+code),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:sel,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
/* Chiffrement (v2) : le carnet est chiffré avec une clé de carnet tirée au hasard (CLEF).
   Cette clé est rangée deux fois : enveloppée par le code du groupe (wk) et, si la classe a été reçue
   par QR, pour la clé publique du professeur (pk) : en cas de code oublié, seul l'outil du prof peut la rendre. */
const nouvelleCle=()=>crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
const importerCle=raw=>crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},true,['encrypt','decrypt']);
async function envelopper(dk,kek){const iv=crypto.getRandomValues(new Uint8Array(12));return {iv:b64(iv),d:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},kek,await crypto.subtle.exportKey('raw',dk)))}}
async function deballer(w,kek){return importerCle(await crypto.subtle.decrypt({name:'AES-GCM',iv:deb64(w.iv)},kek,deb64(w.d)))}
async function pourProf(dk,k){
  const pub=await crypto.subtle.importKey('raw',deb64(k.replace(/-/g,'+').replace(/_/g,'/')),{name:'ECDH',namedCurve:'P-256'},false,[]);
  const eph=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey']);
  const cle=await crypto.subtle.deriveKey({name:'ECDH',public:pub},eph.privateKey,{name:'AES-GCM',length:256},false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  return {epk:b64(await crypto.subtle.exportKey('raw',eph.publicKey)),iv:b64(iv),data:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},cle,await crypto.subtle.exportKey('raw',dk)))}}
async function lireCarnet(g,dk){return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:deb64(g.iv)},dk,deb64(g.data))))}
async function poserCode(g,code,dk){const sel=crypto.getRandomValues(new Uint8Array(16));g.sel=b64(sel);g.wk=await envelopper(dk,await deriver(code,sel))}
let tSauve=null;
function save(){if(DEMO)return;clearTimeout(tSauve);tSauve=setTimeout(enregistrer,250)}
async function enregistrer(){
  clearTimeout(tSauve);if(DEMO)return;
  if(!G||!ACTIF||!CLEF){ecrireRoot();return}
  const g=ROOT.groupes[ACTIF]||(ROOT.groupes[ACTIF]={});
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},CLEF,new TextEncoder().encode(JSON.stringify(G)));
  Object.assign(g,{classe:G.classe,cy:G.cy,noms:G.runners.map(r=>r.prenom),iv:b64(iv),data:b64(ct),vu:Date.now(),nonEnv:nonEnvoyees().map(s=>s.n)});delete g.clair;
  const k=G.cfg&&G.cfg.k;if(k&&g.pkk!==k){try{g.pk=await pourProf(CLEF,k);g.pkk=k}catch(e){}}
  ecrireRoot();
}
function vide(classe,cy){return {id:uid(),classe:classe||'',cy:cy||'S',runners:[],sent:{},mod:{},dates:{},envoi:{},jours:{},cfg:null}}
function attacher(g){
  G=g;G.sent=G.sent||{};G.mod=G.mod||{};G.dates=G.dates||{};G.envoi=G.envoi||{};G.jours=G.jours||{};G.runners=G.runners||[];
  if(G.classe&&ROOT.classes[G.classe])G.cfg=JSON.parse(JSON.stringify(ROOT.classes[G.classe]));   /* liste de classe la plus récente */
  DB.binomes=[G];V={tab:G.runners.length?'seance':'groupe',bin:G.id,ri:0,cur:0};seanceDuJour();
}
async function ouvrir(id,code){
  const g=ROOT.groupes[id];
  if(g.clair){const dk=await nouvelleCle();await poserCode(g,code,dk);CLEF=dk;attacher(Object.assign(vide(),g.clair))}
  else if(g.wk){let dk;try{dk=await deballer(g.wk,await deriver(code,deb64(g.sel)))}catch(e){throw new Error('Code faux.')}CLEF=dk;attacher(await lireCarnet(g,dk))}
  else{/* carnet v1 : chiffré directement avec le code ; il passe en v2 à l'ouverture */
    const k=await deriver(code,deb64(g.sel));let o;try{o=await lireCarnet(g,k)}catch(e){throw new Error('Code faux.')}
    const dk=await nouvelleCle();await poserCode(g,code,dk);CLEF=dk;attacher(o)}
  ACTIF=id;await enregistrer();
}
async function nouveauGroupe(classe,cy,code){
  const id=uid();ROOT.groupes[id]={classe:classe||'',cy,noms:[]};const dk=await nouvelleCle();await poserCode(ROOT.groupes[id],code,dk);
  CLEF=dk;ACTIF=id;const g=vide(classe,cy);g.id=id;attacher(g);V.tab='groupe';await enregistrer();
}
/* code oublié : la tablette montre la clé enveloppée pour le prof ; l'outil prof répond par un QR qui la rend */
async function demandeDeblocage(id){const g=ROOT.groupes[id];
  if(!g.pk)return modal(`<h2>Code oublié</h2><p>Ce carnet n’a pas encore reçu la clé du professeur (pas de QR de classe scanné) : il ne peut pas être rouvert sans le code.</p><p class="small">Supprimez-le et créez un nouveau groupe. Le professeur vous donnera un <b>QR de reprise</b> par élève (toutes les séances qu’il a reçues) : Groupe → « Scanner le QR de l’élève ».</p>
      <div class="row wrap" style="justify-content:space-between"><button class="btn" data-act="closem">Annuler</button><button class="btn danger" data-act="suppridoublie" data-v="${id}">Supprimer ce carnet</button></div>`);
  const txt=await STQR.encoder({a:'SPE',v:1,t:'K',c:g.classe,n:g.noms||[],i:id,p:g.pk});
  modal(`<h2>Code oublié · ${(g.noms||[]).map(esc).join(' · ')}</h2><p class="muted small">1. Montre ce QR au professeur (outil prof → Recevoir → Scanner). 2. Il affiche un QR de déverrouillage : scanne-le, puis choisissez un nouveau code.</p>
    <div class="qr" id="rqr"></div><div class="row wrap" style="justify-content:space-between"><button class="btn" data-act="closem">Annuler</button><button class="btn pri" data-act="deblscan" data-v="${id}">Scanner la réponse du prof</button></div>`);
  qrAnime([txt]);
}
function recevoirDeblocage(id,o){
  if(o.t!=='U'||o.i!==id)throw new Error('Ce n’est pas le QR de déverrouillage de ce carnet.');
  setTimeout(async()=>{try{const g=ROOT.groupes[id];const dk=await importerCle(deb64(o.k));const c=await lireCarnet(g,dk);
    demanderCode('Nouveau code · '+(g.noms||[]).join(' · '),'Carnet déverrouillé. Choisissez un nouveau code secret de 4 chiffres.',async code=>{await poserCode(g,code,dk);CLEF=dk;ACTIF=id;attacher(c);await enregistrer()},true)}
    catch(e){toast('Déverrouillage impossible : '+(e.message||e))}},500);
  return 'Carnet déverrouillé.';
}
async function verrouiller(){await enregistrer();G=null;ACTIF=null;CLEF=null;DB.binomes=[];V={tab:'seance'};if(DEMO){DEMO=false;quitterDemoUrl()}}
/* La séance s'ouvre toute seule : celle déjà remplie aujourd'hui, sinon la suivante de la dernière remplie un autre jour. */
function seanceDuJour(){
  const L=sessOf(G.cy),t=today();
  if(G.jours[t]&&SBY[G.jours[t]]){V.sid=G.jours[t];return}
  let der=-1;L.forEach((s,i)=>{if(G.runners.some(r=>hasData(r.seances&&r.seances[s.id])&&!(r.imp&&r.imp[s.id])))der=i});
  const i=der<0?0:Math.min(L.length-1,der+(G.dates[L[der].id]===t?0:1));V.sid=L[i].id;
  if(!DEMO&&der>=0&&G.dates[L[der].id]!==t&&i!==der)setTimeout(()=>toast(L[i].n+' aujourd’hui (touche un autre numéro si besoin).'),500);
  G.jours[t]=V.sid;
}
/* Verrouillage automatique : 20 min sans toucher l'écran (un effort de filière + ses récupérations ne suffisent pas à le déclencher),
   ou tablette en veille / appli quittée plus de 2 min. */
let tInactif=null,tCache=0;
async function verrouAuto(msg){if(!G||DEMO||(LIVE&&LIVE.t0))return;await verrouiller();closeModal();render();toast(msg)}
function reveil(){clearTimeout(tInactif);if(G&&!DEMO)tInactif=setTimeout(()=>verrouAuto('Carnet verrouillé (20 min sans activité).'),20*60*1000)}
['click','input','touchstart'].forEach(e=>document.addEventListener(e,reveil,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){tCache=Date.now();if(G)enregistrer()}else if(tCache&&Date.now()-tCache>2*60*1000){tCache=0;verrouAuto('Carnet verrouillé (tablette mise en veille).')}});

/* ---------- Code secret ---------- */
let CODE_CB=null;
function demanderCode(titre,texte,cb,creer,id){
  CODE_CB={cb,creer,premier:null,id};
  modal(`<h2>${esc(titre)}</h2><p class="muted small">${esc(texte)}</p>
    <input id="code" class="in code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Code à 4 chiffres">
    <p id="code-msg" class="small warn" style="min-height:1.4em"></p>
    <div class="row wrap" style="justify-content:space-between"><button class="btn" data-act="closem">Annuler</button><button class="btn pri" data-act="codeok">Valider</button></div>
    ${creer?'':'<p class="small"><button class="lnk" data-act="codeoubli">Code oublié ?</button></p>'}`);
  setTimeout(()=>{const i=$('#code');if(i)i.focus()},60);
}
async function validerCode(){
  const i=$('#code'),m=$('#code-msg'),c=(i.value||'').trim();
  if(!/^\d{4}$/.test(c)){m.textContent='4 chiffres.';return}
  const st=CODE_CB;
  if(st.creer&&!st.premier){st.premier=c;i.value='';m.textContent='Retape le même code pour confirmer.';i.focus();return}
  if(st.creer&&st.premier!==c){st.premier=null;i.value='';m.textContent='Les deux codes sont différents : recommence.';return}
  m.textContent='Ouverture…';
  try{await st.cb(c);CODE_CB=null;closeModal();render();window.scrollTo(0,0)}catch(e){i.value='';m.textContent=e.message||'Erreur';i.focus()}
}

/* ---------- Séances à envoyer ---------- */
function nonEnvoyees(){if(!G)return [];return curSessOf(G).filter(s=>['wip','resend'].includes(sessState(G,s.id)))}
function exportEleve(run,ri,sid){
  const d=run.seances&&run.seances[sid];if(!hasData(d)||(run.imp&&run.imp[sid]))return null;
  const co=d.st?{}:coachOf(G,ri,sid);
  return {app:'step-eleves',version:1,activite:'Step',cycle:G.cy,classe:G.classe,eleve:run.full,sexe:run.sexe||'',seance:sid,
    date:G.dates[sid]||jour(G.mod[sid]),exportedAt:new Date().toISOString(),groupe:G.runners.map(r=>r.full),
    coach:co.n?(co.full||co.n):'',coachRemplacant:!!co.rep,age:run.age||'',fcrM:run.fcrM||'',resume:resumeSeance(run,sid),donnees:slimSeance(d)};
}
function fichiers(sids){const L=[];sids.forEach(sid=>G.runners.forEach((r,ri)=>{const o=exportEleve(r,ri,sid);if(o)L.push({nom:nomFichier(G.classe,r.full,sid),o})}));return L}
const qrDe=o=>({a:'SPE',v:1,t:'S',y:o.cycle,c:o.classe,e:o.eleve,x:o.sexe,s:o.seance,d:o.date,ts:Math.round(Date.now()/1000),g:o.age||undefined,fr:o.fcrM||undefined,gr:o.groupe,co:o.coach||undefined,cr:o.coachRemplacant?1:undefined,D:o.donnees});
function marquerEnvoye(sids,mode){const t=Date.now();sids.forEach(sid=>{G.sent[sid]=t;G.envoi[sid]=Object.assign(G.envoi[sid]||{},{[mode]:t})});save()}
/* QR en plusieurs morceaux (texte trop long pour un seul QR) */
function morceaux(txt){if(txt.length<=QR_MAX)return [txt];const tag=Math.random().toString(36).slice(2,6),n=Math.ceil(txt.length/QR_MAX),out=[];
  for(let i=0;i<n;i++)out.push('SPEP|'+tag+'|'+(i+1)+'/'+n+'|'+txt.slice(i*QR_MAX,(i+1)*QR_MAX));return out}
let RQ={h:null},QRS=null;
function svgQR(t){try{return STQR.svgQR(t)}catch(e){return '<p class="warn">Trop de données pour un QR : utilise l’envoi en ligne.</p>'}}
function qrAnime(parts){if(RQ.h)clearInterval(RQ.h);RQ.h=null;let i=0;const z=$('#rqr');if(!z)return;z.innerHTML=svgQR(parts[0]);const n=$('#rqn');if(n)n.textContent=parts.length>1?'1 / '+parts.length+' · laisse le prof viser jusqu’au bip':'';
  if(parts.length>1)RQ.h=setInterval(()=>{i=(i+1)%parts.length;const q=$('#rqr'),m=$('#rqn');if(!q){clearInterval(RQ.h);RQ.h=null;return}q.innerHTML=svgQR(parts[i]);if(m)m.textContent=(i+1)+' / '+parts.length+' · laisse le prof viser jusqu’au bip'},1100)}
async function montrerQR(sids,k){
  /* un QR par binôme et par séance (les séances des deux élèves) ; si c'est trop long, un QR par élève */
  if(!QRS){QRS={sids,L:[]};for(const sid of sids){const F=fichiers([sid]);if(!F.length)continue;const o=F[0].o;
      const txt=await STQR.encoder({a:'SPE',v:1,t:'G',y:o.cycle,c:o.classe,s:sid,d:o.date,ts:Math.round(Date.now()/1000),gr:o.groupe,
        R:F.map(f=>({e:f.o.eleve,x:f.o.sexe,g:f.o.age||undefined,fr:f.o.fcrM||undefined,co:f.o.coach||undefined,cr:f.o.coachRemplacant?1:undefined,D:f.o.donnees}))});
      if(txt.length<=1800||F.length===1)QRS.L.push({titre:F.map(f=>prenomDe(f.o.eleve)).join(' & ')+' · '+SBY[sid].n,parts:txt.length<=1800?[txt]:morceaux(txt)});
      else for(const f of F)QRS.L.push({titre:prenomDe(f.o.eleve)+' · '+SBY[sid].n,parts:morceaux(await STQR.encoder(qrDe(f.o)))})}}
  if(!QRS.L.length){closeModal();return toast('Rien à envoyer pour cette séance.')}
  k=Math.max(0,Math.min(k||0,QRS.L.length-1));const Q=QRS.L[k];
  modal(`<h2>${esc(Q.titre)} · à montrer au prof</h2><p class="muted small">QR ${k+1} sur ${QRS.L.length} · ${esc(G.classe)}</p>
   <div class="qr" id="rqr"></div><p class="center small" id="rqn"></p>
   <div class="row wrap" style="justify-content:space-between"><button class="btn" data-act="qrnav" data-v="${k-1}" ${k?'':'disabled'}>← Précédent</button>
   ${k<QRS.L.length-1?`<button class="btn pri" data-act="qrnav" data-v="${k+1}">Suivant →</button>`:`<button class="btn pri" data-act="qrfin">Terminé</button>`}</div>`);
  qrAnime(Q.parts);
}
function telecharger(nom,texte,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([texte],{type:type||'application/json'}));a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
/* Copie de secours chiffrée : seul le professeur (sa clé, reçue avec le QR de classe) peut l'ouvrir. */
async function fichierSecours(){
  try{const k=G.cfg&&G.cfg.k;if(!k||!crypto.subtle)return [];
    const pub=await crypto.subtle.importKey('raw',deb64(k.replace(/-/g,'+').replace(/_/g,'/')),{name:'ECDH',namedCurve:'P-256'},false,[]);
    const eph=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey']);
    const cle=await crypto.subtle.deriveKey({name:'ECDH',public:pub},eph.privateKey,{name:'AES-GCM',length:256},false,['encrypt']);
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},cle,new TextEncoder().encode(JSON.stringify(Object.assign({carnetST:1},G))));
    const epk=await crypto.subtle.exportKey('raw',eph.publicKey);const noms=G.runners.map(r=>r.full);
    const o={app:'st-secours',v:1,classe:G.classe,cycle:G.cy,noms,seance:V.sid,date:today(),epk:b64(epk),iv:b64(iv),data:b64(ct)};
    const nom=('secours_'+G.classe+'_'+G.runners.map(r=>r.prenom).join('-')+'_'+String(V.sid).toUpperCase()).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9_-]+/g,'_')+'.json';
    return [new File([JSON.stringify(o)],nom,{type:'application/json'})];
  }catch(e){return []}
}
async function enregistrerFichiers(sids){
  const F=fichiers(sids);if(!F.length)return false;
  const files=F.map(f=>new File([JSON.stringify(f.o,null,1)],f.nom,{type:'application/json'})).concat(await fichierSecours());
  let ok=false;
  try{if(navigator.canShare&&navigator.canShare({files})){await navigator.share({files,title:'Step · '+sids.map(s=>SBY[s].n).join(', ')});ok=true}}catch(e){if(e&&e.name==='AbortError')return false}
  if(!ok)for(const f of files){telecharger(f.name,await f.text());await new Promise(r=>setTimeout(r,400))}
  marquerEnvoye(sids,'fichier');render();return true;
}

/* ---------- Changement de groupe / reprise : QR de l'élève (toutes ses séances) ---------- */
function historiqueEleve(r){const se={};Object.entries(r.seances||{}).forEach(([sid,d])=>{if(hasData(d))se[sid]=slimSeance(d)});
  return {a:'SPE',v:1,t:'T',c:G.classe,y:G.cy,e:r.full,x:r.sexe||'',g:r.age||'',fr:r.fcrM||'',se}}
async function montrerTransfert(i){const r=G.runners[i];const parts=morceaux(await STQR.encoder(historiqueEleve(r)));
  modal(`<h2>${esc(r.prenom)} change de groupe</h2><p class="muted small">Sur la tablette du nouveau groupe : Groupe → « Un élève arrive ». Toutes ses séances le suivent.${parts.length>1?' Le QR défile ('+parts.length+' morceaux) : laisse la tablette viser jusqu’au bout.':''}</p>
   <div class="qr" id="rqr"></div><p class="center small" id="rqn"></p>
   <div class="row wrap" style="justify-content:space-between"><button class="btn" data-act="closem">Fermer</button><button class="btn danger" data-act="tretirer" data-v="${i}">C’est fait : retirer ${esc(r.prenom)} d’ici</button></div>`);
  qrAnime(parts)}
/* lecture caméra, avec les QR en plusieurs morceaux */
function scannerQR(onObj,titre,aide){let P={tag:null,n:0,parts:{}},fin=null;
  fin=STQR.scanner(async t=>{t=String(t).trim();
    if(t.startsWith('SPEP|')){const m=/^SPEP\|(\w+)\|(\d+)\/(\d+)\|(.*)$/s.exec(t);if(!m)throw new Error('Morceau illisible.');if(P.tag!==m[1])P={tag:m[1],n:+m[3],parts:{}};P.parts[+m[2]]=m[4];
      const got=Object.keys(P.parts).length;if(got<P.n)return got+' / '+P.n+' morceaux…';let s='';for(let i=1;i<=P.n;i++)s+=P.parts[i];t=s}
    const msg=onObj(await STQR.decoder(t));beep();setTimeout(()=>{fin&&fin()},700);return msg},{continu:true,titre,aide});
}
function recevoirClasse(o){
  if(o.t!=='C')throw new Error('Ce n’est pas le QR de la classe.');
  const cfg={classe:o.c,cy:'S',eleves:o.l||[],sexes:o.x||[],ages:o.g||[],lien:o.u||'',k:o.k||''};
  ROOT.classes[o.c]=cfg;ecrireRoot();       /* les autres groupes de la classe recevront la nouvelle liste à leur ouverture */
  if(!G||(G.runners.length&&G.classe&&G.classe!==o.c)){setTimeout(async()=>{if(G){await verrouiller();render()}codeNouveau(o.c,cfg.cy)},400);return 'Classe '+o.c+' enregistrée.'}
  G.cfg=JSON.parse(JSON.stringify(cfg));G.classe=o.c;if(!G.runners.length)G.cy=cfg.cy;save();render();
  return 'Classe '+o.c+' : '+cfg.eleves.length+' élèves.';
}
function codeNouveau(classe,cy){demanderCode('Nouveau groupe · '+classe,'Choisissez un code secret de 4 chiffres. Retenez-le : il sera demandé à chaque cours, et personne d’autre ne pourra ouvrir votre carnet.',c=>nouveauGroupe(classe,cy,c),true)}
function accueillir(o){
  if(o.t!=='T')throw new Error('Ce n’est pas un QR d’élève (changement de groupe ou reprise).');
  let r=G.runners.find(x=>norm(x.full)===norm(o.e));let n=0;
  if(!r){if(G.runners.length>=3)throw new Error('Le groupe est déjà complet (3 élèves).');
    r={id:uid(),full:o.e,prenom:prenomDe(o.e),nom:nomDe(o.e),sexe:o.x||'',age:o.g||'',fcrM:o.fr||'',seances:{},imp:{}};G.runners.push(r)}
  r.imp=r.imp||{};Object.entries(o.se||{}).forEach(([sid,d])=>{if(!hasData(r.seances[sid])){r.seances[sid]=d;r.imp[sid]=1;n++}});
  if(!r.age&&o.g)r.age=o.g;if(!r.fcrM&&o.fr)r.fcrM=o.fr;if(!G.classe&&o.c)G.classe=o.c;
  V.ri=G.runners.indexOf(r);save();render();
  return r.prenom+' : '+n+' séance'+(n>1?'s':'')+' récupérée'+(n>1?'s':'')+'.';
}

/* ---------- Ancien carnet numérique (même site, même tablette) : reprise des binômes ---------- */
function ancienDB(){try{const o=JSON.parse(localStorage.getItem('step2_carnet_v1'));return o&&Array.isArray(o.binomes)?o:null}catch(e){return null}}
function ancien(){if(DEMO||ROOT.migre)return 0;const o=ancienDB();return o?o.binomes.filter(b=>b.runners&&b.runners.length).length:0}
function migrer(){const o=ancienDB();if(!o)return;let n=0;
  o.binomes.forEach(b=>{if(!b.runners||!b.runners.length)return;const id=uid();
    const g=Object.assign(vide(b.classe,'S'),{id,sent:b.sent||{},mod:b.mod||{},runners:b.runners.map(r=>{const full=((r.prenom||'')+' '+String(r.nom||'').toUpperCase()).trim();
      return {id:uid(),full,prenom:r.prenom||prenomDe(full),nom:String(r.nom||'').toUpperCase(),sexe:r.sexe||'',age:r.age||'',fcrM:r.fcrM||'',seances:r.seances||{}}})});
    ROOT.groupes[id]={classe:g.classe,cy:g.cy,noms:g.runners.map(r=>r.prenom),clair:g};n++});
  ROOT.migre=Date.now();ecrireRoot();render();toast(n+' binôme'+(n>1?'s':'')+' repris : touchez le vôtre et choisissez un code.')}

/* ---------- Pictos des onglets ---------- */
const TI={seance:SV('<rect x="3" y="15" width="18" height="4" rx="1.5"/><path d="M6 19v2M18 19v2"/><circle cx="13" cy="5" r="2"/><path d="M12 8l-2 4 3 3M10 12l-3 1"/>'),
 moi:SV('<path d="M4 19V5M4 19h16"/><path d="M7 15l4-4 3 3 5-6"/>'),chrono:SV('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5M19 6l1.5-1.5"/>'),
 envoi:SV('<path d="M4 12l16-8-6 16-3-7-7-1z"/>'),groupe:SV('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.1-6 6.5-6s5.9 2.4 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14c2.7.2 4.4 2.3 5 5"/>')};

/* ---------- Affichage ---------- */
function render(){
  const b=G;document.body.dataset.cy=b?cyOf(b):'';document.body.classList.toggle('home',!b);
  document.querySelectorAll('header [data-need]').forEach(x=>x.hidden=!b);
  if(!b){$('#sous').textContent='Choisis ton groupe';$('#seances').hidden=true;$('#btnSeance').hidden=true;$('#onglets').hidden=true;$('#main').innerHTML=icons(vChoix());return}
  if(!b.runners.length)V.tab='groupe';const L=curSessOf(b);if(!V.sid||!L.some(s=>s.id===V.sid))V.sid=L[0].id;
  V.v=V.tab==='seance'?'sess':V.tab;
  $('#sous').textContent=(b.classe?b.classe+' · ':'')+(b.runners.length?b.runners.map(r=>r.prenom).join(', '):'groupe à compléter');
  /* séance du jour : un seul bouton « S4 ▾ » dans la barre (la séance s'ouvre toute seule ; changer reste à un toucher) */
  const st0=sessState(b,V.sid),ne0=nonEnvoyees();
  $('#seances').hidden=true;const bs=$('#btnSeance');bs.hidden=!b.runners.length;
  bs.innerHTML=`${SBY[V.sid].n} <span aria-hidden="true">▾</span>${ne0.length?'<i class="pt" aria-label="séance à envoyer"></i>':''}`;bs.className='bseance '+(st0||'');
  const ne=nonEnvoyees();
  const O=[['seance','Séance'],['moi','Moi'],['chrono','Chrono'],['envoi','Envoyer'],['groupe','Groupe']];
  if(V.tab!=='chrono'&&CH.run)chStop();
  $('#onglets').innerHTML=O.map(o=>`<button data-tab="${o[0]}" class="${V.tab===o[0]?'ici':''}${o[0]==='envoi'&&ne.length?' alerte':''}">${TI[o[0]]}<b>${o[1]}</b></button>`).join('');
  $('#onglets').hidden=!b.runners.length;
  const views={seance:sessView,moi:()=>{V.v='prog';return zonesView()+progView()+conseilsView()},chrono:chronoView,envoi:vEnvoi,groupe:vGroupe};
  const rappel=ne.length&&!['envoi','groupe','seance'].includes(V.tab)&&!(ne.length===1&&ne[0].id===V.sid&&V.tab==='seance')?`<button class="nonenvoye" data-tab="envoi">⚠ ${ne.map(s=>s.n).join(', ')} pas encore envoyée${ne.length>1?'s':''} au professeur — touche ici pour envoyer</button>`:'';
  $('#main').innerHTML=icons((DEMO?bandeauDemo():'')+rappel+(views[V.tab]||sessView)());
  document.documentElement.style.setProperty('--hh',$('header').offsetHeight+'px');
}
function vChoix(){
  const Gs=Object.entries(ROOT.groupes).sort((a,b)=>(a[1].classe||'').localeCompare(b[1].classe||'','fr')||(b[1].vu||0)-(a[1].vu||0));
  const parC={};Gs.forEach(([id,g])=>(parC[g.classe||'Sans classe']=parC[g.classe||'Sans classe']||[]).push([id,g]));
  const C=Object.keys(ROOT.classes).sort();
  return `<section class="intro"><h1>Qui utilise la tablette ?</h1><p>Chaque groupe ouvre son carnet avec son code secret.</p></section>
  ${Gs.length?Object.entries(parC).map(([c,L])=>`<section class="card"><h3>${esc(c)}</h3><div class="grid">${L.map(([id,g])=>{const ne=g.nonEnv&&g.nonEnv.length;
    return ` <button class="bincard ${ne?'nonenv':''}" data-act="choisir" data-v="${id}"><b>${g.noms&&g.noms.length?g.noms.map(esc).join(' · '):'Groupe à compléter'}</b><span class="muted small">${g.clair?'à protéger par un code':'🔒 code secret du groupe'}</span>${ne?`<span class="warn small">⚠ ${g.nonEnv.join(', ')} non envoyée${g.nonEnv.length>1?'s':''}</span>`:''}</button>`}).join('')}</div></section>`).join(''):'<p class="muted center">Aucun groupe sur cette tablette pour l’instant.</p>'}
  ${ancien()?`<section class="card todo"><h3>Ancien carnet numérique</h3><p class="small">${ancien()} binôme${ancien()>1?'s':''} de l’ancienne appli trouvé${ancien()>1?'s':''} sur cette tablette. Reprenez-les ici : chaque binôme choisira ensuite son code secret.</p><button class="btn pri" data-act="migrer">Reprendre les binômes de l’ancien carnet</button></section>`:''}
  <section class="card"><h3>Nouveau groupe</h3>
    <button class="btn pri big full" data-act="nouveauqr">Scanner le QR de la classe</button>
    ${C.length?`<p class="small muted">Ou une classe déjà enregistrée sur la tablette :</p><div class="seg">${C.map(c=>`<button class="chip" data-act="nouveau" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>`:''}
    <details><summary class="small">Pas de QR ? Créer le groupe à la main</summary><p class="small muted">Le professeur affiche le QR de la classe au premier cours : il donne la liste des élèves et active l’envoi en ligne. Sans lui, seul l’envoi par QR code est possible.</p>
      <div class="row wrap"><button class="btn" data-act="nouveaumain" data-v="S">Créer le groupe sans QR</button></div></details></section>
  <section class="card demo-carte"><h3>Découvrir l’appli</h3><p class="small muted">Un groupe fictif déjà rempli, pour voir tous les écrans. Rien n’est enregistré ni envoyé.</p>
    <div class="row wrap"><button class="btn" data-act="demo" data-v="S">Ouvrir la démo</button></div></section>
  <p class="ver">Step · carnet élève ${APP_VERSION}. Les données restent sur cette tablette : elles partent seulement quand votre groupe les envoie au professeur.</p>`;
}
/* ----- Groupe ----- */
function vGroupe(){
  const b=G,C=b.cfg,L=b.runners.slice(),n3=b.runners.length>=3||V.trois;while(L.length<(n3?3:2))L.push(null);
  const sx=(i,r)=>`<div class="seg" id="gx${i}"><button class="chip ${r&&r.sexe==='F'?'on':''}" data-sx="${i}" data-v="F">Fille</button><button class="chip ${r&&r.sexe==='G'?'on':''}" data-sx="${i}" data-v="G">Garçon</button></div>
    <div class="seg" id="ga${i}">${[14,15,16,17,18].map(a=>`<button class="chip sm ${r&&String(r.age)===String(a)?'on':''}" data-sx="${i}" data-v="${a}">${a} ans</button>`).join('')}</div>`;
  const choix=(r,i)=>{const pris=new Set(b.runners.filter((x,j)=>j!==i).map(x=>norm(x.full)));const hors=r&&!C.eleves.some(n=>norm(n)===norm(r.full));
    return `<select id="ge${i}" class="in sel"><option value="">${i===2?'— (si vous êtes 3) —':'— Choisir —'}</option>${hors?`<option selected>${esc(r.full)}</option>`:''}${C.eleves.filter(n=>!pris.has(norm(n))||(r&&norm(n)===norm(r.full))).map(n=>`<option${r&&norm(n)===norm(r.full)?' selected':''}>${esc(n)}</option>`).join('')}</select>`};
  const lig=(r,i)=>`<fieldset><legend>Élève ${'ABC'[i]}${i===2?' (exceptionnel)':''}</legend>${C?choix(r,i):`<div class="row wrap"><label>Prénom<input class="in" id="gp${i}" value="${esc(r?r.prenom:'')}" autocomplete="off"></label><label>NOM<input class="in" id="gn${i}" value="${esc(r?r.nom:'')}" autocomplete="off"></label></div>`}${sx(i,r)}</fieldset>`;
  return `<section class="card"><h2>Mon groupe · ${CYC[b.cy].label}</h2>
   ${C?`<p class="small"><b>Classe ${esc(C.classe)}</b> <span class="muted">· liste reçue du professeur (${C.eleves.length} élèves)</span></p>`:`<label>Classe<input class="in" id="gcl" value="${esc(b.classe)}" placeholder="${b.cy==='T'?'ex. Tle 2':'ex. 2nde 3'}" autocomplete="off"></label>`}
   ${L.map(lig).join('')}
   ${n3?'<p class="muted small">Trinôme exceptionnel (élève seul ou partenaire blessé) : A coache B, B coache C, C coache A.</p>':'<p class="small"><button class="lnk" data-act="trois">+ Ajouter un 3e élève (exceptionnel : élève seul ou partenaire blessé)</button></p>'}
   <p class="muted small">L’âge sert à calculer la FC max et les zones. Un élève pratique, l’autre coache (il mesure la FC à l’oxymètre et remplit les cases), puis vous changez.</p>
   <div class="row wrap"><button class="btn pri big" data-act="gvalider">Enregistrer le groupe</button>${C?'':'<button class="btn" data-act="qrclasse">Scanner le QR de la classe</button>'}</div></section>
  ${b.runners.length?`<section class="card"><h3>Un élève change de groupe</h3><p class="small muted">Toutes ses séances le suivent sur l’autre tablette.</p>
    <div class="row wrap">${b.runners.map((r,i)=>`<button class="btn sm" data-act="tpartir" data-v="${i}">${esc(r.prenom)} part</button>`).join('')}</div>
    ${b.runners.length<3?'<p class="small"><b>Un élève arrive, ou le professeur vous donne un QR de reprise :</b></p><button class="btn sm pri" data-act="tarrive">Scanner le QR de l’élève</button>':'<p class="small muted">Le groupe est complet (3) : pour accueillir un élève, retirez d’abord quelqu’un. Le QR de reprise du professeur marche quand même pour un élève du groupe.</p><button class="btn sm" data-act="tarrive">Scanner un QR de reprise</button>'}</section>`:''}
  <section class="card"><h3>Changer de tablette</h3><p class="small muted">Le carnet du groupe est gardé sur cette tablette. Pour continuer sur une autre : enregistrez-le ici, puis reprenez-le là-bas (et choisissez un code).</p>
    <div class="row wrap"><button class="btn sm" data-act="sauvegarde">Enregistrer le carnet du groupe</button><label class="btn sm" for="reprise">Reprendre un carnet</label><input id="reprise" type="file" accept=".json,application/json" hidden></div>
    ${C?'<p class="small"><button class="lnk" data-act="qrclasse">Nouvelle liste de classe (QR du professeur)</button></p>':''}</section>
  <section class="card"><h3>Cette tablette</h3><label class="tog"><input type="checkbox" id="optdark" ${ROOT.opts.dark?'checked':''}> Mode sombre (déconseillé dehors, au soleil)</label>
    <button class="btn sm ghost" data-act="toutEffacer">Supprimer ce groupe de la tablette</button></section>
  <p class="ver">Les données restent sur cette tablette. Elles partent seulement quand vous les envoyez au professeur (QR code ou envoi en ligne). ${APP_VERSION}</p>`;
}
/* ----- Envoyer ----- */
function resumeTxt(run,sid){const d=run.seances&&run.seances[sid];if(!hasData(d))return '';if(d.st)return ST_TXT[d.st];const [t,n]=tenR(run,sid);const L=[];
  if(n)L.push(t+'/'+n+' réussites');const rp=num((d.bl||{}).rpe);if(rp!=null)L.push('effort '+rp+'/10');if(d.ad)L.push('pratique adaptée');if(d.cx&&d.cx.n)L.push('coach remplaçant');return L.join(' · ')||'séance commencée'}
function vEnvoi(){
  const b=G,sid=V.sid,s=SBY[sid],ev=b.envoi[sid]||{},LET='ABC';const st=sessState(b,sid);
  const lignes=b.runners.map((r,k)=>{const ok=hasData(r.seances&&r.seances[sid])&&!(r.imp&&r.imp[sid]);
    return `<li class="${ok?'':'manque'}"><span class="lettre">${LET[k]}</span><span><b>${esc(r.prenom)} ${esc(r.nom)}</b><small>${ok?esc(resumeTxt(r,sid)):'rien de saisi'}</small></span>${ok?'<em>✓</em>':''}</li>`}).join('');
  const F=fichiers([sid]);const autres=nonEnvoyees().filter(x=>x.id!==sid);
  return `<section class="card"><h2>Fin de séance ${s.n}</h2><p class="muted small">${esc(s.t)}</p><ul class="envoi">${lignes}</ul>
   ${b.runners.some(r=>!hasData(r.seances&&r.seances[sid]))?'<p class="warn small">Chaque élève remplit sa séance (son prénom en haut de l’écran Séance). Un absent ? Marque-le « absent » : le prof le saura.</p>':''}
   <div class="gros"><button class="btn pri big" data-act="enligne" ${F.length?'':'disabled'}>Envoyer la séance en ligne</button>${ev.fichier?`<p class="ok small">✓ envoyée à ${heure(ev.fichier)}</p>`:''}
   <button class="btn big" data-act="qr" ${F.length?'':'disabled'}>Montrer les QR codes au prof</button>${ev.qr?`<p class="ok small">✓ QR montrés à ${heure(ev.qr)}</p>`:''}
   ${st==='resend'?'<p class="warn small center">Séance modifiée depuis le dernier envoi : renvoie-la.</p>':''}</div></section>
  ${autres.length?`<section class="card todo"><h3>⚠ Pas encore envoyé${autres.length>1?'es':''} : ${autres.map(x=>x.n).join(', ')}</h3><p class="small">Envoie-les maintenant, en une seule fois.</p>
    <div class="row wrap"><button class="btn sm pri" data-act="enligneTout">Tout envoyer en ligne</button><button class="btn sm" data-act="qrTout">QR codes de rattrapage</button></div></section>`:''}
  <p class="ver">L’envoi en ligne prépare un fichier par élève (et une copie de secours chiffrée que seul le professeur peut ouvrir), puis ouvre l’espace de dépôt de la classe.</p>`;
}

/* ---------- Évènements ---------- */
document.addEventListener('click',async e=>{
  const t=e.target.closest('button,[data-act],[data-tab],[data-sess]');if(!t)return;const ds=t.dataset;
  if(ds.act==='fermerVoile')return;
  const a=ds.act,v=ds.v;
  /* sans groupe ouvert */
  if(a==='codeok')return validerCode();
  if(a==='closem')return closeModal();
  if(a==='reload')return location.reload();
  if(a==='demo'){closeModal();return ouvrirDemo(v)}
  if(a==='migrer')return migrer();
  if(a==='demoQuitter'){closeModal();await verrouiller();return render()}
  if(a==='choisir'){const g=ROOT.groupes[v];
    if(g.clair)return demanderCode('Protéger votre carnet','Choisissez un code secret de 4 chiffres pour votre groupe. Retenez-le : il sera demandé à chaque cours.',c=>ouvrir(v,c),true,v);
    return demanderCode('Code du groupe '+(g.noms||[]).join(' · '),'Tapez votre code secret à 4 chiffres.',c=>ouvrir(v,c),false,v)}
  if(a==='nouveau')return codeNouveau(v,(ROOT.classes[v]||{}).cy||'S');
  if(a==='nouveaumain')return demanderCode('Nouveau groupe · '+CYC[v].label,'Choisissez un code secret de 4 chiffres. Retenez-le : il sera demandé à chaque cours.',c=>nouveauGroupe('',v,c),true);
  if(a==='codeoubli'){const id=CODE_CB&&CODE_CB.id;if(!id)return;return demandeDeblocage(id)}
  if(a==='deblscan'){closeModal();return scannerQR(o=>recevoirDeblocage(v,o),'Déverrouillage','Scanne le QR affiché par l’outil du professeur.')}
  if(a==='suppridoublie'){if(!confirm('Supprimer définitivement ce carnet ?'))return;delete ROOT.groupes[v];ecrireRoot();closeModal();return render()}
  if(a==='nouveauqr'||(a==='qrclasse'&&!G)){if(DEMO)return toast('Pas disponible en démo.');return scannerQR(recevoirClasse,'QR de la classe','Scanne le QR affiché par le professeur.')}
  if(a==='changer'){const ne=G&&!DEMO?nonEnvoyees():[];
    if(ne.length&&!confirm('⚠ '+ne.map(s=>s.n).join(', ')+' pas encore envoyée au professeur.\n\nOK = changer quand même\nAnnuler = rester pour envoyer')){V.tab='envoi';return render()}
    closeModal();await verrouiller();render();return window.scrollTo(0,0)}
  if(!G)return;
  /* navigation */
  if(ds.tab){V.tab=ds.tab;if(ds.tab==='seance'){V.cur=V.cur||0}render();return window.scrollTo(0,0)}
  if(ds.sess){closeModal();V.sid=ds.sess;V.tab='seance';V.ri=0;V.cur=0;V.ph='piste';V.presOpen=false;G.jours[today()]=V.sid;save();render();return window.scrollTo(0,0)}
  if(ds.ri)return keepScroll(()=>{V.ri=+ds.ri;V.cur=0;render()});
  if(ds.ph){V.ph=ds.ph;V.cur=0;V.tab='seance';render();return window.scrollTo(0,0)}
  if(ds.sx){t.parentNode.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));t.classList.add('on');return}
  /* saisie de séance (repris du carnet v12) */
  if(ds.stp&&V.tab==='seance'){const d=curD();const o=JSON.parse(ds.o||'{}');const isT=ds.tm==='1';const dl_=+ds.dl;const cur=isT?parseT(getPath(d,ds.stp)):num(getPath(d,ds.stp));
    let nv=cur==null?(o.s0!=null?o.s0:(o.mn!=null?o.mn:0)):cur+dl_;if(o.mn!=null)nv=Math.max(o.mn,nv);if(o.mx!=null)nv=Math.min(o.mx,nv);nv=R(nv*10)/10;
    setPath(d,ds.stp,isT?fT(nv):String(nv).replace('.',','));
    fixP(d);saveS();return keepScroll(render)}
  if(ds.set!==undefined&&V.tab==='seance'){const d=curD();let val=ds.v;if(getPath(d,ds.set)===val&&!ds.set.startsWith('bl.cr'))val='';setPath(d,ds.set,val);fixP(d);saveS();return keepScroll(render)}
  if(ds.tog&&V.tab==='seance'){const d=curD();const x=d[ds.tog]=d[ds.tog]||[];const i=x.indexOf(ds.v);if(i>=0)x.splice(i,1);else x.push(ds.v);saveS();return keepScroll(render)}
  if(ds.sugg!==undefined&&V.tab==='seance'){const d=curD();const c=getPath(d,'bl.con')||'';if(c.includes(ds.sugg))setPath(d,'bl.con',c.replace(ds.sugg,'').replace(/^\s*[;·]\s*|\s*[;·]\s*$/g,'').replace(/\s*;\s*;\s*/,' ; '));else setPath(d,'bl.con',(c?c.trim()+' ; ':'')+ds.sugg);saveS();return keepScroll(render)}
  if(ds.cur!==undefined){V.cur=+ds.cur;render();const st=$('.steps');if(st)window.scrollTo(0,Math.max(0,st.getBoundingClientRect().top+window.scrollY-70));return}
  if(ds.ad!==undefined&&V.tab==='seance'){const r=G.runners[+ds.ad],d=sd(r,V.sid);if(d.ad)delete d.ad;else d.ad='1';saveS();return keepScroll(render)}
  if(ds.age){const [i,a]=ds.age.split('|');G.runners[+i].age=+a;save();return keepScroll(render)}
  if(ds.st!==undefined&&V.tab==='seance'){const i=+ds.st,r=G.runners[i],d=sd(r,V.sid);d.st=ds.v||'';if(!d.st)delete d.st;
    if(!d.st)G.runners.forEach(o=>{const od=sd(o,V.sid);if(od.cx&&od.cx.why==='abs'&&!G.runners.some(x=>(sd(x,V.sid)).st==='abs'))delete od.cx});
    saveS();const need=G.runners.findIndex((o,j)=>{const od=sd(o,V.sid);return !od.st&&coachOf(G,j,V.sid).need});
    if(d.st==='abs'&&need>=0){V.ri=need;render();return coachModal()}return keepScroll(render)}
  if(ds.cxw){t.parentNode.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));t.classList.add('on');return}
  if(ds.chf){CH.fmt=ds.chf;return render()}
  if(!a)return;
  switch(a){
    case 'chgo':beep(700,60);return chStart();
    case 'chpause':chPause();return render();
    case 'chstop':chStop();return render();
    case 'seances':return modal(`<h2>Changer de séance</h2><p class="muted small">${CYC[G.cy].label} · ✓ envoyée · ! à envoyer</p><div class="sgrid">${curSessOf(G).map(x=>{const st=sessState(G,x.id);
      return `<button class="sbtn ${st} ${x.id===V.sid?'ici':''}" data-sess="${x.id}"><b>${x.n}</b><span>${esc(x.t)}</span><i>${st==='sent'?'✓ envoyée':st==='resend'?'! modifiée : renvoyer':st==='wip'?'! à envoyer':x.id===V.sid?'aujourd’hui':''}</i></button>`}).join('')}</div><div class="row"><button class="btn" data-act="closem">Fermer</button></div>`);
    case 'onetog':DB.opts.one=!oneMode();ecrireRoot();return keepScroll(render);
    case 'presopen':V.presOpen=true;return keepScroll(render);
    case 'presclose':V.presOpen=false;return keepScroll(render);
    case 'chcoach':return coachModal();
    case 'cxok':{const n=$('#cxn').value.trim();if(!n)return toast('Écris le prénom du coach remplaçant.');const w=(document.querySelector('#cxw .on')||{dataset:{}}).dataset.cxw||'abs';curD().cx={n,why:w};saveS();closeModal();return keepScroll(render)}
    case 'cxdel':delete curD().cx;saveS();closeModal();return keepScroll(render);
    case 'finseance':V.tab='envoi';render();return window.scrollTo(0,0);
    /* envoi */
    case 'qr':QRS=null;return montrerQR([V.sid],0);
    case 'qrTout':QRS=null;return montrerQR(nonEnvoyees().map(s=>s.id),0);
    case 'qrnav':return montrerQR(QRS?QRS.sids:[V.sid],+v);
    case 'qrfin':{const sids=QRS?QRS.sids:[V.sid];closeModal();if(!DEMO)marquerEnvoye(sids,'qr');return render()}
    case 'enligne':case 'enligneTout':{
      const sids=a==='enligne'?[V.sid]:nonEnvoyees().map(s=>s.id);
      if(DEMO)return modal(`<h2>Mode démo</h2><p>En vrai, ce bouton prépare un fichier par élève et ouvre l’espace de dépôt du professeur. En démo, rien n’est envoyé.</p><p class="small muted">« Montrer les QR codes » fonctionne pour voir à quoi ils ressemblent.</p><div class="row"><button class="btn" data-act="closem">Fermer</button></div>`);
      if(!lienEnvoi())return modal(`<h2>Envoi en ligne</h2><p>L’envoi en ligne n’est pas encore activé pour ta classe (il arrive avec le QR de la classe du professeur).</p><p><b>Montre tes QR codes</b> au professeur à la place.</p><div class="row wrap" style="justify-content:space-between"><button class="btn" data-act="closem">Fermer</button><button class="btn pri" data-act="${a==='enligne'?'qr':'qrTout'}">Montrer les QR codes</button></div>`);
      const ok=await enregistrerFichiers(sids);if(!ok)return;
      return modal(`<h2>Dernière étape</h2><p>Les fichiers sont prêts. Touche « Déposer », puis choisis-les dans Téléchargements (ou Fichiers).</p><div class="row wrap" style="justify-content:space-between"><button class="btn" data-act="closem">Fermer</button><a class="btn pri" href="${esc(lienEnvoi())}" target="_blank" rel="noopener" data-act="closem">Déposer</a></div>`)}
    /* groupe */
    case 'gvalider':return validerGroupe();
    case 'trois':{/* garder ce qui est déjà choisi dans le formulaire */
      const val={},sx={};document.querySelectorAll('#main select,#main input').forEach(x=>{if(x.id)val[x.id]=x.value});document.querySelectorAll('[id^="gx"] .on').forEach(x=>sx[x.parentNode.id]=x.dataset.v);
      V.trois=true;keepScroll(render);Object.entries(val).forEach(([id,v])=>{const x=document.getElementById(id);if(x)x.value=v});
      Object.entries(sx).forEach(([id,v])=>{const z=document.getElementById(id);if(!z)return;z.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c.dataset.v===v))});return}
    case 'qrclasse':if(DEMO)return toast('Pas disponible en démo.');return scannerQR(recevoirClasse,'QR de la classe','Scanne le QR affiché par le professeur.');
    case 'tpartir':if(DEMO)return toast('Pas disponible en démo.');return montrerTransfert(+v);
    case 'tretirer':{const r=G.runners[+v];G.runners.splice(+v,1);V.ri=0;closeModal();save();render();return toast((r?r.prenom:'L’élève')+' est retiré du groupe.')}
    case 'tarrive':if(DEMO)return toast('Pas disponible en démo.');return scannerQR(accueillir,'Élève qui arrive','Scanne le QR affiché par son ancien groupe, ou le QR de reprise du professeur.');
    case 'sauvegarde':if(DEMO)return toast('Pas disponible en démo.');await enregistrer();return telecharger('Carnet_Step_'+(slug(G.classe)||'groupe')+'_'+G.runners.map(r=>slug(r.prenom)).join('-')+'_'+today()+'.json',JSON.stringify(Object.assign({carnetST:1},G)));
    case 'toutEffacer':{if(DEMO)return toast('Pas disponible en démo.');const ne=nonEnvoyees();if(!confirm((ne.length?'⚠ '+ne.map(s=>s.n).join(', ')+' jamais envoyée(s) au professeur : elle(s) sera(ont) perdue(s).\n\n':'')+'Supprimer ce groupe et toutes ses séances de la tablette ?'))return;
      delete ROOT.groupes[ACTIF];G=null;ACTIF=null;CLEF=null;DB.binomes=[];ecrireRoot();return render()}
  }
});
function validerGroupe(){
  const b=G,C=b.cfg,rs=[];
  for(let i=0;i<3;i++){let full='';
    if(C){full=($('#ge'+i)||{}).value||''}else{if(!$('#gp'+i))continue;const p=($('#gp'+i).value||'').trim(),n=($('#gn'+i).value||'').trim();if(p||n){if(!p||!n)return toast('Prénom et NOM pour chaque élève.');full=p+' '+n.toUpperCase()}}
    if(!full)continue;const sx=(document.querySelector('#gx'+i+' .on')||{dataset:{}}).dataset.v||'';if(!sx)return toast('Fille ou garçon pour chaque élève (la FC max se calcule différemment).');
    const ag=(document.querySelector('#ga'+i+' .on')||{dataset:{}}).dataset.v||'';if(!ag)return toast('L’âge de chaque élève (il sert à calculer la FC max).');rs.push({full:full.trim(),sexe:sx,age:+ag})}
  if(!rs.length)return toast('Choisis au moins un élève.');if(rs.length===1&&!V.seul){V.seul=true;return toast('Un seul élève : il lui faudra un coach remplaçant à chaque séance. Touche encore « Enregistrer » pour confirmer.')}
  if(new Set(rs.map(r=>norm(r.full))).size<rs.length)return toast('Le même élève est choisi deux fois.');
  if(!C){const cl=($('#gcl').value||'').trim();if(!cl)return toast('Écris le nom de la classe.');b.classe=cl}
  const old=b.runners;const parti=old.filter(o=>!rs.some(r=>norm(r.full)===norm(o.full))&&Object.values(o.seances||{}).some(hasData));
  if(parti.length&&!confirm(parti.map(o=>o.prenom).join(', ')+' a des séances sur cette tablette. Pour qu’il les garde, utilise plutôt « … part » (changement de groupe).\n\nOK = retirer quand même'))return;
  b.runners=rs.map(r=>{const o=old.find(x=>norm(x.full)===norm(r.full));if(o){o.sexe=r.sexe;o.age=r.age;return o}return {id:uid(),full:r.full,prenom:prenomDe(r.full),nom:nomDe(r.full),sexe:r.sexe,age:r.age,fcrM:'',seances:{}}});
  V.ri=0;V.tab='seance';save();render();window.scrollTo(0,0);toast('Groupe enregistré.');
}
document.addEventListener('keydown',ev=>{if(ev.target&&ev.target.id==='code'&&ev.key==='Enter'){ev.preventDefault();validerCode()}});
document.addEventListener('input',e=>{const el=e.target;if(!G)return;
  if(el.dataset.p&&V.tab==='seance'){const r=G.runners[V.ri||0],d=sd(r,V.sid);setPath(d,el.dataset.p,el.value);fixP(d);
    saveS()}
  if(el.dataset.fm!==undefined){G.runners[+el.dataset.fm].fcrM=el.value;save()}
});
document.addEventListener('change',async e=>{const el=e.target;
  if(el.id==='chvoice'){CH.voice=el.checked;return}
  if(el.id==='optdark'){ROOT.opts.dark=el.checked;ecrireRoot();document.documentElement.dataset.theme=el.checked?'dark':'light';return}
  if(el.id==='reprise'&&el.files[0]){
    try{const o=JSON.parse(await el.files[0].text());if(!o.carnetST||!o.runners)throw 0;delete o.carnetST;
      if(o.cfg&&o.cfg.classe)ROOT.classes[o.cfg.classe]=o.cfg;await verrouiller();const id=uid();o.id=id;
      ROOT.groupes[id]={classe:o.classe||'',cy:o.cy||'S',noms:(o.runners||[]).map(r=>r.prenom),clair:o};ecrireRoot();render();toast('Carnet repris : touchez-le et choisissez un code.')}
    catch(x){toast('Ce fichier n’est pas un carnet de groupe.')}
    el.value='';return}
  if(!G)return;
  if((el.dataset.p&&V.tab==='seance')||el.dataset.fm!==undefined)keepScroll(render);
});
/* balayage gauche / droite pour changer d'étape (mode une étape à la fois) */
let SW=null;document.addEventListener('touchstart',e=>{if(!G||V.tab!=='seance'||!oneMode()||e.touches.length!==1||e.target.closest('.tw,input,textarea,.stp,.reps,#modal,.strip'))return SW=null;SW={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
document.addEventListener('touchend',e=>{if(!SW)return;const t=e.changedTouches[0],dx=t.clientX-SW.x,dy=t.clientY-SW.y;SW=null;if(Math.abs(dx)<80||Math.abs(dy)>50)return;
  const n=stepList(SBY[V.sid]).length;const c=Math.max(0,Math.min(n-1,(V.cur||0)+(dx<0?1:-1)));if(c!==V.cur){V.cur=c;keepScroll(render)}},{passive:true});
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal'&&!(LIVE&&LIVE.t0&&LIVE.stage!=='done')&&!CODE_CB)closeModal()});
/* ---------- hors ligne et mises à jour ---------- */
function showUpd(){const u=$('#upd');if(!u)return;u.innerHTML=`Nouvelle version de l’appli installée. <button class="btn sm" data-act="reload">Recharger</button>`;u.classList.add('on')}
if('serviceWorker' in navigator&&location.protocol==='https:'){
  let had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had)showUpd();had=true});
  navigator.serviceWorker.register('sw.js').then(reg=>{reg.update().catch(()=>{});setInterval(()=>reg.update().catch(()=>{}),3600e3)}).catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{})});
}

/* fiche Conseils (repères de l'équipe EPS) */
function conseilsView(){const D=[
['Chaussures et tenue','Des chaussures de sport lacées serré, jamais pieds nus ni en chaussettes sur le step. Une couche en plus pour l’échauffement et le retour au calme.'],
['Genoux et dos','Pied entier au centre du step, genou dans l’axe du pied, jamais de descente en avant ni de saut en descendant. Une douleur au genou ou au dos : passe en version basse et préviens le professeur.'],
['Boire, manger','Un repas léger 2 h avant le cours, pas à jeun. Petites gorgées d’eau entre les séries.'],
['La FC de repos','Prends-la 3 matins de suite au réveil, avant de te lever (pouls 15 s × 4) : c’est elle qui rend tes zones justes.'],
['S’entraîner hors du cours','Deux séances de 20 à 30 min par semaine dans ta zone B (tu parles par phrases) entretiennent mieux qu’une séance épuisante.'],
['Le jour de l’évaluation','Dors, mange comme d’habitude, relis ton plan de séance et ton réglage de départ.']];
return `<section class="card"><h3>Conseils</h3>${D.map(([t,x])=>`<details class="help"><summary>${t}</summary><div><p>${x}</p></div></details>`).join('')}</section>`}

/* chrono qui reprend après rechargement : on rouvre son écran */
function chOuvrir(){V.tab='chrono'}
