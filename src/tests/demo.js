/* Test du mode démo : classe fictive, données réelles intactes, réinitialisation.
   Lancer depuis la racine du dépôt : node src/tests/e2e.js  (Playwright installé) */
const path=require('path'),os=require('os'),fs=require('fs');
const IDX='file://'+path.resolve(__dirname,'../../index.html');
const SH=fs.mkdtempSync(path.join(os.tmpdir(),'carnet-step-'))+'/';
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const errs=[];
const p=await b.newPage({viewport:{width:820,height:1100}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const u=IDX;
await p.goto(u);await p.evaluate(()=>{localStorage.setItem('step2_carnet_v1',JSON.stringify({binomes:[{id:'real',classe:'2nde 7',runners:[{prenom:'Vrai',nom:'A',seances:{}},{prenom:'Vrai2',nom:'B',seances:{}}],sent:{}}],code:'1275',opts:{}}))});
await p.goto(u+'?demo');await p.waitForTimeout(300);
await p.screenshot({path:SH+'demo-home.png'});
const info=await p.evaluate(()=>({bins:DB.binomes.map(b=>b.runners.map(r=>r.prenom).join('&')),studs:Object.keys(PDB.students).length,real:JSON.parse(localStorage.getItem('step2_carnet_v1')).binomes.length,
  scores:DB.binomes.map(b=>b.runners.map((r,i)=>scoreRun(r).tot+':'+badgesOf(r,b.runners[1-i]).join('/')).join(' | ')),
  tenus:DB.binomes.map(b=>b.runners.map(r=>SESS.map(s=>tenus(s.id,r.seances[s.id],r).join('/')).join(',')))}));
console.log(JSON.stringify(info));
await p.click('[data-act="demoprof"]');await p.waitForTimeout(300);await p.screenshot({path:SH+'demo-prof.png',fullPage:true});
await p.evaluate(()=>go({v:'prof',ptab:'defis'}));await p.waitForTimeout(200);await p.screenshot({path:SH+'demo-defis.png',fullPage:true});
await p.click('[data-act="demoeleve"]');await p.waitForTimeout(200);
const bid=await p.evaluate(()=>DB.binomes[0].id);await p.evaluate(b=>go({v:'sess',bin:b,sid:'s5',ri:0}),bid);await p.waitForTimeout(200);await p.screenshot({path:SH+'demo-s5.png',fullPage:true});
await p.evaluate(b=>go({v:'prog',bin:b}),bid);await p.waitForTimeout(200);await p.screenshot({path:SH+'demo-prog.png',fullPage:true});
const m=await b.newPage({viewport:{width:390,height:844}});m.on('pageerror',e=>errs.push('m '+e.message));await m.goto(u+'?demo');await m.waitForTimeout(300);await m.screenshot({path:SH+'demo-m.png'});
const ov=await m.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>0)errs.push('overflow '+ov);
await p.click('[data-act="demoreset"]');await p.waitForTimeout(400);console.log('after reset bins',await p.evaluate(()=>DB.binomes.length));
await p.goto(u);await p.waitForTimeout(200);const real=await p.evaluate(()=>DB.binomes.map(b=>b.classe));if(real.length!==1||real[0]!=='2nde 7')errs.push('vraies données modifiées par la démo : '+real);if(await p.$('#demobar'))errs.push('bandeau démo hors démo');
const ok=errs.length===0;console.log(ok?'OK : démo sans erreur, vraies données intactes':errs);await b.close();if(!ok)process.exit(1)})();
