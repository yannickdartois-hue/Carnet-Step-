/* Test complet du carnet step : saisie S1-S8, calculs, QR, mode prof, restauration, affichage téléphone.
   Lancer depuis la racine du dépôt : node src/tests/e2e.js  (Playwright installé) */
const path=require('path'),os=require('os'),fs=require('fs');
const IDX='file://'+path.resolve(__dirname,'../../index.html');
const SH=fs.mkdtempSync(path.join(os.tmpdir(),'carnet-step-'))+'/';
const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch();const errs=[];
 const p=await b.newPage({viewport:{width:820,height:1100}});
 p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text())});
 await p.goto(IDX);
 const click=async s=>{await p.click(s);await p.waitForTimeout(40)};
 await p.screenshot({path:SH+'home.png'});
 await click('[data-go="new"]');
 await p.fill('#ncl','2nde 3');
 for(const [i,pr,nm,sx,ag] of [[0,'Léa','Martin','F','15'],[1,'Hugo','Durand','G','16']]){await p.fill('#np'+i,pr);await p.fill('#nn'+i,nm);await click(`#nx${i} [data-v="${sx}"]`);await click(`#na${i} [data-v="${ag}"]`)}
 await click('[data-act="create"]');
 await p.screenshot({path:SH+'bin.png'});
 // fill data programmatically per séance for runner 0 via clicks on some, rest via DB for speed
 await click('[data-sess="s1"]');
 await p.evaluate(()=>{DB.opts.one=false;save();render()});
 await p.screenshot({path:SH+'s1.png',fullPage:true});
 // use + buttons for FC repos provisoire
 await click('[data-stp="fcr.pv"][data-dl="1"]');
 await p.evaluate(()=>{const b=curBin();const r=b.runners[0];const S=r.seances;
   Object.assign(S.s1,{fcr:{pv:'72',m:['66','64','65']},b1:{en:'4',er:'1'},m1:[{fc:'128',rp:'4'},{fc:'150',rp:'6'}],bl:{cr:['1','1',''],reu:'Pied entier',con:'Regard devant',rpe:'5',du:'55',aide:'1'}});
   S.s2={b2:{en:'4',er:'1',df:['Reverse']},lv:[{fc:'140'},{fc:'162'},{fc:'170'}],zc:{mx:'211',fr:'146',a0:'182',a1:'204',b0:'145',b1:'167'},bl:{rpe:'6',du:'55',reu:'ok'}};
   S.s2.co={canon:'1'};S.s3={co:{ronde:'1',annonce:'0'},b3:{en:'5',er:'2'},lg:[{an:'150',fc:'152'},{an:'160',fc:'158'}],lgar:'0',bl:{rpe:'5',du:'55',reu:'ok'}};
   S.s4={tri:'1',co:{chef:'1'},cu:{lo:{r:{H:'0',B:'0',P:'0',A:'0'},an:'135',fc:'140'},hi:{r:{H:'1',B:'2',P:'2',A:'1'},an:'175',fc:'172'}},vs:{f:'B',1:{an:'150',fc:'148'},2:{an:'156',fc:'157'}},es:{f:'B',m:[{an:'152',fc:'150'},{an:'155',fc:'158'}]},ch:{f:'B',a1:'Je tiens',a2:'2/2 en zone',a3:'Entretien',rep:'4/4'},bl:{rpe:'5',du:'55',dc:'+A',reu:'ok'}};
   S.s5={wc:['so','br','bs','ge','b1','b2','b3','fi'],ps:{b1:{H:'0',B:'1',P:'0',A:'2'}},rg:{1:{r:{H:'0',B:'1',P:'0',A:'1'},an:'145',fc:'140'},2:{r:{H:'0',B:'1',P:'0',A:'2'},an:'152',fc:'150'}},fl:{s:[{H:'0',B:'1',P:'0',A:'2'}],m:[{an:'150',fc:'148'},{an:'155',fc:'155'},{an:'158',fc:'160'},{an:'160',fc:'170'}]},bl:{rpe:'5',du:'55',pr:'150',reu:'ok'}};
   S.s7={wc:['so','br','bs','ge','b1','b2','b3','fi','fc'],pl:{r:['2','3'],si:'+1 amplitude'},fl:{m:[{an:'152',fc:'150'},{fc:'156',ar:'1'},{fc:'160'},{fc:'163'}]},ob:{sec:'1.5',pl:'1'},an:{c:'4/4',k:'bon réglage',r:'rien'},bl:{rpe:'5',du:'55',reu:'ok',pr:'152'}};
   S.s8={wc:['so','br','bs','ge','b1','b2','b3','fi','fc'],pl:{r:['2','2']},fl:{m:[{fc:'149'},{fc:'152'},{fc:'171'},{fc:'160'}]},ob:{sec:'2',pl:'1'},an:{c:'3/4',k:'fatigue',r:'−1 bras'},situe:{a2:'3',a3:'3'},bl:{rpe:'6',du:'55',reu:'ok'}};
   saveS();render()});
 const ids=['s1','s2','s3','s4','s5','s6','s7','s8'];
 for(const sid of ids){await p.evaluate(sid=>go({v:'sess',sid,ri:0,cur:0}),sid);await p.waitForTimeout(60);await p.screenshot({path:SH+`${sid}.png`,fullPage:true})}
 const ten=await p.evaluate(()=>{const r=curBin().runners[0];return SESS.map(s=>s.id+':'+tenus(s.id,r.seances[s.id],r).join('/'))+' | zones '+JSON.stringify(zonesOf(r))+' fil '+filOf(r)+' afl1 '+JSON.stringify(afl1(r,r.seances.s8))});
 console.log(ten);console.log(await p.evaluate(()=>{const b=curBin();return JSON.stringify(b.runners.map((r,i)=>[scoreRun(r),badgesOf(r,b.runners[1-i])]))}));
 for(const v of ['bin']){await p.evaluate(v=>go({v}),v);await p.waitForTimeout(60);await p.screenshot({path:SH+'bin2.png',fullPage:true})}
 // QR payloads
 const pls=await p.evaluate(()=>{const b=curBin();return SESS.map(s=>qrPayload(b,s.id))});
 console.log('payload lengths',pls.map(x=>x.length).join(','));
 await p.evaluate(()=>qrModal('s8'));await p.waitForTimeout(80);await p.screenshot({path:SH+'qr.png'});
 const cat=await p.evaluate(()=>{const b=curBin();return catchupPayload(b)[1]});
 await p.evaluate(()=>closeModal());
 // views
 for(const v of ['zones','prog']){await p.evaluate(v=>go({v}),v);await p.waitForTimeout(60);await p.screenshot({path:SH+`${v}.png`,fullPage:true})}
 // prof
 await p.evaluate(()=>{DB.opts.dev='prof';save()});
 for(const pl of pls) await p.evaluate(pl=>{try{profAddAny(pl)}catch(e){console.error(e.message)}},pl);
 await p.evaluate(c=>profAddAny(c),cat);
 await p.evaluate(()=>go({v:'prof',ptab:'classe'}));await p.waitForTimeout(80);await p.screenshot({path:SH+'prof-classe.png',fullPage:true});
 await p.evaluate(()=>go({v:'prof',ptab:'defis'}));await p.waitForTimeout(80);await p.screenshot({path:SH+'prof-defis.png',fullPage:true});
 await p.evaluate(()=>go({v:'prof',ptab:'seance',ps:'s5'}));await p.waitForTimeout(80);await p.screenshot({path:SH+'prof-seance.png',fullPage:true});
 const k=await p.evaluate(()=>Object.keys(PDB.students)[0]);
 await p.evaluate(k=>detailModal(k,'s8'),k);await p.waitForTimeout(80);await p.screenshot({path:SH+'prof-detail.png',fullPage:true});
 await p.evaluate(k=>{closeModal();restoreQrModal(k)},k);await p.waitForTimeout(80);
 await p.evaluate(()=>closeModal());
 await p.evaluate(()=>go({v:'prof',ptab:'chrono'}));await p.click('[data-act="chgo"]');await p.evaluate(()=>{CH.run.pre=0;CH.run.t=239;chTick()});await p.waitForTimeout(80);await p.screenshot({path:SH+'chrono.png'});
 await p.evaluate(()=>{chStop();go({v:'prof',ptab:'data'})});
 // restore test: wipe tablet, merge from restore payload
 const rest=await p.evaluate(k=>{const st=PDB.students[k];const mates=Object.entries(PDB.students).filter(([kk,s])=>binOf(kk,s)===binOf(k,st));return restorePayload({b:binOf(k,st),c:st.classe},mates.map(([kk,s])=>({i:s.ri,p:s.prenom,n:s.nom,x:s.sexe,a:s.age,se:s.seances})))},k);
 const msg=await p.evaluate(r=>{DB.binomes=[];return mergeRestore(JSON.parse(r.slice(4)))},rest);console.log('restore:',msg);
 // mobile overflow checks
 const m=await b.newPage({viewport:{width:390,height:844}});m.on('pageerror',e=>errs.push('m '+e.message));
 await m.goto(IDX);
 await m.evaluate(r=>{mergeRestore(JSON.parse(r.slice(4)));DB.opts.one=false;save()},rest);
 const bid=await m.evaluate(()=>DB.binomes[0].id);
 for(const sid of ids){await m.evaluate(([bid,sid])=>go({v:'sess',bin:bid,sid,ri:0}),[bid,sid]);await m.waitForTimeout(50);const ov=await m.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ov>0)errs.push('390 overflow '+sid+' '+ov)}
 await m.evaluate(()=>{DB.opts.one=true;save();render()});await m.screenshot({path:SH+'m-s8.png',fullPage:true});
 await m.evaluate(()=>{DB.opts.dev='prof';go({v:'prof',ptab:'chrono'})});await m.screenshot({path:SH+'m-chrono.png'});
 console.log(errs.length?errs.join('\n'):'OK : aucune erreur');await b.close();if(errs.length)process.exit(1);
})();
