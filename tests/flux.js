/* Test de bout en bout : outil prof (liste, QR de démarrage) → tablette (groupe, code, séance, QR, fichiers, copie de secours, code oublié) → outil prof.
   Usage : servir la racine du dépôt (python3 -m http.server 8830), puis node tests/flux.js */
const {chromium}=require('playwright');
const U=process.env.URL||'http://localhost:8830/';
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:900,height:1100}});const errs=[];const ok=(c,m)=>{if(!c)errs.push('ÉCHEC : '+m);else console.log('✓ '+m)};
 const watch=p=>{p.on('pageerror',e=>errs.push('erreur JS '+e.message));p.on('dialog',d=>d.accept())};
 const prof=await ctx.newPage();watch(prof);await prof.goto(U+'prof/');await prof.waitForTimeout(400);
 /* 1. liste de classe collée + QR de démarrage */
 await prof.fill('#cl-nom','2nde 9');await prof.fill('#cl-txt','MARTIN Léa\nBERNARD Hugo\nDURAND Inès');await prof.click('[data-act="clcoller"]');await prof.waitForTimeout(200);
 ok(await prof.evaluate(()=>P.classesL['2nde 9'].eleves.length===3),'liste importée (3 élèves)');
 const classeQR=await prof.evaluate(async()=>{let t=null;window.qrPlein=(a,b,parts)=>{t=parts[0]};await qrDemarrage('2nde 9');return t});
 ok(/^SPE[01]:/.test(classeQR),'QR de démarrage produit');
 /* 2. tablette : QR de classe, code, groupe */
 const el=await ctx.newPage();watch(el);await el.goto(U);await el.waitForTimeout(400);
 await el.evaluate(async t=>{recevoirClasse(await STQR.decoder(t))},classeQR);await el.waitForTimeout(700);
 for(const c of ['1234','1234']){await el.fill('#code',c);await el.click('[data-act="codeok"]');await el.waitForTimeout(400)}
 ok(await el.evaluate(()=>!!G&&G.classe==='2nde 9'&&G.cfg.eleves.length===3),'groupe créé avec la liste de la classe');
 await el.selectOption('#ge0','Léa MARTIN');await el.selectOption('#ge1','Hugo BERNARD');
 await el.click('#gx0 [data-v="F"]');await el.click('#ga0 [data-v="15"]');await el.click('#gx1 [data-v="G"]');await el.click('#ga1 [data-v="16"]');
 await el.click('[data-act="gvalider"]');await el.waitForTimeout(300);
 ok(await el.evaluate(()=>G.runners.length===2&&G.runners[1].age===16),'binôme enregistré (sexe et âge)');
 /* 3. séance S1 remplie avec les boutons */
 await el.evaluate(()=>{V.sid='s1';V.tab='seance';DB.opts.one=false;render()});await el.waitForTimeout(200);
 await el.click('[data-stp="fcr.pv"][data-dl="1"]');await el.waitForTimeout(100);
 await el.evaluate(()=>{const d=curD();Object.assign(d,{fcr:{pv:'70',m:['64','65','66']},b1:{en:'4',er:'1'},m1:[{fc:'130',rp:'3'},{fc:'152',rp:'6'}],bl:{rpe:'5',du:'55',reu:'Pied entier',cr:['1','1','']}});saveS();render()});
 await el.waitForTimeout(500);
 ok(await el.evaluate(()=>tenR(G.runners[0],'s1').join('/')==='2/2'),'réussites S1 calculées (2/2)');
 ok(await el.evaluate(()=>sessState(G,'s1')==='wip'),'S1 signalée « à envoyer »');
 /* 4. QR de fin de séance → outil prof */
 const qr=await el.evaluate(async()=>{QRS=null;await montrerQR(['s1'],0);return QRS.L.map(x=>x.parts.join('¤'))});await el.evaluate(()=>closeModal());
 ok(qr.length===1,'un seul QR pour le binôme');
 for(const q of qr)for(const part of q.split('¤'))await prof.evaluate(t=>lireTexteQR(t),part);
 ok(await prof.evaluate(()=>{const k=cleEleve('2nde 9','Léa MARTIN');return !!P.eleves[k].seances.s1&&P.eleves[k].age===15}),'séance S1 reçue par QR (avec l’âge)');
 /* 5. envoi en ligne : fichiers JSON + copie de secours chiffrée */
 const files=await el.evaluate(async()=>{const F=fichiers(['s1']).map(f=>({nom:f.nom,t:JSON.stringify(f.o)}));const S=await fichierSecours();return F.concat(await Promise.all(S.map(async f=>({nom:f.name,t:await f.text()}))))});
 ok(files.filter(f=>/^2nde9_/.test(f.nom)).length===1&&files.some(f=>/^secours_/.test(f.nom)),'un fichier par élève qui a une séance + une copie de secours');
 await prof.evaluate(async F=>{await importerFichiers(F.map(f=>new File([f.t],f.nom,{type:'application/json'})))},files);
 ok(await prof.evaluate(()=>Object.keys(P.secours||{}).length===1),'copie de secours ouverte par l’outil prof');
 const sec=await prof.evaluate(async()=>{const id=Object.keys(P.secours)[0];return JSON.parse(await ouvrirSecours(P.secours[id])).runners.length});ok(sec===2,'copie de secours lisible (2 élèves)');
 /* 6. verrouillage, mauvais code, bon code */
 await el.evaluate(async()=>{await verrouiller();render()});const id=await el.evaluate(()=>Object.keys(ROOT.groupes)[0]);
 const faux=await el.evaluate(async id=>{try{await ouvrir(id,'9999');return 'ouvert'}catch(e){return e.message}},id);ok(faux==='Code faux.','mauvais code refusé');
 ok(await el.evaluate(()=>!/Pied entier|fcr/.test(localStorage.getItem('spe-v1'))),'carnet chiffré sur la tablette (séances illisibles en clair)');
 await el.evaluate(async id=>{await ouvrir(id,'1234');render()},id);ok(await el.evaluate(()=>G&&G.runners[0].seances.s1.fcr.pv==='70'),'bon code : carnet rouvert');
 /* 7. code oublié : QR K → outil prof → QR U → tablette, nouveau code */
 await el.evaluate(async()=>{await verrouiller();render()});
 const K=await el.evaluate(async id=>{const g=ROOT.groupes[id];return STQR.encoder({a:'SPE',v:1,t:'K',c:g.classe,n:g.noms||[],i:id,p:g.pk})},id);
 const Uqr=await prof.evaluate(async t=>{let u=null;window.qrPlein=(a,b,parts)=>{u=parts[0]};await lireTexteQR(t);await new Promise(r=>setTimeout(r,500));return u},K);
 ok(/^SPE/.test(Uqr||''),'outil prof : QR de déverrouillage');
 await el.evaluate(async([id,t])=>{recevoirDeblocage(id,await STQR.decoder(t))},[id,Uqr]);await el.waitForTimeout(900);
 for(const c of ['4321','4321']){await el.fill('#code',c);await el.click('[data-act="codeok"]');await el.waitForTimeout(400)}
 ok(await el.evaluate(()=>!!G&&G.runners.length===2),'nouveau code choisi après déverrouillage');
 /* 8. QR de reprise (prof) → tablette */
 const T=await prof.evaluate(async()=>{let u=null;window.qrPlein=(a,b,parts)=>{u=parts};await qrReprise(cleEleve('2nde 9','Léa MARTIN'));return u});
 await el.evaluate(()=>{G.runners[0].seances={};});const rep=await el.evaluate(async parts=>{let s='';if(parts.length>1){parts.forEach(p=>{s+=p.split('|').slice(3).join('|')})}else s=parts[0];return accueillir(await STQR.decoder(s))},T);
 ok(/1 séance récupérée/.test(rep),'QR de reprise : séances rendues à l’élève');
 /* 9. ancien carnet sur la même tablette */
 await el.evaluate(async()=>{await verrouiller();localStorage.setItem('step2_carnet_v1',JSON.stringify({binomes:[{id:'x',classe:'2nde 2',runners:[{prenom:'Ana',nom:'Diaz',sexe:'F',age:15,seances:{s1:{bl:{rpe:'4'}}}},{prenom:'Leo',nom:'Roy',sexe:'G',age:16,seances:{}}],sent:{}}]}));ROOT.migre=0;render()});
 ok(await el.evaluate(()=>ancien()===1),'ancien carnet détecté');await el.evaluate(()=>migrer());
 ok(await el.evaluate(()=>Object.values(ROOT.groupes).some(g=>g.clair&&g.noms.includes('Ana'))),'ancien binôme repris (à protéger par un code)');
 /* 9b. anciens QR du carnet tout-en-un (SP2) et ancien mode prof */
 const r9=await prof.evaluate(()=>lireTexteQR('SP2'+JSON.stringify({v:1,s:'s2',c:'2nde 2',b:'x',r:[{i:0,p:'Ana',n:'Diaz',x:'F',a:15,d:{bl:{rpe:'5'}}}]})));ok(/ancien carnet/.test(r9),'ancien QR SP2 accepté');
 await prof.evaluate(()=>{localStorage.setItem('step2_prof_v1',JSON.stringify({students:{'2nde 2|diaz|ana':{classe:'2nde 2',prenom:'Ana',nom:'Diaz',sexe:'F',age:15,seances:{s3:{bl:{rpe:'6'}}},afl2:'3'}},stars:{}}));P.migre=0;migrerProf()});
 ok(await prof.evaluate(()=>{const e=P.eleves[cleEleve('2nde 2','Ana DIAZ')];return e&&e.seances.s3&&e.afl2==='3'}),'ancien mode prof importé');
 /* 10. vues prof sans erreur */
 for(const v of ['classes','appel','import','seance','eleves','defis','note','pilotage','export','chrono'])await prof.evaluate(v=>{P.vue=v;rendre()},v);
 const csv=await prof.evaluate(()=>{let t='';window.telecharger=(n,x)=>{t=x};exporter('bilan');return t});ok(/MARTIN;Léa;F;15/.test(csv),'export CSV bilan');
 console.log(errs.length?'\n'+errs.join('\n'):'\nTOUT EST BON');await b.close();process.exit(errs.length?1:0)})();
