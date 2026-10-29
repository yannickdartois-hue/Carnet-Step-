/* =====================================================================
   prof-demo.js — mode démo de l'outil prof : une classe fictive déjà remplie (S1 à S8),
   en mémoire seulement : les vraies données de l'appareil ne sont ni lues ni modifiées.
   Ouverture : …/prof/?demo  (lien à donner aux collègues).
   ===================================================================== */
'use strict';
function ouvrirDemoProf(){
  DEMO=true;P=vide();const rnd=demoRnd(20261029),classe='2nde Démo',nb=8;
  /* binômes : [nom, profil] ; profil = {x,a,rep,f,pr,dev} (voir demo-commun.js) */
  const G=[[['Léa MARTIN',{x:'F',a:15,rep:66,f:'B',pr:.8,dev:5}],['Hugo BERNARD',{x:'G',a:16,rep:58,f:'A',pr:.7,dev:8}]],
    [['Inès DURAND',{x:'F',a:15,rep:72,f:'B',pr:.6,dev:9}],['Tom PETIT',{x:'G',a:15,rep:64,f:'B',pr:.75,dev:6}]],
    [['Chloé MOREAU',{x:'F',a:16,rep:60,f:'A',pr:.85,dev:4}],['Yanis ROBERT',{x:'G',a:16,rep:62,f:'A',pr:.5,dev:12}]],
    [['Sarah FAURE',{x:'F',a:15,rep:70,f:'B',pr:.7,dev:7}],['Nathan BLANC',{x:'G',a:15,rep:61,f:'A',pr:.65,dev:8}]],
    [['Zoé LEROY',{x:'F',a:16,rep:68,f:'B',pr:.55,dev:10}],['Max GIRARD',{x:'G',a:15,rep:59,f:'A',pr:.8,dev:6}]]];
  const autres=['Emma LAMBERT'];
  P.classesL[classe]={eleves:G.flat().map(x=>x[0]).concat(autres).sort((a,b)=>nomDe(a).localeCompare(nomDe(b),'fr')),lien:'',cy:'S'};
  autres.forEach(n=>eleveDe(classe,n));
  G.forEach((g,gi)=>{const se=g.map(([n,p],ri)=>demoRunner(p,rnd,nb,gi===0&&ri===0?{chef:'1'}:gi===1&&ri===1?{chef5:'1'}:{}));
    SESS.slice(0,nb).forEach((s,si)=>{
      if(gi===G.length-1&&si===nb-1)return;                        /* un binôme a oublié d'envoyer la dernière séance */
      const date=new Date(Date.now()-(nb-si)*7*864e5).toISOString().slice(0,10);
      g.forEach(([full,p],ri)=>{let d=se[ri][s.id];if(!d)return;if(gi===1&&ri===1&&si===2)d={st:'abs'};
        let co=g[1-ri][0];if(gi===1&&si===2&&ri===0){co='Léa MARTIN';d.cx={n:'Léa M.',why:'abs'}}
        if(gi===2&&ri===0&&si===3)d.ad='1';
        ajouterSeance({classe,eleve:full,sexe:p.x,age:p.a,seance:s.id,date,ts:Math.round(Date.parse(date)/1000),src:si%2?'qr':'fichier',groupe:g.map(x=>x[0]),coach:d.st?'':co,coachRemplacant:!!d.cx,d})})})});
  /* observations du prof et notes déjà saisies */
  Object.keys(P.eleves).forEach((k,i)=>{if(!Object.keys(P.eleves[k].seances).length)return;P.stars[k]={s3:{a2:i%2===0},s5:{a3:i%3===0}};if(i%3===0){const m=AFLMAX('S',P.eleves[k]);Object.assign(P.eleves[k],{afl2:String(Math.min(3,m[0])),afl3:String(Math.min(3,m[1])),ana:'3'})}});
  /* contrôles du prof : la FC d'un élève mesurée par le prof en S5 (deux coachs peu fiables) */
  P.ctrl={};Object.entries(P.eleves).forEach(([k,e],i)=>{const d=e.seances.s5;const r=d&&!d.st?refFC(d):null;if(r)P.ctrl[k]={s5:String(Math.round(r*(i%5===2?1.12:1+((i%3)-1)*0.02)))}});
  P.vue='eleves';P.classe=classe;P.saveAt=Date.now();rendre();
}
function bandeauDemo(){return `<div class="demo-bandeau"><span>👀 <b>Mode démo</b><i> · classe fictive, rien n’est enregistré · vos vraies données ne sont pas touchées</i></span><a class="btn sm" href="../?demo">Voir l’appli élève</a><button class="btn sm" data-act="demoQuitter">Quitter la démo</button></div>`}
if(/[?&]demo\b/.test(location.search))ouvrirDemoProf();else{classeParDefaut();rendre()}
