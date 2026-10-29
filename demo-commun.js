/* =====================================================================
   demo-commun.js — Step : séances fictives mais vraisemblables (mêmes zones, mêmes formats) pour la démo.
   COMMUN à l'appli élève (demo.js) et à l'outil prof (prof/prof-demo.js). Rien n'est enregistré.
   ===================================================================== */
'use strict';
function demoRnd(seed){let s=seed;return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}}
/* p = {x:'F'|'G', a:âge, rep:FC de repos, f:'A'|'B', pr:part des mesures dans la zone, dev:erreur d'annonce} */
function demoRunner(p,rnd,nsess,flags){
  const J=a=>a[Math.floor(rnd()*a.length)],E=n=>Math.round((rnd()*2-1)*n),S=String;
  const mx=(p.x==='F'?226:220)-p.a,fcr=mx-p.rep,at=pc=>R(p.rep+fcr*pc),Z={A:[at(.8),at(.95)],B:[at(.55),at(.7)]},z=Z[p.f],mid=R((z[0]+z[1])/2);
  const fc=pc=>S(at(pc)+E(4)),an=v=>S(R(+v+E(p.dev)));const mes=(v)=>({an:an(v),fc:S(v)});
  const inz=()=>{const v=rnd()<p.pr?mid+E(R((z[1]-z[0])/2)-1):(rnd()<.5?z[0]-2-Math.round(rnd()*6):z[1]+2+Math.round(rnd()*6));return v};
  const reg=f=>f==='A'?{H:'1',B:'2',P:S(1+Math.round(rnd())),A:'1'}:{H:'0',B:'1',P:'0',A:S(1+Math.round(rnd()))};
  const BL=(i,k)=>{const o={cr:['1',rnd()<.7?'1':'',rnd()<.5?'1':''],reu:J(['Pied entier tout du long','Bonne régularité','Bras bien hauts','Tu as tenu sans arrêt','Bon réglage dès le début']),con:J(['Regarde devant, pas tes pieds','Monte plus haut sur le step','Garde le dos droit','+1 amplitude pour monter dans la zone','Respire en rythme']),aide:rnd()<.8?'1':'0',rpe:S(J(p.f==='A'?[6,7,7,8]:[4,5,5,6])),du:'55'};
    if(i>=3){o.dc=J(['+A','+P','-B','=','+B']);o.nx=J(['Garder mon réglage','Monter d’un curseur','Mieux annoncer ma FC'])}if(k)o.pr=S(+k+E(16));return o};
  const se={};const add=(sid,d)=>{if(SESS.findIndex(s=>s.id===sid)<nsess)se[sid]=d};
  add('s1',{fcr:{pv:S(p.rep+4+E(3)),m:[S(p.rep+E(2)),S(p.rep+E(2)),S(p.rep+E(2))]},b1:{en:S(3+Math.floor(rnd()*3)),er:S(Math.floor(rnd()*3))},m1:[{fc:fc(.5),rp:'3'},{fc:fc(.68),rp:'6'}],bl:BL(0)});
  add('s2',{co:{canon:rnd()<.7?'1':'0'},b2:{en:S(3+Math.floor(rnd()*3)),er:S(Math.floor(rnd()*3)),df:rnd()<.5?['Reverse']:[]},lv:[{fc:fc(.55),rp:'4'},{fc:fc(.7),rp:'6'},{fc:fc(.82),rp:'8'}],zc:{mx:S(mx),fr:S(fcr),a0:S(Z.A[0]),a1:S(Z.A[1]),b0:S(Z.B[0]),b1:S(Z.B[1]),vu:'1'},bl:BL(1)});
  const l1=at(.6)+E(5),l2=at(.66)+E(5);
  add('s3',{co:{ronde:'1',annonce:rnd()<.6?'1':'0'},bi:[{...mes(at(.84)+E(6)),rp:'8'}],b3:{en:S(3+Math.floor(rnd()*3)),er:S(Math.floor(rnd()*3))},lg:[mes(l1),mes(l2)],lgar:rnd()<.7?'0':'1',bl:BL(2)});
  const lo=at(.58)+E(4),hi=at(.86)+E(4),v1=mid+E(10),v2=inz();
  add('s4',{tri:rnd()<.7?'1':'0',co:{chef:flags.chef||'n'},cu:{lo:{r:{H:'0',B:'0',P:'0',A:'0'},...mes(lo)},hi:{r:{H:'1',B:'2',P:'2',A:'1'},...mes(hi)}},vs:{f:p.f,1:{r:reg(p.f),...mes(v1)},2:{r:reg(p.f),...mes(v2)}},
    es:{f:p.f,m:mesures(p.f,'s4').map(()=>mes(inz()))},ch:{f:p.f,a1:p.f==='A'?'J’aime les efforts courts et forts':'Je tiens longtemps sans m’arrêter',a2:p.f==='A'?'2 mesures sur 3 dans la zone A':'2 mesures sur 2 dans la zone B',a3:J(['Préparer le cross','M’entretenir','Améliorer mon cardio','Préparer un concours']),rep:J(['6/2','4/4','4/4','2/6'])},bl:BL(3)});
  const m5=mesures(p.f,'s5').map(()=>inz()),r1=mid-6+E(4),r2=inz();
  add('s5',{wc:['so','br','bs','ge','b1','b2','b3','fi'].filter(()=>rnd()<.9),co:{chef:flags.chef5||'n'},ps:{b1:reg(p.f),b2:reg(p.f),b3:reg(p.f)},rg:{1:{r:reg(p.f),...mes(r1)},2:{r:reg(p.f),...mes(r2)}},fl:{s:[reg(p.f)],m:m5.map(v=>({...mes(v),ar:rnd()<.85?'0':'1'}))},bl:BL(4,m5[0])});
  const m6=mesures(p.f,'s6').map(()=>inz());
  add('s6',{wc:['so','br','bs','ge','b1','b2','b3','fi','fc'],co:{chef:'n'},fl:{m:m6.map(v=>({...mes(v),ar:'0'}))},ob:{sec:J(['2','1.5','1.5']),pl:J(['1','1','0.5'])},bl:BL(5,m6[0])});
  const plan=()=>({r:FMT.eval[p.f].e.map(()=>S(p.f==='A'?5+Math.round(rnd()):2+Math.round(rnd()))),si:J(['+1 propulsion si je suis dessous','−1 bras si je dépasse','+1 amplitude si je suis sous la zone'])});
  const ana=()=>({c:J(['3 mesures sur 4 dans ma zone, aucun arrêt','2 mesures sur 4 dans ma zone, 1 arrêt','4 mesures sur 4 dans ma zone']),k:J(['série 1 sous la zone : réglage de départ trop bas','fatigue en série 3','j’ai oublié un pas du bloc 2 et je me suis arrêté']),r:J(['j’ai ajouté la propulsion en série 2','j’ai enlevé les bras en fin de séance','je partirai d’un curseur plus haut'])});
  const m7=mesures(p.f,'eval').map(()=>inz());
  add('s7',{wc:['so','br','bs','ge','b1','b2','b3','fi','fc'].filter(()=>rnd()<.92),co:{chef:'n'},pl:plan(),rg:{1:{r:reg(p.f),...mes(mid-5+E(4))},2:{r:reg(p.f),...mes(inz())}},fl:{s:FMT.eval[p.f].e.map(()=>reg(p.f)),m:m7.map(v=>({...mes(v),ar:rnd()<.9?'0':'1'}))},an:ana(),bl:BL(6,m7[0])});
  const m8=mesures(p.f,'eval').map(()=>inz());
  add('s8',{wc:['so','br','bs','ge','b1','b2','b3','fi','fc'].filter(()=>rnd()<.95),pl:plan(),fl:{s:FMT.eval[p.f].e.map(()=>reg(p.f)),m:m8.map(v=>({fc:S(v),ar:rnd()<.9?'0':'1'}))},ob:{sec:J(['2','2','1.5','1.5','0.5']),pl:J(['1','1','0.5'])},an:ana(),situe:{a2:S(2+Math.round(rnd()*2)),a3:S(2+Math.round(rnd()*2))},bl:BL(7)});
  return se}
