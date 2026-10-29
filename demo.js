/* =====================================================================
   demo.js — Step · appli élève : mode démo (un binôme fictif déjà rempli, en mémoire seulement).
   Ouverture : …/?demo (lien à donner aux collègues), ou « Ouvrir la démo » sur l'accueil.
   ===================================================================== */
'use strict';
function ouvrirDemo(){
  const rnd=demoRnd(20261029),L=SESS,nb=6;
  const N=[['Léa MARTIN',{x:'F',a:15,rep:66,f:'B',pr:.8,dev:5}],['Hugo BERNARD',{x:'G',a:16,rep:58,f:'A',pr:.7,dev:8}]];
  const autres=['Inès DURAND','Tom PETIT','Zoé LEROY','Yanis ROBERT','Chloé MOREAU','Nathan BLANC','Sarah FAURE','Max GIRARD','Nina ROUX'];
  const classe='2nde Démo';
  const g=vide(classe,'S');g.cfg={classe,cy:'S',eleves:N.map(x=>x[0]).concat(autres).sort(),lien:'',k:''};
  g.runners=N.map(([full,p],k)=>({id:uid(),full,prenom:prenomDe(full),nom:nomDe(full),sexe:p.x,age:p.a,fcrM:'',seances:demoRunner(p,rnd,nb,k===0?{chef:'1'}:{})}));
  const jour0=Date.now()-(nb+1)*7*864e5;
  L.slice(0,nb).forEach((s,i)=>{const t=jour0+i*7*864e5;g.dates[s.id]=jour(t);g.mod[s.id]=t;if(i<nb-1)g.sent[s.id]=t+3600e3});
  /* situations à montrer : absence et coach remplaçant, pratique adaptée */
  g.runners[1].seances.s3={st:'abs'};g.runners[0].seances.s3.cx={n:'Tom P.',why:'abs'};g.runners[0].seances.s4.ad='1';
  DEMO=true;G=null;ACTIF=null;CLEF=null;attacher(g);V.sid=L[nb-1].id;V.tab='envoi';
  closeModal();render();window.scrollTo(0,0);toast('Mode démo : explore librement, rien n’est enregistré.');
}
function bandeauDemo(){return `<div class="demo-bandeau"><span>👀 <b>Mode démo</b><i> · binôme fictif, rien n’est enregistré ni envoyé</i></span><a class="btn sm" href="prof/?demo">Voir l’outil prof</a><button class="btn sm" data-act="demoQuitter">Quitter la démo</button></div>`}
function quitterDemoUrl(){try{if(/[?&]demo\b/.test(location.search))history.replaceState(null,'',location.pathname)}catch(e){}}
if(/[?&]demo\b/.test(location.search))ouvrirDemo();else render();
