/* Démos de l'appli élève et de l'outil prof : tous les écrans s'ouvrent sans erreur, rien ne déborde sur téléphone,
   et les vraies données de l'appareil ne sont pas touchées. */
const {chromium}=require('playwright');const U=process.env.URL||'http://localhost:8830/';
(async()=>{const b=await chromium.launch();const errs=[];const ok=(c,m)=>{if(!c)errs.push('ÉCHEC : '+m);else console.log('✓ '+m)};
 for(const [w,h] of [[1180,820],[390,844]]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(w+' erreur JS '+e.message));
  await p.goto(U);await p.evaluate(()=>localStorage.setItem('spe-v1',JSON.stringify({v:1,groupes:{vrai:{classe:'2nde 1',noms:['Vrai'],iv:'x',data:'y'}},classes:{},opts:{}})));
  await p.goto(U+'?demo');await p.waitForTimeout(500);
  for(const t of ['seance','moi','chrono','envoi','groupe']){await p.evaluate(t=>{V.tab=t;render()},t);await p.waitForTimeout(80);const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>2)errs.push(w+' élève '+t+' déborde de '+ov+' px')}
  for(const sid of SESS_IDS())await p.evaluate(sid=>{V.tab='seance';V.sid=sid;V.ph='piste';render();V.ph='fin';render()},sid);
  ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('spe-v1')).groupes.vrai.noms[0]==='Vrai'),w+' px · démo élève : vraies données intactes');
  await p.goto(U+'prof/?demo');await p.waitForTimeout(500);
  for(const v of ['classes','appel','import','seance','eleves','defis','note','pilotage','export','chrono']){await p.evaluate(v=>{P.vue=v;rendre()},v);await p.waitForTimeout(60);if(w<500&&['classes','appel','import','export','chrono'].includes(v)){const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>2)errs.push(w+' prof '+v+' déborde de '+ov+' px')}}
  ok(await p.evaluate(()=>localStorage.getItem('spp-v1')===null),w+' px · démo prof : rien enregistré');
  await p.close()}
 console.log(errs.length?'\n'+errs.join('\n'):'\nTOUT EST BON');await b.close();process.exit(errs.length?1:0)})();
function SESS_IDS(){return ['s1','s2','s3','s4','s5','s6','s7','s8']}
