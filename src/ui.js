/* ===================== CARNET STEP · interface ===================== */
/* mode démo (lien …/?demo) : classe fictive rangée à part, les vraies données ne sont jamais touchées */
const DEMO=!!window.CARNET_DEMO||/[?&#]demo\b/.test(location.search+location.hash);
const SK=DEMO?STORE+'_demo':STORE, PSK=DEMO?PSTORE+'_demo':PSTORE;
let DB=load(SK,{binomes:[],code:'1275',opts:{}});
DB.schema=SCHEMA;DB.opts=DB.opts||{};
let PDB=load(PSK,{students:{},stars:{}});PDB.schema=PDB.schema||SCHEMA;
document.documentElement.dataset.theme=DB.opts.dark?'dark':'light';
let V={v:'home',cls:''};
function load(k,def){try{const x=JSON.parse(localStorage.getItem(k));return x&&typeof x==='object'?Object.assign(def,x):def}catch(e){return def}}
function save(){try{localStorage.setItem(SK,JSON.stringify(DB))}catch(e){toast('Mémoire pleine : fais scanner tes QR par le prof.')}}
function psave(){try{localStorage.setItem(PSK,JSON.stringify(PDB))}catch(e){toast('Mémoire pleine : exporte une sauvegarde.')}}
if(navigator.storage&&navigator.storage.persist){try{navigator.storage.persist()}catch(e){}}
{{base}}

/* ---------- accès aux données ---------- */
const curBin=()=>DB.binomes.find(b=>b.id===V.bin);
function sd(run,sid){run.seances=run.seances||{};return run.seances[sid]=run.seances[sid]||{}}
const curD=()=>sd(curBin().runners[V.ri||0],V.sid);
{{path}}
function saveS(){const b=curBin();if(b&&V.sid){b.mod=b.mod||{};b.mod[V.sid]=Date.now()}save()}
function tenR(run,sid){const d=run.seances&&run.seances[sid];if(!d)return [0,0];return tenus(sid,d,run)}
function sessState(b,sid){const has=b.runners.some(r=>hasData(r.seances&&r.seances[sid]));const sent=b.sent&&b.sent[sid],mod=b.mod&&b.mod[sid];
  if(sent&&mod&&mod>sent+1500)return 'resend';if(sent)return 'sent';return has?'wip':''}

{{icons}}
/* ---------- rendu général ---------- */
function render(){
  const m=$('#main');document.body.dataset.cy='S';
  const views={home:homeView,new:newView,edit:editView,bin:binView,sess:sessView,zones:zonesView,prog:progView,prof:profView};
  document.body.classList.toggle('home',V.v==='home');
  m.innerHTML=icons((views[V.v]||homeView)());
  $('#crumb').innerHTML=crumb();
}
function crumb(){
  const b=curBin();const parts=[];
  const backTo={sess:'bin',zones:'bin',prog:'bin',edit:'bin',bin:'home',new:'home',prof:'home'}[V.v];
  const backLbl={bin:b?'← '+esc(b.runners[0].prenom)+' & '+esc(b.runners[1].prenom):'← Retour',home:'← Binômes'}[backTo];
  const back=backTo&&(backTo!=='bin'||b)?`<button class="back" data-go="${backTo}">${backLbl}</button>`:'';
  if(V.v==='prof')return back+'<b>Mode prof</b>';
  parts.push('<button class="lnk" data-go="home">Binômes</button>');
  if(b&&V.v!=='home'&&V.v!=='new')parts.push(`<button class="lnk" data-go="bin">${esc(b.runners[0].prenom)} & ${esc(b.runners[1].prenom)}</button>`);
  const here={sess:V.sid&&SBY[V.sid]?SBY[V.sid].n:'',zones:'Mes zones',prog:'Ma progression',edit:'Corriger les noms'}[V.v];
  if(here)parts.push('<b>'+here+'</b>');
  return back+'<span>'+parts.join(' › ')+'</span>';
}

/* ---------- accueil : binômes de la tablette ---------- */
function homeView(){
  const classes=[...new Set(DB.binomes.map(b=>b.classe))].sort();
  const list=DB.binomes.filter(b=>!V.cls||b.classe===V.cls);
  return `<section class="lanehead s"><span class="ln">2<sup>de</sup></span><div><b>Step · CA5 · Seconde</b><span>8 séances, de S1 à S8. Touche ton binôme, ou crée-le à la 1re séance.</span></div></section>
  ${classes.length>1?`<div class="seg">${['',...classes].map(c=>`<button class="chip ${V.cls===c?'on':''}" data-cls="${esc(c)}">${c?esc(c):'Toutes les classes'}</button>`).join('')}</div>`:''}
  ${list.length?`<div class="grid">${list.map(b=>{const todo=SESS.filter(s=>['wip','resend'].includes(sessState(b,s.id))).length;
    return `<button class="bincard" data-open="${b.id}"><span class="cls">${esc(b.classe)}</span><b>${esc(b.runners[0].prenom)} ${esc(b.runners[0].nom.charAt(0))}.</b><b>${esc(b.runners[1].prenom)} ${esc(b.runners[1].nom.charAt(0))}.</b><span class="muted">${Object.keys(b.sent||{}).length} séance(s) envoyée(s)</span>${todo?`<span class="warn small">⚠ ${todo} QR à montrer au prof</span>`:''}</button>`}).join('')}</div>`:`<p class="muted">Aucun binôme sur cette tablette pour l’instant.</p>`}
  <button class="btn pri big home-new" data-go="new">＋ Créer un binôme</button>
  <div class="row wrap center"><button class="lnk" data-act="restore">↺ Restaurer un binôme avec le QR du prof</button></div>
  <p class="ver">Carnet step ${APP_VERSION}. Les données restent sur cette tablette : rien n’est envoyé sur Internet.${DEMO?'':` · <a href="${location.pathname}?demo">Voir la démo</a>`}</p>`;
}
function nameFields(i,x){x=x||{};const ini=DB.opts.ini;
  return `<fieldset><legend>Élève ${i+1}</legend><label>Prénom<input id="np${i}" value="${esc(x.prenom||'')}" autocomplete="off"></label><label>${ini?'Initiale du nom':'Nom'}<input id="nn${i}" value="${esc(x.nom||'')}" ${ini?'maxlength="1"':''} autocomplete="off"></label>
   <div class="seg" id="nx${i}"><button class="chip ${x.sexe==='F'?'on':''}" data-sx="${i}" data-v="F">Fille</button><button class="chip ${x.sexe==='G'?'on':''}" data-sx="${i}" data-v="G">Garçon</button></div>
   <p class="small">Âge</p><div class="seg" id="na${i}">${[14,15,16,17,18].map(a=>`<button class="chip ${String(x.age)===String(a)?'on':''}" data-sx="${i}" data-v="${a}">${a} ans</button>`).join('')}</div></fieldset>`}
function newView(){
  return `<section class="card"><h2>Nouveau binôme</h2>
  <label>Classe<input id="ncl" placeholder="ex. 2nde 3" value="${esc(V.cls||'')}" autocomplete="off"></label>${nameFields(0)}${nameFields(1)}
  <p class="muted small">L’âge sert à calculer ta FC max et tes zones. Un élève pratique pendant que l’autre coache : il mesure la FC à l’oxymètre et remplit les cases.</p>
  <button class="btn pri big" data-act="create">Créer le binôme</button></section>`;
}
function editView(){
  const b=curBin();if(!b)return homeView();
  return `<section class="card"><h2>Corriger les noms</h2><label>Classe<input id="ncl" value="${esc(b.classe)}" autocomplete="off"></label>${nameFields(0,b.runners[0])}${nameFields(1,b.runners[1])}
  <p class="muted small">Les séances déjà remplies sont conservées. Au prochain QR, le prof reçoit le nom corrigé.</p>
  <div class="row wrap"><button class="btn pri big" data-act="saveedit">Enregistrer</button><button class="btn" data-go="bin">Annuler</button></div></section>`;
}
function binView(){
  const b=curBin();if(!b)return homeView();
  const todo=SESS.filter(s=>['wip','resend'].includes(sessState(b,s.id)));
  return `<section class="card"><div class="row"><h2>${esc(b.runners[0].prenom)} & ${esc(b.runners[1].prenom)}</h2><span class="cls">${esc(b.classe)}</span></div>
  ${todo.length?`<div class="todo"><p class="warn small">⚠ Pas encore envoyé au prof : ${todo.map(s=>s.n).join(', ')}.</p><div class="row wrap"><button class="btn sm pri" data-act="qrall">QR de rattrapage (${todo.length} séance${todo.length>1?'s':''})</button><button class="btn sm" data-act="shareall">Envoyer en fichier (AirDrop)</button></div></div>`:''}
  ${(()=>{const sc=b.runners.map(r=>scoreRun(r));const tot=sc.reduce((a,x)=>a+x.tot,0);return `<div class="defibox"><p><b>🎯 Score du binôme : ${tot} pts</b> <span class="small muted">(Juste Pouls + Pile dans la cible, S3 à S7)</span></p>${b.runners.map((r,i)=>{const bg=badgesOf(r,b.runners[1-i]);return `<p class="small"><b>${esc(r.prenom)}</b> · ${sc[i].tot} pts · ${bg.length?bg.map(k=>`<span class="badge">🏅 ${BADGES.find(x=>x[0]===k)[1]}</span>`).join(' '):'<span class="muted">pas encore de badge</span>'}</p>`}).join('')}</div>`})()}
  <div class="sgrid">${SESS.map(s=>{const st=sessState(b,s.id);
    return `<button class="sbtn ${st}" data-sess="${s.id}"><b>${s.n}</b><span>${esc(s.t)}</span><i>${st==='sent'?'✓ envoyée au prof':st==='resend'?'modifiée : renvoyer le QR':st==='wip'?'en cours · QR à montrer':''}</i></button>`}).join('')}</div>
  <div class="row wrap"><button class="btn" data-go="zones">Mes zones</button><button class="btn" data-go="prog">Ma progression</button><button class="btn" data-act="editbin">✎ Corriger les noms</button><button class="btn ghost" data-act="delbin">Supprimer ce binôme</button></div></section>`;
}

/* ---------- consignes repliables (bouton ⓘ) ---------- */
const HELP={
 fcr:()=>['<b>FC de repos</b> : assis, 3 min de calme absolu, puis oxymètre au doigt. C’est une valeur provisoire.','<b>La vraie FC de repos</b> se prend à la maison, 3 matins de suite, au réveil, avant de se lever (pouls 15 s × 4 ou oxymètre). Note-les ici dès que tu les as.'],
 coord:(b)=>b[1].map(k=>'<b>'+COORD[k][0]+'</b> : '+COORD[k][1]).concat(['Ces défis ne donnent pas de points : on coche « réussi » ou « pas encore ». Tu peux le retenter à la séance suivante.']),
 tri:()=>['Pendant l’échauffement, les blocs 1, 2 et 3 enchaînés <b>seul, sans l’enseignant</b>, sans bras ni saut. Réussi = badge <b>Mémoire</b>.'],
 vise:()=>['Vise le <b>milieu</b> de la zone que tu penses choisir. Choisis ton réglage, <b>annonce ta FC</b> (Juste Pouls), 3 min de blocs, mesure.','Sous la zone : +1 curseur. Au-dessus : −1 curseur. Puis 2e essai.'],
 mes:(b)=>b[1]==='m1'?['<b>Effort 1 · 6 min sans arrêt</b> : le bloc 1 en boucle en suivant le prof, step sans réhausse, mains aux hanches, aucun saut, genou pas plus haut que la hanche.','<b>Effort 2 · 3 min</b> : le même bloc, même musique, mais les bras montent au-dessus des épaules et le genou plus haut que la hanche. Toujours aucun saut. Seuls ces 2 changements : tu vois ce qu’ils font à ta FC.','<b>Protocole oxymètre</b> : arrêt → doigt dans l’oxymètre <b>dans les 5 s</b> → lire la FC stable vers 10 s → noter. Ignore la saturation (SpO₂).','Le second mesuré du binôme a une valeur un peu plus basse : on alterne qui mesure en premier.','<b>Ressenti (0 à 10)</b> : 3 = je parle en phrases, 5 = par mots, 10 = je ne peux plus parler.']
   :b[1]==='lv'?['<b>Même bloc, même musique : on ne change qu’un réglage à la fois.</b>','Série 1 : version basse. Série 2 : + propulsion (genoux sautés, tap up sautés). Série 3 : + 1 réhausse + bras au-dessus des épaules.','Récupération 2 min en mambo entre les séries. Mesure à chaque arrêt.']
   :['<b>12 min continues</b>, blocs 1 et 2 en boucle, version basse (step sans réhausse, aucun saut).','<b>Juste Pouls</b> : avant de partir, annonce la FC que tu auras à 6 min ; à 6 min, annonce celle de 12 min. À ± 5 = 3 pts, à ± 10 = 1 pt.','Arrêt de 15 s à 6 min pour la mesure (autorisé), puis on repart au signal. 12 min sans autre arrêt = badge <b>Endurant</b>.','Compare tes 2 FC à ta zone B (55 à 70 % de ta FC de réserve).'],
 bloc:()=>['Le coach compte les <b>blocs complets enchaînés sans arrêt</b> (droite puis gauche = 2 blocs) et les erreurs de pas.','<b>Réussi</b> : au moins 4 blocs de suite (2 de chaque côté) avec 2 erreurs au plus.','Touche les pas encore difficiles : ce sont eux que tu révises au ralenti.'],
 zcalc:()=>['FC max = 220 − âge (garçon) ou 226 − âge (fille).','FC de réserve (FCR) = FC max − FC de repos.','Zone A = FC repos + FCR × 80 % … FC repos + FCR × 95 %.','Zone B = FC repos + FCR × 55 % … FC repos + FCR × 70 %.','Calcule d’abord, puis touche « Vérifier mes calculs ».'],
 cur:()=>['<b>4 curseurs</b>, chacun de 0 à 2 : H hauteur, B bras, P propulsion, A amplitude. Le total (0 à 8) est ton <b>réglage</b>.','2 min de bloc 1 en version basse, mesure ; 2 min de récupération ; 2 min en version haute, mesure.','<b>Réussi</b> si la version haute fait gagner au moins 20 pulsations.'],
 essai:()=>['Choisis la filière qui t’attire et essaie-la : A = 3 × 2 min version haute, récupération 2 min · B = 10 min continues version basse (mesures à 5 et 10 min).','Les deux formats durent 10 min : toute la classe démarre et finit ensemble.'],
 choix:()=>['Un choix sans donnée chiffrée n’est pas validé. Donne <b>un ressenti</b>, <b>un chiffre</b> (FC, écart à ta zone) et <b>un projet</b>.','Choisis aussi la répartition de tes 8 points : AFL2 (s’entraîner) / AFL3 (coacher).'],
 warm:()=>['<b>4 phases</b> : 1 au sol · 2 sur le step · 3 les 3 blocs en version basse · 4 un bloc au réglage de ta filière, puis FC.','Le coach coche. 7 ou 8 critères → prêt. 5 ou 6 → refais la phase manquante.'],
 perso:()=>['Pour chaque bloc, choisis tes curseurs selon ta filière : <b>A</b> = propulsion et bras d’abord · <b>B</b> = amplitude et bras, sans saut.','Tu peux remplacer au plus 2 pas par bloc, par un pas de même durée qui laisse le même pied libre (ex. talons à la place d’un genou).'],
 regl:()=>['2 min avec ton réglage → mesure.','Sous ta zone : +1 curseur. Au-dessus : −1 curseur. Dedans : garde.','2 min avec le nouveau réglage → mesure. <b>Réussi</b> si la 2e mesure est dans ta zone.'],
 fil:(b,s)=>(s&&s.id!=='s8'?['<b>Défis</b> : avant chaque mesure, annonce ta FC (<b>Juste Pouls</b> : ± 5 = 3 pts, ± 10 = 1 pt). Chaque FC rapporte aussi des points <b>Pile dans la cible</b> : milieu de la zone ± 3 = 3 pts, dans la zone = 2 pts, à 5 près = 1 pt.']:['<b>Évaluation</b> : pas d’annonce, pas de points aujourd’hui.']).concat(['<b>Un seul chrono pour toute la classe</b> : les filières A et B démarrent et finissent ensemble.','A : mesure à la fin de chaque série. B : mesure à mi-série (arrêt 15 s, autorisé) et en fin de série.','Le coach note pour chaque série le <b>réglage</b> (H B P A), la <b>FC lue</b> et les <b>arrêts</b> (hors mesures).','Chaque FC dans ta zone = une réussite.']),
 obs:()=>['Le coach juge sur toute la séance. <b>Sécurité</b> : pied entier, silence, descente en arrière, gainage. <b>Plan</b> : la séance annoncée a-t-elle été suivie (ou modifiée avec une raison) ?'],
 plan:()=>['Écris ton plan <b>avant</b> de commencer : réglage de départ de chaque série (à partir de tes séances 5 et 6) et ce que tu fais si tu sors de ta zone.'],
 analyse:()=>['<b>Constat chiffré</b> : combien de mesures dans ta zone, combien d’arrêts. <b>Cause</b> : pourquoi (réglage, fatigue, mémoire des pas…). <b>Régulation</b> : ce que tu as changé pendant la séance, ou ce que tu changerais.'],
 afl1:()=>['Calcul automatique de « produire » (/8) : zone /3 (mesures dans ta zone) + continuité /2 (arrêts) + sécurité /2 et respect du plan /1 (jugés par le coach). L’analyse (/4) est notée par le prof.'],
 situe:()=>['<b>AFL2 · s’entraîner</b> : 1 copieur-colleur (carnet incomplet) · 2 zappeur (décisions sans lien avec les données) · 3 sensitif (décisions appuyées sur la FC ou le ressenti) · 4 concepteur (chaque séance influence la suivante).','<b>AFL3 · coacher</b> : 1 absent · 2 intermittent · 3 disponible (relevés fiables) · 4 incitatif (conseils reliant FC, zone et réglage).'],
 bilan:()=>['<b>Défis (S3 à S7)</b> : tes points Juste Pouls et Pile dans la cible s’ajoutent au score du binôme ; les badges apparaissent sur la page du binôme.','<b>Le coach a vu</b> : ton coach coche ce que tu as bien fait, puis écrit une réussite et un conseil. Des idées de conseils apparaissent selon tes mesures.','<b>Pronostic du coach</b> : avant la 1re mesure, le coach écrit la FC qu’il prévoit. Un bon coach se trompe de moins de 5 %.','<b>Le conseil m’a aidé</b> : c’est toi, le pratiquant, qui juges ton coach.','<b>Charge</b> = effort ressenti × durée (UA).','<b>La prochaine fois</b> : une seule décision précise, si possible chiffrée (« +1 propulsion »).']
};
function helpBox(key,b,s){const f=HELP[key];if(!f)return '';const L=f(b,s);
  return `<details class="help"><summary>ⓘ consigne</summary><div>${L.map(x=>'<p>'+x+'</p>').join('')}</div></details>`}
function withHelp(html,key,b,s){const h=helpBox(key,b,s);if(!h)return html;const i=html.indexOf('</h3>');return i<0?html:html.slice(0,i+5)+h+html.slice(i+5)}

/* ---------- carte « Mes repères du jour » ---------- */
function repCard(s,run,d){const z=zonesOf(run);const f=filOf(run);const i=SESS.findIndex(x=>x.id===s.id);
  if(!z)return `<section class="card obj"><h3>🎯 Mes repères du jour</h3><p>${i<2?'Aujourd’hui tu relèves ta <b>FC de repos</b> et tes premières FC d’effort. Tes zones seront calculées dès que ton âge et ta FC de repos sont connus.':'⚠ Il manque '+(fcMax(run)==null?'ton âge':'ta FC de repos')+' : ouvre « Mes zones » pour le compléter.'}</p></section>`;
  const zA=`<b>${z.A[0]} à ${z.A[1]}</b>`,zB=`<b>${z.B[0]} à ${z.B[1]}</b>`;
  return `<section class="card obj"><h3>🎯 Mes repères du jour</h3><ul class="objl">
   <li><span>FC de repos · FC max · FC de réserve</span><b>${z.rep} · ${z.max} · ${z.fcr}</b></li>
   ${f?`<li><span>Ma filière ${esc(FIL[f].nom)}</span><b>zone ${z[f][0]} à ${z[f][1]} /min</b></li><li><span>Ressenti visé · parole</span><b>${FIL[f].rpe} · ${FIL[f].parole}</b></li>`
     :`<li><span>Zone A · bref et intense (80-95 %)</span>${zA}</li><li><span>Zone B · long et modéré (55-70 %)</span>${zB}</li>`}
   ${i>=4?(()=>{const p=prevDecision(run,s.id);return p?`<li><span>Ma décision de la dernière fois</span><b>${esc(p)}</b></li>`:''})():''}</ul></section>`}
function prevDecision(run,sid){const i=SESS.findIndex(s=>s.id===sid);for(let k=i-1;k>=0;k--){const d=run.seances&&run.seances[SESS[k].id];const x=d&&d.bl&&(d.bl.dc||d.bl.nx);if(x)return (d.bl.dc?DEC_TXT[d.bl.dc]||d.bl.dc:'')+(d.bl.dc&&d.bl.nx?' · ':'')+(d.bl.nx||'')}return ''}
{{pres}}
function sessView(){
  const b=curBin(),s=SBY[V.sid],ri=V.ri||0,run=b.runners[ri],d=sd(run,s.id);
  const [t,n]=tenus(s.id,d,run);const co=coachOf(b,ri,s.id);
  const head=`<section class="lanehead sess s"><span class="ln">${s.n}</span><div><b>${esc(s.t)}</b><span><strong>Je réussis si</strong> ${esc(s.goal)}</span></div></section>${presView(b,s.id)}
  <div class="seg big">${b.runners.map((r,i)=>{const st=(r.seances&&r.seances[s.id]||{}).st;return `<button class="chip ${i===ri?'on':''}" data-ri="${i}">${esc(r.prenom)} ${st?'('+ST_TXT[st]+')':'pratique'}</button>`}).join('')}</div>`;
  const qrBtn='<button class="btn pri big full" data-act="qr">Fin de séance : afficher le QR pour le prof</button>';
  if(d.st==='abs')return head+`<section class="card"><h3>${esc(run.prenom)} est absent(e) à cette séance</h3><p class="muted">Rien à remplir. Le QR de fin de séance le signale au prof.</p></section>`+qrBtn;
  if(d.st==='bl')return head+`<section class="card"><h3>${esc(run.prenom)} ne pratique pas aujourd’hui</h3><p class="muted">Blessé ou dispensé : je tiens un rôle et je remplis mon bilan de rôle.</p>
   <label>Ce qui m’empêche de pratiquer ${txt('mot',d)}</label><p class="small"><b>✎ Mon rôle aujourd’hui</b></p>${segv('bl.role',d,[['coach','coach supplémentaire'],['chrono','chrono et sono'],['secu','observateur sécurité'],['oxy','oxymètres']])}
   <label>✎ Ce que j’ai observé / ce que j’ai bien fait dans mon rôle ${txt('bl.nx',d)}</label></section>`+qrBtn;
  return head+`<div class="coachline ${co.need?'warn':''}"><span>Coach : <b>${co.n?esc(co.n):'à choisir'}</b>${co.rep?` <span class="tag">remplaçant · ${esc(WHY_TXT[co.why]||'')}</span>`:''}</span>
   <button class="btn sm danger" data-act="chcoach">⚠ ${co.rep?'Modifier le coach':'Changer de coach (exceptionnel)'}</button></div>
  ${co.need?'<p class="warn small center">Ton binôme est absent : choisis un coach remplaçant.</p>':''}
  ${d.ad?`<section class="card thin adapt"><p><b>Pratique adaptée</b> (avis médical, genou, dos, reprise) : step sans réhausse ou au sol, aucun saut, filière B. Tolérance de 6 pulsations autour de la zone.</p></section>`:''}
  ${repCard(s,run,d)}
  ${stepsBar(s,d)}
  ${s.blocks.map(bl=>{const B=bk(bl);return stepWrap(withHelp(blockView(B,s,run,d),B[0],B,s),B,s,d)}).join('')}
  ${stepWrap(withHelp(bilanView(s,run,d,t,n),'bilan',[],s),['bilan'],s,d)}`+qrBtn;
}
/* ---------- séance découpée en étapes ---------- */
const RESULT=['afl1'];
const STEP_KEY={fcr:'fcr',coord:'co',tri:'tri',vise:'vs',zcalc:'zc',cur:'cu',essai:'es',choix:'ch',warm:'wc',perso:'ps',regl:'rg',fil:'fl',obs:'ob',plan:'pl',analyse:'an',situe:'situe'};
{{filled}}
function stepDone(B,d){const [ty,a1]=B;
  if(ty==='bilan')return filled(getPath(d,'bl.rpe'))&&(filled(getPath(d,'bl.reu'))||filled(getPath(d,'bl.nx')));
  if(ty==='bloc')return filled(d['b'+a1]);if(ty==='mes')return filled(d[a1]);if(ty==='fil')return filled(getPath(d,'fl.m'));
  return filled(getPath(d,STEP_KEY[ty]||ty))}
function stepList(s){return s.blocks.map(bk).filter(B=>!RESULT.includes(B[0])).concat([['bilan']])}
{{steps}}
{{coachmodal}}

/* ---------- champs de saisie : pas à pas (+/−) ---------- */
{{inputs}}
const CHK={fc:x=>x!=null&&(x<45||x>230)?'FC entre 45 et 230 /min : recommence la mesure.':'',rep:x=>x!=null&&(x<40||x>110)?'FC de repos inhabituelle (40 à 110) : refais-la au calme.':''};
const zbadge=(fc,z,f)=>{if(fc==null||!z)return '';const h=hors(fc,z);if(h===0)return '<span class="ok">✓ dans ta zone</span>';
  return h<0?`<span class="ko">sous ta zone (${h})</span> <span class="small muted">→ +1 curseur${f?' ('+FIL[f].prio+')':''}</span>`:`<span class="ko">au-dessus (+${h})</span> <span class="small muted">→ −1 curseur</span>`};
function curRow(path,d,lab){return `<div class="crow">${lab?`<b class="sl">${lab}</b>`:''}${CURS.map(c=>{const v=getPath(d,path+'.'+c[0]);return `<span class="cgrp"><i>${c[0]}</i>${[0,1,2].map(k=>`<button class="chip sm ${String(v)===String(k)?'on':''}" data-set="${path}.${c[0]}" data-v="${k}" title="${esc(c[1]+' : '+c[2][k])}">${k}</button>`).join('')}</span>`}).join('')}<span class="ctot">= <b>${regTot(getPath(d,path))??'–'}</b></span></div>`}
const isDefi=sid=>DEFI_S.includes(sid);
function anStp(path,d,z){const mid=z?R((z[0]+z[1])/2):140;return `<label class="anl">🎯 Annonce ${stp(path,d,{step:2,min:40,max:230,start:mid,chk:CHK.fc})}</label>`}
const jpBadge=(an,fc)=>{const p=jpPts(an,fc);return p==null?'':`<span class="pts ${p?'ok':'muted'}">Juste Pouls +${p}</span>`};
const ciBadge=(fc,z)=>{const p=ciblePts(fc,z);return p==null?'':`<span class="pts ${p?'ok':'muted'}">Cible +${p}</span>`};
function fcStp(path,d,z){const mid=z?R((z[0]+z[1])/2):130;return stp(path,d,{step:2,min:40,max:230,start:mid,chk:CHK.fc})}
const rpeMini=(path,d)=>`<span class="rmini">${[0,2,3,4,5,6,7,8,9,10].map(k=>`<button class="chip sm r${k} ${String(getPath(d,path))===String(k)?'on':''}" data-set="${path}" data-v="${k}">${k}</button>`).join('')}</span>`;
function blockView(b,s,run,d){
  const [ty,a1,a2,a3]=b;const z=zonesOf(run);const f=filOf(run);
  if(ty==='fcr'){const m=(getPath(d,'fcr.m')||[]);return `<section class="card"><h3>Ma FC de repos ${who('R')}</h3>
    <label>Provisoire, en classe (assis, 3 min de calme) ${stp('fcr.pv',d,{step:1,min:40,max:120,start:72,chk:CHK.rep})}</label>
    <p class="small"><b>À la maison, 3 matins au réveil</b> (à remplir dès que tu les as)</p>
    <div class="reps">${[0,1,2].map(i=>`<div class="rep col"><span>Matin ${i+1}</span>${stp('fcr.m.'+i,d,{step:1,min:40,max:110,start:num(getPath(d,'fcr.pv'))||68,chk:CHK.rep})}</div>`).join('')}</div>
    <div class="outs">${out('FC de repos retenue',fcRepos(run)!=null?R(fcRepos(run))+' /min':'–','hi')}${out('FC max (âge '+(run.age||'?')+')',fcMax(run)??'–')}</div></section>`}
  if(ty==='mes'){const L=a3;const zz=a1==='lg'?zoneFor(run,'B'):null;const vals=(d[a1]||[]).map(x=>num(x&&x.fc));
    const rows=L.map((r,i)=>{const fcv=num(getPath(d,a1+'.'+i+'.fc'));const an=a1==='lg'?anStp(a1+'.'+i+'.an',d,zz):'';return `<div class="srow"><b class="sl">${esc(r[0])}</b>${a1==='lv'?`<span class="pill">${esc(r[1])}</span>`:''}${an}<label>FC lue ${fcStp(a1+'.'+i+'.fc',d,zz)}</label>${a1==='lg'?jpBadge(num(getPath(d,a1+'.'+i+'.an')),fcv):''}<label class="f1">Ressenti ${rpeMini(a1+'.'+i+'.rp',d)}</label>${zz?zbadge(fcv,zz,'B'):''}</div>`}).join('');
    let res='';if(a1==='m1'&&vals[0]!=null&&vals[1]!=null)res=out('Écart entre les 2 efforts',(vals[1]-vals[0]>=0?'+':'')+(vals[1]-vals[0])+' /min '+(vals[1]>vals[0]?'✓':'✗'),'hi');
    if(a1==='lv'&&vals.filter(x=>x!=null).length>=2){const g2=vals[1]!=null&&vals[0]!=null?vals[1]-vals[0]:null,g3=vals[2]!=null&&vals[1]!=null?vals[2]-vals[1]:null;
      res=out('Propulsion seule',g2==null?'–':(g2>=0?'+':'')+g2+' /min')+out('Réhausse + bras en plus',g3==null?'–':(g3>=0?'+':'')+g3+' /min')+out('Levier le plus efficace',g2!=null&&g3!=null?(g2>=g3?'la propulsion':'la réhausse et les bras'):'–','hi')}
    if(a1==='lg'){const ar=num(getPath(d,'lgar'));res+=out('Arrêts (hors mesure)',ar==null?'–':ar+(ar===0?' · badge Endurant ✓':''))}
    return `<section class="card"><h3>${esc(a2)} ${who('C')}</h3>${rows}${a1==='lg'?`<label>Arrêts sur les 12 min (hors mesure) ${stp('lgar',d,{min:0,max:10,start:0})}</label>`:''}<div class="outs">${res}</div></section>`}
  if(ty==='bloc'){const k='b'+a1;const x=d[k]||{};const en=num(x.en),er=num(x.er);const ok=en!=null?en>=4&&(er==null||er<=2):null;const df=x.df||[];
    return `<section class="card"><h3>Bloc ${a1} ${who('C')}</h3><p class="small">${BLOC[a1].map(esc).join(' · ')}</p>
     <div class="row wrap"><label>Blocs enchaînés sans arrêt ${stp(k+'.en',d,{min:0,max:12,start:2})}</label><label>Erreurs de pas ${stp(k+'.er',d,{min:0,max:20,start:0})}</label></div>
     <p class="small"><b>Pas encore difficiles</b> (touche-les)</p><div class="seg">${BLOC[a1].map(p=>`<button class="chip sm ${df.includes(p)?'on':''}" data-tog="${k}.df" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div>
     <div class="outs">${out('Bloc '+a1,ok==null?'–':ok?'✓ réussi':'✗ à revoir','hi')}</div></section>`}
  if(ty==='zcalc'){const zc=d.zc||{};const show=zc.vu==='1';
    const fields=[['mx','FC max',z&&z.max],['fr','FC de réserve',z&&z.fcr],['a0','Zone A : bas',z&&z.A[0]],['a1','Zone A : haut',z&&z.A[1]],['b0','Zone B : bas',z&&z.B[0]],['b1','Zone B : haut',z&&z.B[1]]];
    return `<section class="card"><h3>Je calcule mes zones ${who('R')}</h3>${!z?'<p class="warn small">Il manque ton âge ou ta FC de repos (« Mes zones »).</p>':''}
     <div class="reps">${fields.map(q=>{const v=num(zc[q[0]]);const good=show&&q[2]!=null&&v!=null?Math.abs(v-q[2])<=2:null;return `<div class="rep col"><span>${q[1]} ${good==null?'':good?'<span class="ok">✓</span>':'<span class="ko">✗ '+q[2]+'</span>'}</span>${stp('zc.'+q[0],d,{step:1,min:40,max:230,start:q[0]==='fr'?130:150})}</div>`}).join('')}</div>
     ${z?(show?`<p class="small">Corrigé : FC max ${z.max} · FCR ${z.fcr} · zone A ${z.A[0]}-${z.A[1]} · zone B ${z.B[0]}-${z.B[1]}.</p>`:`<button class="btn pri" data-set="zc.vu" data-v="1">Vérifier mes calculs</button>`):''}</section>`}
  if(ty==='cur'){const lo=num(getPath(d,'cu.lo.fc')),hi=num(getPath(d,'cu.hi.fc'));
    return `<section class="card"><h3>Les curseurs : basse / haute ${who('C')}</h3>
     ${curRow('cu.lo.r',d,'Version basse')}${anStp('cu.lo.an',d,null)}<label>FC lue ${fcStp('cu.lo.fc',d,null)}</label>${jpBadge(num(getPath(d,'cu.lo.an')),lo)}
     ${curRow('cu.hi.r',d,'Version haute')}${anStp('cu.hi.an',d,null)}<label>FC lue ${fcStp('cu.hi.fc',d,null)}</label>${jpBadge(num(getPath(d,'cu.hi.an')),hi)}
     <div class="outs">${out('Écart',lo!=null&&hi!=null?(hi-lo>=0?'+':'')+(hi-lo)+' /min '+(hi-lo>=20?'✓':'✗'):'–','hi')}</div></section>`}
  if(ty==='essai'){const ef=getPath(d,'es.f');const zz=zoneFor(run,ef);const M=ef?mesures(ef,'s4'):[];
    return `<section class="card"><h3>Essai de filière : 10 min ${who('C')}</h3>${segv('es.f',d,[['A','A · bref et intense'],['B','B · long et modéré']])}
     ${ef?`<p class="small">${FMT_TXT(ef,'s4')} · zone ${zz?zz[0]+' à '+zz[1]:'?'} /min</p>${M.map((m,i)=>{const v=num(getPath(d,'es.m.'+i+'.fc'));return `<div class="srow"><b class="sl">${esc(m[0])}</b>${anStp('es.m.'+i+'.an',d,zz)}<label>FC lue ${fcStp('es.m.'+i+'.fc',d,zz)}</label>${zbadge(v,zz,ef)}${jpBadge(num(getPath(d,'es.m.'+i+'.an')),v)}</div>`}).join('')}`:'<p class="muted small">Choisis la filière essayée.</p>'}</section>`}
  if(ty==='choix')return `<section class="card"><h3>Ma filière ${who('R')}</h3>${segv('ch.f',d,[['A','A · bref et intense'],['B','B · long et modéré']])}
     ${getPath(d,'ch.f')&&z?`<p class="small">Ma zone : <b>${z[getPath(d,'ch.f')][0]} à ${z[getPath(d,'ch.f')][1]} /min</b> · ${FIL[getPath(d,'ch.f')].but}.</p>`:''}
     <label>Un ressenti ${txt('ch.a1',d,'ex. en B je tiens sans m’arrêter')}</label><label>Un chiffre ${txt('ch.a2',d,'ex. 2 mesures sur 3 dans la zone A')}</label><label>Un projet ${txt('ch.a3',d,'ex. préparer le cross')}</label>
     <p class="small"><b>Ma répartition AFL2 / AFL3</b></p>${segv('ch.rep',d,[['6/2','6 / 2'],['4/4','4 / 4'],['2/6','2 / 6']])}</section>`;
  if(ty==='warm'){const wc=d.wc||[];const nb=[].concat(...WARM_EX).filter(x=>wc.includes(x[0])).length;
    return `<section class="card"><h3>Mon échauffement ${who('C')}</h3><p class="muted small">${s.eval?'Seul, sans fiche : le coach coche ce que tu fais.':'Le coach coche ce que tu fais.'}</p>
     ${WARM_EX.map((L,p)=>`<p class="small"><b>${['Phase 1 · au sol','Phase 2 · sur le step','Phase 3 · les 3 blocs en version basse','Phase 4 · ma filière'][p]}</b></p><div class="seg wc">${L.map(x=>`<button class="chip sm ${wc.includes(x[0])?'on':''}" data-tog="wc" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>`).join('')}
     <div class="outs">${out('Critères',nb+' / 9 '+(nb>=7?'✓ prêt':nb>=5?'· refais la phase manquante':''),'hi')}</div></section>`}
  if(ty==='perso')return `<section class="card"><h3>Ma version personnelle des blocs ${who('R')}</h3>${f?`<p class="small">Filière ${esc(FIL[f].nom)} : ${FIL[f].prio} d’abord.</p>`:'<p class="warn small">Choisis d’abord ta filière (S4).</p>'}
     ${[1,2,3].map(i=>`${curRow('ps.b'+i,d,'Bloc '+i)}<label class="small">Pas remplacés (2 au plus) <input class="in" data-p="ps.b${i}.r" value="${esc(getPath(d,'ps.b'+i+'.r')||'')}" placeholder="ex. talons à la place de genou G"></label>`).join('')}</section>`;
  if(ty==='regl'){const zz=zoneFor(run,f);const f1=num(getPath(d,'rg.1.fc')),f2=num(getPath(d,'rg.2.fc'));const h1=hors(f1,zz);
    return `<section class="card"><h3>Régler mon curseur : 2 × 2 min ${who('C')}</h3>
     ${curRow('rg.1.r',d,'Essai 1')}${anStp('rg.1.an',d,zz)}<label>FC lue ${fcStp('rg.1.fc',d,zz)}</label> ${zbadge(f1,zz,f)} ${jpBadge(num(getPath(d,'rg.1.an')),f1)}
     ${h1!=null?`<p class="small"><b>Décision :</b> ${h1<0?'+1 curseur':h1>0?'−1 curseur':'je garde ce réglage'}</p>`:''}
     ${curRow('rg.2.r',d,'Essai 2')}${anStp('rg.2.an',d,zz)}<label>FC lue ${fcStp('rg.2.fc',d,zz)}</label> ${zbadge(f2,zz,f)} ${jpBadge(num(getPath(d,'rg.2.an')),f2)}</section>`}
  if(ty==='fil'){if(!f)return `<section class="card"><h3>Ma séance de filière</h3><p class="warn">Choisis ta filière (S4) avant de commencer.</p>${segv('pl.f',d,[['A','A'],['B','B']])}</section>`;
    const zz=zoneFor(run,f);const M=mesures(f,a1);const F=FMT[a1][f];const [tt,nn]=[M.filter((m,i)=>inZ(num(getPath(d,'fl.m.'+i+'.fc')),zz)).length,M.filter((m,i)=>num(getPath(d,'fl.m.'+i+'.fc'))!=null).length];
    const pr=num(getPath(d,'bl.pr')),f0=num(getPath(d,'fl.m.0.fc'));
    return `<section class="card"><h3>Séance ${esc(FIL[f].nom)} · ${FMT_TXT(f,a1)} ${who('C')}</h3><p class="small">Zone : <b>${zz?zz[0]+' à '+zz[1]+' /min':'?'}</b> · ressenti visé ${FIL[f].rpe}</p>
     <div class="prono"><p class="small"><b>⏱ Pronostic du coach</b> <span class="muted">(avant la 1re série : la FC que tu prévois à la 1re mesure)</span></p>${stp('bl.pr',d,{step:2,min:60,max:230,start:zz?R((zz[0]+zz[1])/2):150})}
      ${pr!=null&&f0!=null?`<span class="small ${Math.abs(pr-f0)/f0<=0.05?'ok':'muted'}">Écart du pronostic : ${Math.abs(pr-f0)} /min (${R(Math.abs(pr-f0)/f0*100)} %)</span>`:''}</div>
     ${F.e.map((e,si)=>`<div class="sub"><p class="small"><b>Série ${si+1} · ${e} min</b></p>${curRow('fl.s.'+si,d,'Réglage')}
       ${M.map((m,i)=>m[1]!==si?'':(()=>{const v=num(getPath(d,'fl.m.'+i+'.fc'));const dfi=isDefi(s.id);return `<div class="srow"><b class="sl">${esc(m[0].replace(/^Série \d+ · /,''))}</b>${dfi?anStp('fl.m.'+i+'.an',d,zz):''}<label>FC lue ${fcStp('fl.m.'+i+'.fc',d,zz)}</label><label>Arrêts ${stp('fl.m.'+i+'.ar',d,{min:0,max:10,start:0})}</label>${zbadge(v,zz,f)}${dfi?jpBadge(num(getPath(d,'fl.m.'+i+'.an')),v)+ciBadge(v,zz):''}</div>`})()).join('')}</div>`).join('')}
     <div class="outs">${out('Mesures dans ma zone',nn?tt+' / '+nn:'–','hi')}${isDefi(s.id)?(()=>{const sc=scoreSeance(s.id,d,run);return out('Points Juste Pouls',sc.jp)+out('Points Pile dans la cible',sc.ci)})():''}</div></section>`}
  if(ty==='coord')return `<section class="card"><h3>${a1.length>1?'Défis':'Défi'} de coordination ${who('C')}</h3>${a1.map(k=>`<p class="small"><b>${COORD[k][0]}</b> · ${COORD[k][1]}</p>${segv('co.'+k,d,COORD_OPT[k]||[['1','✓ réussi'],['0','pas encore']])}`).join('')}</section>`;
  if(ty==='tri')return `<section class="card"><h3>Les 3 blocs enchaînés seul ${who('C')}</h3><p class="small">Pendant l’échauffement, sans l’enseignant, sans bras ni saut.</p>${segv('tri',d,[['1','✓ réussi : badge Mémoire'],['0','pas encore']])}</section>`;
  if(ty==='vise'){const vf=getPath(d,'vs.f');const zz=zoneFor(run,vf);
    return `<section class="card"><h3>Viser le milieu de ma zone : 2 × 3 min ${who('C')}</h3>${segv('vs.f',d,[['A','zone A'],['B','zone B']])}${zz?`<p class="small">Milieu visé : <b>${R((zz[0]+zz[1])/2)} /min</b> (zone ${zz[0]} à ${zz[1]})</p>`:''}
     ${[1,2].map(i=>{const v=num(getPath(d,'vs.'+i+'.fc'));return `${curRow('vs.'+i+'.r',d,'Essai '+i)}${anStp('vs.'+i+'.an',d,zz)}<label>FC lue ${fcStp('vs.'+i+'.fc',d,zz)}</label> ${zbadge(v,zz,vf)} ${jpBadge(num(getPath(d,'vs.'+i+'.an')),v)}`}).join('')}</section>`}
  if(ty==='obs')return `<section class="card"><h3>Le coach juge ${who('C')}</h3><p class="small"><b>Sécurité et qualité d’exécution</b></p>
     ${segv('ob.sec',d,[['2','pied entier, silence, gainage tout du long'],['1.5','quelques fautes en fin de série'],['0.5','pied souvent mal posé, bruit'],['0','mise en danger']])}
     <p class="small"><b>Séance annoncée</b></p>${segv('ob.pl',d,[['1','suivie (ou modifiée avec une raison)'],['0.5','suivie en partie'],['0','pas suivie']])}</section>`;
  if(ty==='plan'){const ff=f||getPath(d,'pl.f');const F=ff?FMT.eval[ff]:null;
    return `<section class="card"><h3>Mon plan de séance ${who('R')}</h3>${f?'':segv('pl.f',d,[['A','A'],['B','B']])}${ff?`<p class="small">${esc(FIL[ff].nom)} · ${FMT_TXT(ff,'eval')} · zone ${z?z[ff][0]+' à '+z[ff][1]:'?'} /min</p>
     <div class="reps">${F.e.map((e,i)=>`<div class="rep col"><span>Série ${i+1} · réglage</span>${stp('pl.r.'+i,d,{min:0,max:8,start:ff==='A'?5:2})}</div>`).join('')}</div>
     <label>Si je sors de ma zone, je… <input class="in" data-p="pl.si" value="${esc(getPath(d,'pl.si')||'')}" placeholder="ex. +1 propulsion si je suis dessous"></label>`:''}</section>`}
  if(ty==='analyse'){const M=(d.fl&&d.fl.m)||[];const zz=zoneFor(run,f);const nz=M.filter(x=>inZ(num(x&&x.fc),zz)).length,nm=M.filter(x=>num(x&&x.fc)!=null).length,ar=M.reduce((a,x)=>a+(num(x&&x.ar)||0),0);
    return `<section class="card"><h3>J’analyse ma séance ${who('R')}</h3><div class="outs">${out('Mesures dans ma zone',nm?nz+' / '+nm:'–','hi')}${out('Arrêts',ar)}</div>
     <label>Constat chiffré ${txt('an.c',d,'ex. 3 mesures sur 4 dans ma zone, 1 arrêt')}</label><label>Cause ${txt('an.k',d,'ex. série 1 sous la zone : réglage trop bas')}</label><label>Régulation ${txt('an.r',d,'ex. j’ai ajouté la propulsion en série 2')}</label></section>`}
  if(ty==='afl1'){const a=afl1(run,d);
    return `<section class="card"><h3>Ma note « produire » (AFL1)</h3>${a?`<div class="outs">${out('Zone /3',a.zn+' ('+a.dz+'/'+a.nm+')')}${out('Continuité /2',String(a.co).replace('.',',')+' ('+a.arr+' arrêt'+(a.arr>1?'s':'')+')')}${out('Sécurité /2',a.sec==null?'?':String(a.sec).replace('.',','))}${out('Plan /1',a.pl==null?'?':String(a.pl).replace('.',','))}${out('Produire /8',String(a.prod).replace('.',',')+(a.complet?'':' (incomplet)'),'hi')}</div><p class="muted small">L’analyse (/4) est notée par le prof.</p>`:'<p class="muted">Remplis la séance de filière.</p>'}</section>`}
  if(ty==='situe')return `<section class="card"><h3>Je me situe ${who('R')}</h3>
     <p class="small"><b>AFL2 · S’entraîner</b></p>${segv('situe.a2',d,[[1,'1 · copieur-colleur'],[2,'2 · zappeur'],[3,'3 · sensitif'],[4,'4 · concepteur']])}
     <p class="small"><b>AFL3 · Coacher</b></p>${segv('situe.a3',d,[[1,'1 · absent'],[2,'2 · intermittent'],[3,'3 · disponible'],[4,'4 · incitatif']])}</section>`;
  return '';
}
/* ---------- conseils suggérés au coach ---------- */
function suggest(s,run,d){const L=[];const f=filOf(run);const z=zoneFor(run,f);
  s.blocks.forEach(b=>{const [ty,a1]=bk(b);
    if(ty==='fil'&&z){const M=((d.fl&&d.fl.m)||[]).map(x=>num(x&&x.fc)).filter(x=>x!=null);if(M.length){const lo=M.filter(x=>x<z[0]).length,hi=M.filter(x=>x>z[1]).length;
      if(lo>M.length/2)L.push(`Tu es sous ta zone (${z[0]}-${z[1]}) : ajoute 1 curseur, d’abord ${f==='A'?'la propulsion':'l’amplitude'}.`);else if(hi>M.length/2)L.push(`Tu es au-dessus de ta zone : enlève 1 curseur${f==='B'?', d’abord les sauts':''}.`);else L.push('Tes FC sont dans ta zone : garde ce réglage.')}
      const ar=((d.fl&&d.fl.m)||[]).reduce((a,x)=>a+(num(x&&x.ar)||0),0);if(ar>=2)L.push(`${ar} arrêts : simplifie le pas qui te bloque plutôt que de t’arrêter.`)}
    if(ty==='bloc'){const x=d['b'+a1]||{};if((x.df||[]).length)L.push(`Révise au ralenti : ${x.df.slice(0,2).join(', ')}.`);if(num(x.en)!=null&&num(x.en)<4)L.push('Annonce-toi le pas suivant sur les 4 derniers temps.')}
    if(ty==='mes'&&a1==='lv'){const v=(d.lv||[]).map(x=>num(x&&x.fc));if(v[0]!=null&&v[1]!=null&&v[2]!=null)L.push((v[1]-v[0])>=(v[2]-v[1])?'La propulsion est ton meilleur levier : retiens-le pour ta filière.':'La réhausse et les bras te font monter : retiens-le pour ta filière.')}
    if(ty==='regl'&&z){const f2=num(getPath(d,'rg.2.fc'));if(f2!=null)L.push(inZ(f2,z)?'Ton 2e réglage est le bon : pars de là à la séance de filière.':'Encore hors zone : change encore 1 curseur avant la série 1.')}
    if(ty==='warm'){const n=(d.wc||[]).length;if(n&&n<7)L.push('Échauffement incomplet : passe par les 3 blocs en version basse.')}
  });return [...new Set(L)].slice(0,4)}
const DEC_TXT={'+H':'+1 hauteur','+B':'+1 bras','+P':'+1 propulsion','+A':'+1 amplitude','-H':'−1 hauteur','-B':'−1 bras','-P':'−1 propulsion','-A':'−1 amplitude','=':'je garde mon réglage'};
function bilanView(s,run,d,t,n){
  const cr=getPath(d,'bl.cr')||[];const sg=suggest(s,run,d);const con=getPath(d,'bl.con')||'';const i=SESS.findIndex(x=>x.id===s.id);
  return `<section class="card bilan"><h3>Bilan</h3>
   <p class="small"><b>⏱ Le coach a vu</b></p><div class="checks">${s.crit.map((c,k)=>`<button class="chk ${cr[k]?'on':''}" data-set="bl.cr.${k}" data-v="${cr[k]?'':'1'}">${cr[k]?'☑':'☐'} ${esc(c)}</button>`).join('')}</div>
   <div class="row wrap"><label class="f1">⏱ Ta réussite ${txt('bl.reu',d)}</label><label class="f1">⏱ Ton conseil ${txt('bl.con',d)}</label></div>
   ${sg.length?`<p class="small"><b>💡 Idées de conseils</b> <span class="muted">(d’après les mesures · touche pour ajouter)</span></p><div class="sugg">${sg.map(x=>`<button class="chip sg ${con.includes(x)?'on':''}" data-sugg="${esc(x)}">＋ ${esc(x)}</button>`).join('')}</div>`:''}
   <p class="small"><b>✎ Le conseil de mon coach m’a aidé</b></p>${segv('bl.aide',d,[['1','oui'],['0','non']])}
   <p class="small"><b>✎ Effort ressenti sur la séance</b> <span class="muted">(0 repos … 10 maximal)</span></p>
   <div class="rpe">${[0,1,2,3,4,5,6,7,8,9,10].map(k=>`<button class="chip sm r${k} ${String(getPath(d,'bl.rpe'))===String(k)?'on':''}" data-set="bl.rpe" data-v="${k}">${k}</button>`).join('')}</div>
   <p class="small rpel">${getPath(d,'bl.rpe')!=null&&getPath(d,'bl.rpe')!==''?RPE_TXT[+getPath(d,'bl.rpe')]:'Touche le chiffre qui correspond à ton effort.'}</p>
   <div class="row wrap"><label>✎ Durée de pratique (min) ${stp('bl.du',d,{step:5,min:10,max:90,start:55})}</label>${out('Charge de la séance',chargeOf(d)!=null?chargeOf(d)+' UA':'–')}</div>
   <div class="outs">${out('Réussites aujourd’hui',n?t+' / '+n:'–','hi')}${isDefi(s.id)?(()=>{const sc=scoreSeance(s.id,d,run);return out('Points défis du jour',sc.tot+' (Juste Pouls '+sc.jp+(sc.ci?' · cible '+sc.ci:'')+')')})():''}</div>
   ${i>=3?`<p class="small"><b>✎ Ma décision pour la prochaine fois</b></p><div class="seg">${Object.entries(DEC_TXT).map(([k,v])=>`<button class="chip sm ${getPath(d,'bl.dc')===k?'on':''}" data-set="bl.dc" data-v="${k}">${v}</button>`).join('')}</div>`:''}
   <label>✎ La prochaine fois, je… ${txt('bl.nx',d)}</label></section>`;
}
{{rpe}}

/* ---------- chrono des filières (une seule musique, A et B ensemble) ---------- */
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
const CHRONO_CLE='carnet-step-chrono';
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
{{say}}

/* ---------- mes zones & progression ---------- */
function zonesView(){const b=curBin();
  return `<section class="card"><h2>Mes zones</h2><p class="muted small">Karvonen : zone = FC de repos + FC de réserve × %. FC max = 220 − âge (garçon) ou 226 − âge (fille). C’est une estimation : ton ressenti et le test de la parole restent tes repères.</p>
  <div class="grid2">${b.runners.map((r,ri)=>{const z=zonesOf(r);const f=filOf(r);
   return `<div class="sub"><h3>${esc(r.prenom)}${f?' · filière '+f:''}</h3><table class="tt l"><tr><th>Âge · sexe</th><td>${esc(r.age||'?')} ans · ${r.sexe==='F'?'fille':'garçon'}</td></tr><tr><th>FC de repos</th><td>${fcRepos(r)!=null?R(fcRepos(r)):'à mesurer (S1)'}</td></tr>
    ${z?`<tr><th>FC max · FC de réserve</th><td>${z.max} · ${z.fcr}</td></tr><tr><th>Zone A (80-95 %)</th><td><b>${z.A[0]} à ${z.A[1]}</b></td></tr><tr><th>Zone B (55-70 %)</th><td><b>${z.B[0]} à ${z.B[1]}</b></td></tr>`:''}</table>
    <label class="small">FC de repos donnée par le prof (si pas de mesure) <input class="in w" data-fm="${ri}" inputmode="numeric" value="${esc(r.fcrM||'')}"></label>
    <p class="small">Âge</p><div class="seg">${[14,15,16,17,18].map(a=>`<button class="chip sm ${String(r.age)===String(a)?'on':''}" data-age="${ri}|${a}">${a}</button>`).join('')}</div></div>`}).join('')}</div><button class="btn full" data-go="bin">← Retour au binôme</button></section>`}
{{charts}}
function progView(){const b=curBin();
  return `<section class="card"><h2>Ma progression</h2>${b.runners.map(r=>{let TT=0,NN=0;const pct=[],fm=[],lo=[],hi=[],chg=[],ec=[];const z=zoneFor(r,filOf(r));
   const rows=SESS.map(s=>{const d=r.seances&&r.seances[s.id];const [t,n]=tenR(r,s.id);TT+=t;NN+=n;pct.push(n?t/n:null);
     const M=d?[].concat(((d.fl&&d.fl.m)||[]),((d.es&&d.es.m)||[]),(d.lg||[]),(d.rg?[d.rg[2]]:[])).map(x=>num(x&&x.fc)).filter(x=>x!=null):[];const m=M.length?R(M.reduce((a,x)=>a+x,0)/M.length):null;
     fm.push(m);lo.push(z?z[0]:null);hi.push(z?z[1]:null);chg.push(chargeOf(d||{}));const e=ecartOf(s.id,d,r);ec.push(e==null?null:R(e));
     return `<tr><th>${s.n}</th><td>${m??'–'}</td><td>${n?t+'/'+n:'–'}</td><td>${d&&d.bl&&d.bl.rpe!=null?esc(d.bl.rpe):'–'}</td><td class="l small">${esc(d&&d.bl&&(DEC_TXT[d.bl.dc]||d.bl.nx)||'')}</td></tr>`}).join('');
   const dg=degreeOf(TT,NN);const lab=SESS.map(s=>s.n);
   const ch=lineChart(lab,[{n:'FC moyenne mesurée',v:fm,c:'#0d9488'}].concat(z?[{n:'Bas de ma zone',v:lo,c:'#94a3b8',dash:true},{n:'Haut de ma zone',v:hi,c:'#f04e23',dash:true}]:[]),{title:'Mes FC d’effort et ma zone (/min)'})
     +lineChart(lab,[{n:'Écart moyen à ma zone (/min)',v:ec,c:'#c2412d'}],{title:'Mon écart à la zone : plus il baisse, mieux je règle ma charge'})+barTenus(lab,pct)+lineChart(lab,[{n:'Charge (effort × durée)',v:chg,c:'#64748b'}],{title:'Ma charge de séance (UA)'});
   return `<div class="sub"><h3>${esc(r.prenom)}${filOf(r)?' · filière '+filOf(r):''}</h3>${ch||'<p class="muted small">Les courbes apparaissent après deux séances remplies.</p>'}
    <details class="help"><summary>Tableau des séances</summary><div class="tw"><table class="tt"><tr><th></th><th>FC moy.</th><th>Réussites</th><th>Effort</th><th>Décision</th></tr>${rows}</table></div></details>
    <div class="outs">${out('Réussites sur le cycle',NN?TT+' / '+NN+' ('+R(100*TT/NN)+' %)':'–','hi')}${out('Indicateur AFL2',dg?DEG_TXT[dg]:'–')}</div>
    <p class="small"><b>Mes badges</b></p><div class="seg">${(()=>{const mate=b.runners.find(x=>x!==r);const bg=badgesOf(r,mate);return BADGES.map(x=>`<span class="chip sm ${bg.includes(x[0])?'on':''}" title="${esc(x[2])}">${bg.includes(x[0])?'🏅':'○'} ${x[1]} · <small>${esc(x[2])}</small></span>`).join('')})()}</div></div>`}).join('')}<button class="btn full" data-go="bin">← Retour au binôme</button></section>`}

/* ---------- QR de fin de séance ---------- */
{{qrsvg}}
function qrModal(sid,part){const b=curBin();const s=SBY[sid];const full=qrPayload(b,sid);
  const split=full.length>550;const parts=split?[qrPayload(b,sid,0),qrPayload(b,sid,1)]:[full];const k=Math.min(part||0,parts.length-1);const pl=parts[k];
  b.sent=b.sent||{};b.sent[sid]=Date.now();save();
  modal(`<h2>${s.n} · à montrer au prof${split?' · QR '+(k+1)+'/2':''}</h2><p class="muted small">${split?esc(b.runners[k].prenom)+' · ':esc(b.runners[0].prenom)+' & '+esc(b.runners[1].prenom)+' · '}${esc(b.classe)}</p>
   <div class="qr">${qrSvg(pl)}</div><div class="row wrap center">${split?(k===0?`<button class="btn pri big" data-qrp="1">QR suivant (${esc(b.runners[1].prenom)}) →</button>`:`<button class="btn" data-qrp="0">← QR 1</button>`):''}<button class="btn" data-act="copy">Copier le texte</button><button class="btn" data-act="closem">Fermer</button></div>
   <textarea id="qrtxt" class="in small" rows="2" readonly>${esc(pl)}</textarea>`)}
function catchupPayload(b){const L=SESS.filter(s=>['wip','resend'].includes(sessState(b,s.id)));
  return [L,'SP3'+JSON.stringify({v:1,c:b.classe,b:b.id,r:b.runners.map((r,i)=>({i,p:r.prenom,n:r.nom,x:r.sexe,a:r.age,fr:r.fcrM,se:Object.fromEntries(L.filter(s=>hasData(r.seances&&r.seances[s.id])).map(s=>[s.id,slimSeance(r.seances[s.id])]))}))})]}
function markSent(b,L){b.sent=b.sent||{};L.forEach(s=>b.sent[s.id]=Date.now());save()}
{{anim}}
let PCH={tag:null,n:0,parts:{}};
function profAddAny(raw){raw=String(raw||'').trim();
  if(raw.startsWith('SPP|')){const m=/^SPP\|(\w+)\|(\d+)\/(\d+)\|([\s\S]*)$/.exec(raw);if(!m)throw new Error('Morceau de QR illisible.');if(PCH.tag!==m[1])PCH={tag:m[1],n:+m[3],parts:{}};PCH.parts[+m[2]]=m[4];
    const got=Object.keys(PCH.parts).length;if(got<PCH.n)return {partial:'rattrapage : '+got+' / '+PCH.n+' morceaux'};let s='';for(let i=1;i<=PCH.n;i++)s+=PCH.parts[i];PCH={tag:null,n:0,parts:{}};return profAddAny(s)}
  if(raw.startsWith('SP2R'))throw new Error('QR de restauration : il se scanne sur la tablette de l’élève, pas ici.');
  if(raw.startsWith('DF'))throw new Error('Ce QR vient du carnet de demi-fond, pas du carnet step.');
  if(raw.startsWith('SP3')){const o=JSON.parse(raw.slice(3));const sids=[...new Set([].concat(...o.r.map(r=>Object.keys(r.se||{}))))];
    sids.forEach(sid=>profAddObj({v:1,s:sid,c:o.c,b:o.b,r:o.r.filter(r=>r.se&&r.se[sid]).map(r=>({i:r.i,p:r.p,n:r.n,x:r.x,a:r.a,fr:r.fr,d:r.se[sid]}))}));
    return 'rattrapage '+sids.map(s=>SBY[s].n).join(', ')+' · '+o.r.map(r=>r.p).join(', ')+' ('+o.c+')'}
  return profAddObj(parsePayload(raw))}
/* ---------- restauration d’un binôme sur une tablette ---------- */
let RQ={h:null},RST={tag:null,n:0,parts:{}};
function restoreScanModal(){RST={tag:null,n:0,parts:{}};
  modal(`<h2>↺ Restaurer un binôme</h2><p class="muted small">Tablette effacée ou changée ? Le prof ouvre l’élève dans son mode prof et touche « QR de restauration ». Vise le QR qui défile jusqu’à 100 %.</p>
   <div class="row wrap"><button class="btn pri" data-act="rscan">Démarrer la caméra</button><button class="btn" data-act="closem">Fermer</button></div>
   <video id="vid" playsinline muted></video><canvas id="cv" hidden></canvas><div class="prog"><i id="rbar" style="width:0"></i></div><p id="scanlog" class="small"></p>
   <details><summary class="small">Coller le texte</summary><textarea id="rpaste" class="in" rows="3"></textarea><button class="btn" data-act="rpaste">Restaurer</button></details>`)}
function restoreRaw(raw){raw=decodeUtf8(String(raw||'').trim());const log=$('#scanlog');
  if(raw.startsWith('SP2R'))return restoreDone(raw);
  const m=/^SPP\|(\w+)\|(\d+)\/(\d+)\|([\s\S]*)$/.exec(raw);if(!m){if(log)log.textContent='Ce QR n’est pas un QR de restauration du prof.';return}
  if(RST.tag!==m[1])RST={tag:m[1],n:+m[3],parts:{}};RST.parts[+m[2]]=m[4];const got=Object.keys(RST.parts).length;
  const bar=$('#rbar');if(bar)bar.style.width=R(100*got/RST.n)+'%';if(log)log.textContent=got+' / '+RST.n+' morceaux reçus…';
  if(got===RST.n){let s='';for(let i=1;i<=RST.n;i++)s+=RST.parts[i];restoreDone(s)}}
function restoreDone(str){const log=$('#scanlog');try{const o=JSON.parse(str.slice(4));const msg=mergeRestore(o);stopScan();beep();closeModal();toast(msg);go({v:'bin',bin:o.b,cls:o.c})}catch(e){if(log)log.textContent='Restauration impossible : '+e.message}}
function mergeRestore(o){if(!o||!o.b||!Array.isArray(o.r))throw new Error('QR incomplet');
  let b=DB.binomes.find(x=>x.id===o.b);const created=!b;
  if(!b){b={id:o.b,classe:o.c,runners:[0,1].map(i=>({prenom:'Élève '+(i+1),nom:'?',sexe:'',seances:{},ph:1})),sent:{}};DB.binomes.push(b)}
  let n=0;o.r.forEach(r=>{const run=b.runners[r.i];if(!run)return;if(run.ph){run.prenom=r.p;run.nom=r.n;run.sexe=r.x||'';run.age=r.a;delete run.ph}if(r.fr&&!run.fcrM)run.fcrM=r.fr;
    Object.entries(r.se||{}).forEach(([sid,d])=>{run.seances=run.seances||{};if(!hasData(run.seances[sid])){run.seances[sid]=d;n++;b.sent=b.sent||{};b.sent[sid]=b.sent[sid]||Date.now()}})});
  save();return (created?'Binôme recréé':'Binôme complété')+' : '+n+' séance(s) restaurée(s).'}
