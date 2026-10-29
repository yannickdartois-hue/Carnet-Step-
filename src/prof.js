/* =================== MODE PROF =================== */
function profKey(c,r){return norm(c)+'|'+norm(r.n)+'|'+norm(r.p)}
function findKey(o,r){
  const idk=o.b&&r.i!=null?'id:'+o.b+'|'+r.i:null;
  if(idk&&PDB.students[idk])return idk;
  const byName=Object.keys(PDB.students).find(k=>{const s=PDB.students[k];return norm(s.classe)===norm(o.c)&&(norm(s.nom)===norm(r.n)||(String(r.n).length===1&&norm(s.nom).startsWith(norm(r.n))))&&norm(s.prenom)===norm(r.p)});
  if(byName)return byName;
  return idk||profKey(o.c,r);
}
function profAddObj(o){if(DB.opts.dev!=='prof')throw new Error('Cet appareil n’est pas déclaré « appareil du prof » : rien n’est enregistré ici.');const added=[];
  o.r.forEach(r=>{const k=findKey(o,r);const st=PDB.students[k]=PDB.students[k]||{seances:{}};
    const keepNom=String(r.n||'').length<=1&&st.nom&&norm(st.nom).startsWith(norm(r.n));const nom=keepNom?st.nom:r.n;
    st.classe=o.c;st.prenom=r.p;st.nom=nom;st.sexe=r.x||st.sexe;if(r.a)st.age=r.a;if(r.fr)st.fcrM=r.fr;if(o.b){st.bin=o.b;st.ri=r.i}st.seances[o.s]=r.d||{};st.recu=st.recu||{};st.recu[o.s]=Date.now();added.push(r.p)});
  psave();return SBY[o.s].n+' · '+added.join(', ')+' ('+o.c+')'}
function profView(){
  const tab=V.ptab||'scan';
  const stu=DB.opts.dev==='stu';const tabs=stu?[['data','Réglages tablette'],['chrono','Chrono']]:[['scan','Scanner'],['classe','Classe'],['seance','Étoiles'],['defis','Défis'],['chrono','Chrono'],['data','Données']];
  if(!tabs.some(t=>t[0]===tab))return (V.ptab=tabs[0][0],profView());
  return `<div class="seg big">${tabs.map(t=>`<button class="chip ${tab===t[0]?'on':''}" data-ptab="${t[0]}">${t[1]}</button>`).join('')}</div>`+
   (tab==='scan'?profScan():tab==='classe'?profClasse():tab==='seance'?profSeance():tab==='defis'?profDefis():tab==='chrono'?chronoView():profData());
}
function profScan(){
  return `<section class="card"><h2>Scanner les QR de fin de séance</h2><p class="muted small">Caméra arrière. Un bip = séance ajoutée. ${'BarcodeDetector' in window?'Détection native (Android).':'Détection jsQR (iPad).'}</p>
  <div class="row wrap"><button class="btn pri" data-act="scan">Démarrer la caméra</button><button class="btn" data-act="stopscan">Arrêter</button>
  <label class="btn">Photo d’un QR<input type="file" accept="image/*" capture="environment" id="qrphoto" hidden></label><label class="btn">Fichier reçu (AirDrop)<input type="file" accept=".txt,text/plain,.json" id="qrfile" multiple hidden></label></div>
  <video id="vid" playsinline muted></video><canvas id="cv" hidden></canvas><p id="scanlog" class="small"></p>
  <details><summary class="small">Coller un texte de QR</summary><textarea id="paste" class="in" rows="3"></textarea><button class="btn" data-act="paste">Ajouter</button></details></section>`;
}
function classes(){return [...new Set(Object.values(PDB.students).map(s=>s.classe))].sort()}
function studs(c){return Object.entries(PDB.students).filter(([k,s])=>s.classe===c).sort((a,b)=>(a[1].nom+a[1].prenom).localeCompare(b[1].nom+b[1].prenom))}
const runOf=st=>({sexe:st.sexe,age:st.age,fcrM:st.fcrM,filM:st.filM,seances:st.seances});
function starOf(k,sid){return (PDB.stars[k]&&PDB.stars[k][sid])||{}}
function clsSel(){const cs=classes();if(!V.pc||!cs.includes(V.pc))V.pc=cs[0]||'';return cs.length?`<div class="seg">${cs.map(c=>`<button class="chip ${V.pc===c?'on':''}" data-pc="${esc(c)}">${esc(c)}</button>`).join('')}</div>`:'<p class="muted">Aucune donnée : scanne d’abord des QR.</p>'}
function stTotals(st){let T=0,N=0;SESS.forEach(s=>{const [t,n]=tenR(runOf(st),s.id);T+=t;N+=n});return [T,N]}
const fcx=x=>x==null||x===''?'–':String(x).replace('.',',');
const nm=st=>esc(st.nom.toUpperCase())+' '+esc(st.prenom);
function ecTrend(st){const run=runOf(st);const v=SESS.map(s=>ecartOf(s.id,st.seances[s.id],run)).filter(x=>x!=null);if(!v.length)return '–';const a=R(v[0]),b=R(v[v.length-1]);return v.length<2?a:`${a} → <b class="${b<a?'ok':b>a?'ko':''}">${b}</b>`}
function binOf(k,st){return st.bin||(k.startsWith('id:')?k.slice(3).split('|')[0]:null)}
function pronoErr(d){if(!d)return null;const p=num(getPath(d,'bl.pr')),f=num(getPath(d,'fl.m.0.fc'));if(p==null||f==null||!f)return null;return Math.abs(p-f)/f*100}
function coachStat(k,st){const bin=binOf(k,st);if(!bin)return '–';const ri=st.ri!=null?st.ri:+(k.split('|')[1]||0);
  const p=Object.entries(PDB.students).find(([kk,s])=>binOf(kk,s)===bin&&kk!==k&&(s.ri==null||s.ri!==ri));if(!p)return '–';const ps=p[1];let yes=0,tot=0;const er=[];
  SESS.forEach(s=>{const d=ps.seances[s.id];if(!d||d.st||d.cx)return;const bl=d.bl||{};if(bl.aide==='1'||bl.aide==='0'){tot++;if(bl.aide==='1')yes++}const e=pronoErr(d);if(e!=null)er.push(e)});
  if(!tot&&!er.length)return '–';return (tot?`aide ${yes}/${tot}`:'')+(er.length?`<br><small>pronostic ±${R(er.reduce((a,x)=>a+x,0)/er.length)} %</small>`:'')}
function classAlerts(c){const S=studs(c);const o=[];
  let last=-1;S.forEach(([k,st])=>SESS.forEach((s,i)=>{if(st.seances[s.id]&&i>last)last=i}));
  if(last>=0){const sid=SESS[last].id;const miss=S.filter(([k,st])=>!st.seances[sid]);if(miss.length)o.push(['qr',`QR manquant en ${SESS[last].n} : ${miss.map(([k,st])=>nm(st)).join(', ')}`])}
  S.forEach(([k,st])=>{const run=runOf(st);
    if(last>=1&&!zonesOf(run))o.push(['ko',`${nm(st)} : zones non calculables (${fcMax(run)==null?'âge':'FC de repos'} manquant)`]);
    if(last>=4&&!filOf(run))o.push(['ko',`${nm(st)} : pas de filière choisie`]);
    const done=SESS.filter(s=>['s5','s6','s7','s8'].includes(s.id)&&hasData(st.seances[s.id])&&!st.seances[s.id].st);
    if(done.length>=2&&done.slice(-2).every(s=>{const [t,n]=tenR(run,s.id);return n>0&&t===0}))o.push(['ko',`${nm(st)} : aucune mesure dans sa zone sur 2 séances de filière`]);
    const ab=SESS.filter(s=>st.seances[s.id]&&st.seances[s.id].st==='abs').length;if(ab>=2)o.push(['abs',`${nm(st)} : ${ab} absences`]);
    const all=SESS.filter(s=>hasData(st.seances[s.id])&&!st.seances[s.id].st);if(all.length>=3&&!all.some(s=>(st.seances[s.id].bl||{}).reu))o.push(['coach',`${nm(st)} : son coach n’a jamais écrit « Ta réussite » (${all.length} séances)`]);
  });return o}
function profClasse(){
  const sel=clsSel();if(!V.pc)return `<section class="card">${sel}</section>`;
  const head=`<tr><th>Élève</th><th>Fil.</th><th>Zone</th>${SESS.map(s=>`<th>${s.n}</th>`).join('')}<th>Réussites</th><th>Écart zone<br><small>début → fin</small></th><th>Comme coach</th><th>Blanche<br>produire /8</th><th>Produire /8</th><th>Analyse /4</th><th>AFL1 /12</th><th>Répart.</th><th>AFL2</th><th>AFL3</th><th>/20</th></tr>`;
  const rows=studs(V.pc).map(([k,st])=>{const run=runOf(st);const [TT,N]=stTotals(st);const dg=degreeOf(TT,N);const f=filOf(run);const z=zoneFor(run,f);
    const b7=afl1(run,st.seances.s7),e8=afl1(run,st.seances.s8);const an=num(st.an),a2=num(st.afl2),a3=num(st.afl3);const a1=e8&&an!=null?e8.prod+an:null;const tot=a1!=null&&a2!=null&&a3!=null?R((a1+a2+a3)*10)/10:null;
    const rep=(st.seances.s4&&st.seances.s4.ch&&st.seances.s4.ch.rep)||'';const mx=rep?rep.split('/'):['4','4'];
    return `<tr><th class="l">${nm(st)} <button class="lnk small" data-rest="${esc(k)}" title="QR de restauration">↺</button></th><td>${f||'–'}</td><td>${z?z[0]+'-'+z[1]:'–'}</td>${SESS.map(s=>{const d=st.seances[s.id];if(!d)return '<td class="no">·</td>';const [t,n]=tenR(run,s.id);const sr=starOf(k,s.id);
      if(!hasData(d))return `<td class="no"><button class="cell" data-det="${esc(k)}|${s.id}">vide</button></td>`;
      if(d.st)return `<td class="abs"><button class="cell" data-det="${esc(k)}|${s.id}">${d.st==='abs'?'abs':'disp'}</button></td>`;
      return `<td class="yes"><button class="cell" data-det="${esc(k)}|${s.id}">${n?t+'/'+n:'✓'}${d.ad?'<i>adapté</i>':''}${d.cx?'<i>coach ↺</i>':''}${sr.a2?'<i>★2</i>':''}${sr.a3?'<i>★3</i>':''}</button></td>`}).join('')}
     <td>${N?TT+'/'+N+' · '+R(100*TT/N)+' %<br><small>degré '+dg+'</small>':'–'}</td><td>${ecTrend(st)}</td><td>${coachStat(k,st)}</td><td>${fcx(b7&&b7.prod)}</td><td>${fcx(e8&&e8.prod)}${e8&&!e8.complet?'<br><small>incomplet</small>':''}</td>
     <td><input class="in w" data-af="${esc(k)}|an" inputmode="decimal" value="${esc(st.an||'')}" placeholder="/4"></td><td><b>${fcx(a1)}</b></td><td>${esc(rep||'–')}</td>
     <td><input class="in w" data-af="${esc(k)}|afl2" inputmode="decimal" value="${esc(st.afl2||'')}" placeholder="/${mx[0]}"></td><td><input class="in w" data-af="${esc(k)}|afl3" inputmode="decimal" value="${esc(st.afl3||'')}" placeholder="/${mx[1]}"></td><td><b>${fcx(tot)}</b></td></tr>`}).join('');
  const al=classAlerts(V.pc);const ic={qr:'📵',ko:'🎯',abs:'🚫',coach:'⏱'};
  return `<section class="card">${sel}${al.length?`<details class="alerts" open><summary>⚠ ${al.length} point${al.length>1?'s':''} d’attention</summary><ul>${al.map(a=>`<li><span>${ic[a[0]]}</span>${a[1]}</li>`).join('')}</ul></details>`:''}
  <div class="tw"><table class="tt pt">${head}${rows}</table></div><p class="muted small">Case = réussites / tentées (mesures dans la zone à partir de S4) · ★2 / ★3 = étoiles AFL2 / AFL3. Touche une case pour le détail, ↺ pour le QR de restauration. Produire /8 = zone /3 + continuité /2 + sécurité /2 + plan /1 ; l’analyse /4 est à saisir. AFL2 / AFL3 selon la répartition choisie en S4.</p></section>`;
}
function profSeance(){
  const sel=clsSel();if(!V.ps)V.ps='s1';const sid=V.ps;
  return `<section class="card">${sel}<div class="seg">${SESS.map(s=>`<button class="chip ${sid===s.id?'on':''}" data-ps="${s.id}">${s.n}</button>`).join('')}</div>
  ${V.pc?`<div class="tw"><table class="tt pt"><tr><th>Élève</th><th>Réussites</th><th>Coach a vu</th><th>Effort · charge</th><th>Décision</th><th>Prochaine fois</th><th>★ AFL2</th><th>★ AFL3</th></tr>${studs(V.pc).map(([k,st])=>{const d=st.seances[sid];const sr=starOf(k,sid);
    if(!d)return `<tr class="no"><th class="l">${nm(st)}</th><td colspan="7">pas de QR pour cette séance</td></tr>`;
    if(d.st==='abs')return `<tr class="no"><th class="l">${nm(st)}</th><td colspan="7">absent(e)</td></tr>`;
    const [t,n]=tenR(runOf(st),sid);const bl=d.bl||{};const cr=(bl.cr||[]).filter(Boolean).length;
    return `<tr><th class="l">${nm(st)}${d.st==='bl'?'<br><small>ne pratique pas</small>':''}${d.cx?'<br><small>coach : '+esc(d.cx.n)+'</small>':''}</th><td>${n?t+'/'+n:'–'}</td><td>${cr}/3</td><td>${bl.rpe!=null&&bl.rpe!==''?'RPE '+esc(bl.rpe)+' · '+chargeOf(d)+' UA':'–'}</td><td>${esc(DEC_TXT[bl.dc]||'–')}</td><td class="l small">${esc(bl.nx||'')}</td>
     <td><button class="star ${sr.a2?'on':''}" data-star="${esc(k)}|${sid}|a2">★</button></td><td><button class="star ${sr.a3?'on':''}" data-star="${esc(k)}|${sid}|a3">★</button></td></tr>`}).join('')}</table></div>`:''}</section>`;
}
function profDefis(){
  const sel=clsSel();if(!V.pc)return `<section class="card">${sel}</section>`;
  const S=studs(V.pc);const groups={};S.forEach(([k,st])=>{const g=binOf(k,st)||k;(groups[g]=groups[g]||[]).push([k,st])});
  const rows=Object.values(groups).map(m=>{const sc=m.map(([k,st])=>{const mate=m.find(x=>x[0]!==k);return {st,s:scoreRun(runOf(st)),bg:badgesOf(runOf(st),mate?runOf(mate[1]):null)}});return {m:sc,tot:sc.reduce((a,x)=>a+x.s.tot,0)}}).sort((a,b)=>b.tot-a.tot);
  return `<section class="card">${sel}<h2>Défis · ${esc(V.pc)}</h2><p class="muted small">Score du binôme = points Juste Pouls + Pile dans la cible de S3 à S7. Badges : ${BADGES.map(b=>b[1]).join(', ')}.</p>
  <div class="tw"><table class="tt pt"><tr><th>#</th><th>Binôme</th><th>Juste Pouls</th><th>Cible</th><th>Total</th><th>Badges</th></tr>${rows.map((r,i)=>`<tr><td>${i+1}</td><th class="l">${r.m.map(x=>nm(x.st)).join('<br>')}</th><td>${r.m.map(x=>x.s.jp).join('<br>')}</td><td>${r.m.map(x=>x.s.ci).join('<br>')}</td><td><b>${r.tot}</b></td><td class="l small">${r.m.map(x=>x.bg.length?x.bg.map(k=>'🏅 '+BADGES.find(b=>b[0]===k)[1]).join(' '):'–').join('<br>')}</td></tr>`).join('')}</table></div>
  <p class="muted small">Le classement sert à animer la séance ; il n’entre pas dans la note.</p></section>`}
function unsentOf(b){let n=0;SESS.forEach(s=>{const st=sessState(b,s.id);if(st==='wip'||st==='resend')n++});return n}
function profData(){
  const n=Object.keys(PDB.students).length;const tc=[...new Set(DB.binomes.map(b=>b.classe))].sort();const stu=DB.opts.dev==='stu';
  return `${stu?`<section class="card thin"><p class="small">Cet appareil est déclaré <b>tablette d’élève</b> : aucune donnée de classe n’y est stockée. <button class="lnk small" data-act="devreset">Changer</button></p></section>`:`<section class="card"><h2>Données du prof</h2><p>${n} élève(s) enregistré(s) sur cet appareil.</p>
  <div class="row wrap"><button class="btn pri" data-act="csv">Export CSV de la classe ${esc(V.pc||'')}</button><button class="btn" data-act="backup">Sauvegarde complète (JSON)</button><label class="btn">Restaurer une sauvegarde<input type="file" accept=".json,application/json" id="restore" hidden></label></div>
  <p class="muted small">Sur iPad, ajoute l’application à l’écran d’accueil : Safari efface sinon les données d’un site non ouvert pendant 7 jours. Fais une sauvegarde après chaque séance.</p>
  <h3>Présenter l’appli à un collègue</h3><p class="small">Lien de démonstration (classe fictive, aucune donnée réelle) : <b>${esc(location.origin+location.pathname)}?demo</b></p>
  <h3>Code du mode prof</h3><div class="row"><input class="in w" id="newcode" value="${esc(DB.code)}"><button class="btn" data-act="setcode">Changer</button></div>
  <h3>Effacer les données du prof</h3><button class="btn ghost" data-act="wipecls">Effacer la classe ${esc(V.pc||'')} de mes données</button>
  <p class="small">Cet appareil est déclaré <b>appareil du prof</b>. <button class="lnk small" data-act="devreset">Changer</button></p></section>`}
  <section class="card"><h2>Réglages de cette tablette (élèves)</h2>
  <label class="tog"><input type="checkbox" id="optdark" ${DB.opts.dark?'checked':''}> Mode sombre</label>
  <label class="tog"><input type="checkbox" id="optini" ${DB.opts.ini?'checked':''}> Nom de famille : <b>initiale seulement</b> à la création des binômes</label>
  <button class="btn sm" data-act="applyini">Réduire les noms déjà saisis à l’initiale</button>
  <h3>Fin de cycle : effacer une classe de cette tablette</h3>
  ${tc.length?`<ul class="wl">${tc.map(c=>{const bs=DB.binomes.filter(b=>b.classe===c);const u=bs.reduce((s,b)=>s+unsentOf(b),0);
    return `<li><span><b>${esc(c)}</b> · ${bs.length} binôme(s)${u?` · <span class="warn">${u} séance(s) jamais scannée(s)</span>`:' · tout est envoyé'}</span><button class="btn sm ghost" data-wipet="${esc(c)}">Effacer</button></li>`}).join('')}</ul>`:'<p class="muted">Aucun binôme sur cette tablette.</p>'}
  <p class="ver">Carnet step ${APP_VERSION}</p></section>`;
}
function detailModal(k,sid){
  const st=PDB.students[k];const d=st.seances[sid];const s=SBY[sid];const run=runOf(st);const f=filOf(run);const z=zoneFor(run,f);
  const [t,n]=tenR(run,sid);const bl=d.bl||{};const L=[];const v=x=>esc(x==null||x===''?'–':x);
  const fcl=(arr)=>arr.map(x=>x&&x.fc!=null?esc(x.fc)+(x.rp!=null?' ('+esc(x.rp)+')':''):'·').join(' · ');
  if(d.fcr)L.push(['FC de repos','provisoire '+v(d.fcr.pv)+' · matins '+(d.fcr.m||[]).map(x=>x||'·').join(' / ')]);
  if(d.pm)L.push(['Pas réussis',esc(d.pm.join(', '))]);
  ['m1','lv','lg'].forEach(key=>{if(d[key])L.push([{m1:'Premier effort',lv:'Test des leviers',lg:'Effort long'}[key],fcl(d[key])])});
  [1,2,3].forEach(i=>{const x=d['b'+i];if(x)L.push(['Bloc '+i,'enchaînés '+v(x.en)+' · erreurs '+v(x.er)+(x.df&&x.df.length?' · difficiles : '+esc(x.df.join(', ')):'')])});
  if(d.zc)L.push(['Calcul des zones',['mx','fr','a0','a1','b0','b1'].map(q=>v(d.zc[q])).join(' · ')+(d.zc.vu?' · vérifié':'')]);
  if(d.co)L.push(['Coordination',Object.entries(d.co).map(([k,x])=>(COORD[k]?COORD[k][0]:k)+' : '+(x==='1'?'réussi':x==='n'?'pas meneur':'pas encore')).join(' · ')]);
  if(d.tri)L.push(['3 blocs enchaînés seul',d.tri==='1'?'oui (badge Mémoire)':'pas encore']);
  if(d.vs)L.push(['Viser le milieu (zone '+v(d.vs.f)+')',[1,2].map(i=>d.vs[i]?v(regTot(d.vs[i].r))+' → '+v(d.vs[i].fc)+(d.vs[i].an?' (annonce '+esc(d.vs[i].an)+')':''):'·').join(' · ')]);
  if(DEFI_S.includes(sid)){const sc=scoreSeance(sid,d,run);const an=annonces(d);if(an.length||sc.ci)L.push(['Défis','Juste Pouls '+sc.jp+' pts ('+an.map(([a,f])=>a+'→'+f).join(', ')+')'+(sc.ci?' · cible '+sc.ci+' pts':'')])}
  if(d.cu)L.push(['Curseurs','basse '+v(regTot(d.cu.lo&&d.cu.lo.r))+' → '+v(d.cu.lo&&d.cu.lo.fc)+' · haute '+v(regTot(d.cu.hi&&d.cu.hi.r))+' → '+v(d.cu.hi&&d.cu.hi.fc)]);
  if(d.es)L.push(['Essai filière '+v(d.es.f),fcl(d.es.m||[])]);
  if(d.ch)L.push(['Choix','filière '+v(d.ch.f)+' · '+v(d.ch.rep)+'<br>'+[d.ch.a1,d.ch.a2,d.ch.a3].filter(Boolean).map(esc).join('<br>')]);
  if(d.wc)L.push(['Échauffement',(d.wc||[]).map(c=>esc(WARM_NAME[c]||c)).join(', ')]);
  if(d.ps)L.push(['Version perso',[1,2,3].map(i=>'B'+i+' '+v(regTot(d.ps['b'+i]))+(d.ps['b'+i]&&d.ps['b'+i].r?' ('+esc(d.ps['b'+i].r)+')':'')).join(' · ')]);
  if(d.rg)L.push(['Réglage 2 × 2 min',[1,2].map(i=>d.rg[i]?v(regTot(d.rg[i].r))+' → '+v(d.rg[i].fc):'·').join(' · ')]);
  if(d.pl)L.push(['Plan',(d.pl.r||[]).map(x=>v(x)).join(' / ')+(d.pl.si?' · '+esc(d.pl.si):'')]);
  if(d.fl)L.push(['Séance de filière (réglage · FC · arrêts)',((d.fl.m)||[]).map((x,i)=>x?v(x.fc)+(inZ(num(x.fc),z)?' ✓':' ✗')+(num(x.ar)?' · '+x.ar+' arr.':''):'·').join(' · ')+'<br>réglages : '+((d.fl.s)||[]).map(r=>v(regTot(r))).join(' / ')]);
  if(d.ob)L.push(['Coach juge','sécurité '+v(d.ob.sec)+' · plan '+v(d.ob.pl)]);
  if(d.an)L.push(['Analyse',[d.an.c,d.an.k,d.an.r].map(v).join('<br>')]);
  if(d.situe)L.push(['Se situe','AFL2 degré '+v(d.situe.a2)+' · AFL3 degré '+v(d.situe.a3)]);
  if(d.ad)L.unshift(['Présence','pratique adaptée']);if(d.st)L.unshift(['Présence',ST_TXT[d.st]+(d.mot?' · '+esc(d.mot):'')]);if(d.cx)L.unshift(['Coach remplaçant',esc(d.cx.n)+' · '+esc(WHY_TXT[d.cx.why]||'')]);
  const a=afl1(run,d);
  modal(`<h2>${esc(st.prenom)} ${esc(st.nom)} · ${s.n}</h2><p class="muted small">${f?'Filière '+f+' · zone '+(z?z[0]+'-'+z[1]:'?')+' · ':''}réussites ${n?t+'/'+n:'–'}${a&&(sid==='s7'||sid==='s8')?' · produire '+fcx(a.prod)+'/8':''}</p>
   <table class="tt l">${L.map(l=>`<tr><th>${l[0]}</th><td>${l[1]}</td></tr>`).join('')}
   <tr><th>Coach a vu</th><td>${s.crit.map((c,i)=>(bl.cr&&bl.cr[i]?'☑ ':'☐ ')+esc(c)).join('<br>')}</td></tr>
   <tr><th>Réussite / conseil</th><td>${v(bl.reu)} / ${v(bl.con)}</td></tr><tr><th>Effort · charge</th><td>${bl.rpe!=null&&bl.rpe!==''?'RPE '+esc(bl.rpe)+' · '+chargeOf(d)+' UA':'–'}</td></tr><tr><th>Coach</th><td>pronostic ${v(bl.pr)}${pronoErr(d)!=null?' (±'+R(pronoErr(d))+' %)':''} · conseil utile : ${bl.aide==='1'?'oui':bl.aide==='0'?'non':'–'}</td></tr>
   <tr><th>Décision · prochaine fois</th><td>${esc(DEC_TXT[bl.dc]||'–')} · ${v(bl.nx)}</td></tr></table>
   <div class="row wrap"><button class="btn" data-rest="${esc(k)}">↺ QR de restauration du binôme</button><button class="btn" data-act="closem">Fermer</button></div>`);
}
function restoreQrModal(k){const st=PDB.students[k];const bin=binOf(k,st);
  if(!bin)return toast('Pas d’identifiant de binôme : scanne d’abord un QR récent de cet élève.');
  const mates=Object.entries(PDB.students).filter(([kk,s])=>binOf(kk,s)===bin);
  const runs=mates.map(([kk,s])=>({i:s.ri!=null?s.ri:+(kk.split('|')[1]||0),p:s.prenom,n:s.nom,x:s.sexe,a:s.age,fr:s.fcrM,se:s.seances}));
  const str=restorePayload({b:bin,c:st.classe},runs);const parts=chunkPayload(str,650);let i=0;
  modal(`<h2>↺ Restauration · ${mates.map(([kk,s])=>esc(s.prenom)).join(' & ')}</h2><p class="muted small">Sur la tablette de l’élève : accueil → « Restaurer un binôme » → viser ce QR. Il défile (${parts.length} morceau${parts.length>1?'x':''}) : laisse la tablette visée jusqu’à 100 %.</p>
   <div class="qr" id="rqr">${qrSvg(parts[0])}</div><p class="center small" id="rqn">1 / ${parts.length}</p><div class="row center"><button class="btn" data-act="closem">Fermer</button></div>`);
  if(RQ.h)clearInterval(RQ.h);if(parts.length>1)RQ.h=setInterval(()=>{i=(i+1)%parts.length;const q=$('#rqr'),n=$('#rqn');if(!q){clearInterval(RQ.h);return}q.innerHTML=qrSvg(parts[i]);n.textContent=(i+1)+' / '+parts.length},1200)}
function csvExport(){
  const head=['Classe','Nom','Prénom','Sexe','Âge','FC repos','Filière','Zone bas','Zone haut','Juste Pouls','Cible','Badges','Défis coordination réussis','Réussites','Tentées','%','Degré AFL2',...SESS.map(s=>s.n+' réussites'),...SESS.map(s=>s.n+' ★AFL2'),...SESS.map(s=>s.n+' ★AFL3'),'S7 produire /8','S8 zone /3','S8 continuité /2','S8 sécurité /2','S8 plan /1','S8 produire /8','Analyse /4','AFL1 /12','Répartition','AFL2','AFL3','Total /20'];
  const Lr=[head];studs(V.pc).forEach(([k,st])=>{const run=runOf(st);const [TT,N]=stTotals(st);const f=filOf(run);const z=zoneFor(run,f);const b7=afl1(run,st.seances.s7),e8=afl1(run,st.seances.s8);
    const an=num(st.an),a2=num(st.afl2),a3=num(st.afl3);const a1=e8&&an!=null?e8.prod+an:null;
    const mate=Object.entries(PDB.students).find(([kk,s2])=>kk!==k&&binOf(kk,s2)&&binOf(kk,s2)===binOf(k,st));const sc=scoreRun(run);const bg=badgesOf(run,mate?runOf(mate[1]):null).map(x=>BADGES.find(b=>b[0]===x)[1]).join(' ');
    Lr.push([st.classe,st.nom,st.prenom,st.sexe||'',st.age||'',fcRepos(run)!=null?R(fcRepos(run)):'',f||'',z?z[0]:'',z?z[1]:'',sc.jp,sc.ci,bg,coordOf(run).map(k=>COORD[k][0]).join(' '),TT,N,N?R(100*TT/N):'',degreeOf(TT,N)||'',...SESS.map(s=>{const x=tenR(run,s.id);return x[1]?x[0]+'/'+x[1]:''}),...SESS.map(s=>starOf(k,s.id).a2?1:''),...SESS.map(s=>starOf(k,s.id).a3?1:''),
      b7?b7.prod:'',e8?e8.zn:'',e8?e8.co:'',e8&&e8.sec!=null?e8.sec:'',e8&&e8.pl!=null?e8.pl:'',e8?e8.prod:'',st.an||'',a1!=null?a1:'',(st.seances.s4&&st.seances.s4.ch&&st.seances.s4.ch.rep)||'',st.afl2||'',st.afl3||'',a1!=null&&a2!=null&&a3!=null?R((a1+a2+a3)*10)/10:''])});
  dl('carnet_step_'+norm(V.pc).replace(/\W+/g,'_')+'.csv','﻿'+Lr.map(r=>r.map(x=>{if(typeof x==='number')x=String(x).replace('.',',');x=String(x);return /[;"\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x}).join(';')).join('\n'),'text/csv');
}
{{dl}}
{{scan}}

/* ---------- événements ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('button,[data-go]');if(!t)return;const ds=t.dataset;
  if(ds.go){if(ds.go==='bin'&&!curBin())return go({v:'home'});return go({v:ds.go})}
  if(ds.cls!==undefined)return go({cls:ds.cls});
  if(ds.open)return go({v:'bin',bin:ds.open});
  if(ds.sess)return go({v:'sess',sid:ds.sess,ri:0,presOpen:false,cur:0});
  if(ds.ri)return go({ri:+ds.ri});
  if(ds.sx){t.parentNode.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));t.classList.add('on');return}
  if(ds.age){const [ri,a]=ds.age.split('|');curBin().runners[+ri].age=+a;save();return keepScroll(render)}
  if(ds.stp&&V.v==='sess'){const d=curD();const o=JSON.parse(ds.o||'{}');const dl_=+ds.dl;const cur=num(getPath(d,ds.stp));
    let nv=cur==null?(o.s0!=null?o.s0:(o.mn!=null?o.mn:0)):cur+dl_;if(o.mn!=null)nv=Math.max(o.mn,nv);if(o.mx!=null)nv=Math.min(o.mx,nv);nv=R(nv*10)/10;
    setPath(d,ds.stp,String(nv).replace('.',','));saveS();return keepScroll(render)}
  if(ds.set!==undefined&&V.v==='sess'){const d=curD();let val=ds.v;
    if(String(getPath(d,ds.set))===String(val)&&!ds.set.startsWith('bl.cr'))val='';setPath(d,ds.set,val);saveS();return keepScroll(render)}
  if(ds.tog&&V.v==='sess'){const d=curD();let a=getPath(d,ds.tog);if(!Array.isArray(a)){a=[];setPath(d,ds.tog,a)}const i=a.indexOf(ds.v);if(i>=0)a.splice(i,1);else a.push(ds.v);saveS();return keepScroll(render)}
  if(ds.sugg!==undefined&&V.v==='sess'){const d=curD();const c=getPath(d,'bl.con')||'';if(c.includes(ds.sugg))setPath(d,'bl.con',c.replace(ds.sugg,'').replace(/^\s*[;·]\s*|\s*[;·]\s*$/g,'').replace(/\s*;\s*;\s*/,' ; '));else setPath(d,'bl.con',(c?c.trim()+' ; ':'')+ds.sugg);saveS();return keepScroll(render)}
  if(ds.cur!==undefined){V.cur=+ds.cur;render();const st=$('.steps');if(st)window.scrollTo(0,Math.max(0,st.getBoundingClientRect().top+window.scrollY-70));return}
  if(ds.chf){CH.fmt=ds.chf;return render()}
  if(ds.ad!==undefined&&V.v==='sess'){const r=curBin().runners[+ds.ad],d=sd(r,V.sid);if(d.ad)delete d.ad;else d.ad='1';saveS();return keepScroll(render)}
  if(ds.qrp!==undefined)return qrModal(V.sid,+ds.qrp);
  if(ds.st!==undefined&&V.v==='sess'){const b=curBin(),r=b.runners[+ds.st],d=sd(r,V.sid);d.st=ds.v||'';if(!d.st)delete d.st;
    const o=b.runners[1-(+ds.st)],od=sd(o,V.sid);if(d.st==='abs'&&!(od.cx&&od.cx.n)){saveS();V.ri=1-(+ds.st);render();return coachModal()}
    if(!d.st&&od.cx&&od.cx.why==='abs'){delete od.cx}saveS();return keepScroll(render)}
  if(ds.cxw){t.parentNode.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));t.classList.add('on');return}
  if(ds.ptab)return go({ptab:ds.ptab});
  if(ds.pc!==undefined)return go({pc:ds.pc});
  if(ds.ps)return go({ps:ds.ps});
  if(ds.det){const [k,sid]=ds.det.split('|');return detailModal(k,sid)}
  if(ds.rest)return restoreQrModal(ds.rest);
  if(ds.wipet){const c=ds.wipet;const bs=DB.binomes.filter(b=>b.classe===c);const u=bs.reduce((s,b)=>s+unsentOf(b),0);V.wipet=c;
    return modal(`<h2>Effacer ${esc(c)} de cette tablette ?</h2><p>${bs.length} binôme(s) seront supprimés de cette tablette.</p>${u?`<p class="warn"><b>⚠ ${u} séance(s) n’ont jamais été scannées par le prof</b> : elles seront perdues.</p>`:'<p class="ok">Toutes les séances ont été envoyées au prof.</p>'}<div class="row wrap"><button class="btn ghost" data-act="wipetok">Effacer</button><button class="btn" data-act="closem">Annuler</button></div>`)}
  if(ds.star){const [k,sid,w]=ds.star.split('|');PDB.stars[k]=PDB.stars[k]||{};const s=PDB.stars[k][sid]=PDB.stars[k][sid]||{};s[w]=!s[w];psave();return keepScroll(render)}
  const a=ds.act;if(!a)return;
  const readRs=()=>[0,1].map(i=>({prenom:$('#np'+i).value.trim(),nom:$('#nn'+i).value.trim(),sexe:(document.querySelector(`#nx${i} .on`)||{dataset:{}}).dataset.v||'',age:+((document.querySelector(`#na${i} .on`)||{dataset:{}}).dataset.v||0)||null}));
  if(a==='create'){const cl=$('#ncl').value.trim();const rs=readRs();
    if(!cl||rs.some(r=>!r.prenom||!r.nom||!r.sexe||!r.age))return toast('Classe, prénoms, noms, fille/garçon et âge pour les deux élèves.');
    if(DB.opts.ini)rs.forEach(r=>r.nom=r.nom.charAt(0).toUpperCase());
    rs.forEach(r=>r.seances={});const b={id:uid(),classe:cl,runners:rs,sent:{}};DB.binomes.push(b);save();return go({v:'bin',bin:b.id,cls:cl})}
  if(a==='editbin')return go({v:'edit'});
  if(a==='saveedit'){const b=curBin();const cl=$('#ncl').value.trim();const rs=readRs();
    if(!cl||rs.some(r=>!r.prenom||!r.nom||!r.sexe||!r.age))return toast('Classe, prénoms, noms, fille/garçon et âge pour les deux élèves.');
    b.classe=cl;rs.forEach((r,i)=>{delete b.runners[i].ph;Object.assign(b.runners[i],r)});save();toast('Noms corrigés');return go({v:'bin'})}
  if(a==='delbin')return modal(`<h2>Supprimer ce binôme ?</h2>${unsentOf(curBin())?`<p class="warn">⚠ ${unsentOf(curBin())} séance(s) jamais scannée(s) par le prof seront perdues.</p>`:'<p>Toutes les séances ont été envoyées au prof.</p>'}<div class="row"><button class="btn ghost" data-act="delok">Supprimer</button><button class="btn" data-act="closem">Annuler</button></div>`);
  if(a==='delok'){DB.binomes=DB.binomes.filter(b=>b.id!==V.bin);save();closeModal();return go({v:'home'})}
  if(a==='onetog'){DB.opts.one=!oneMode();save();return keepScroll(render)}
  if(a==='presopen'){V.presOpen=true;return keepScroll(render)}
  if(a==='presclose'){V.presOpen=false;return keepScroll(render)}
  if(a==='chgo'){beep(700,60);return chStart()}
  if(a==='chpause'){if(!CH.run)return;chPause();return render(),chDraw()}
  if(a==='chstop'){chStop();return render()}
  if(a==='qrall'){const b=curBin();const [L,pl]=catchupPayload(b);if(!L.length)return toast('Tout est déjà envoyé.');markSent(b,L);render();
    return animQr('Rattrapage · '+L.map(s=>s.n).join(', '),esc(b.runners[0].prenom)+' & '+esc(b.runners[1].prenom)+' · '+esc(b.classe)+' · à montrer au prof',pl.length>600?chunkPayload(pl,600):[pl])}
  if(a==='shareall'){const b=curBin();const [L,pl]=catchupPayload(b);if(!L.length)return toast('Tout est déjà envoyé.');const name='carnet_step_'+norm(b.classe+'_'+b.runners[0].prenom+'_'+b.runners[1].prenom).replace(/\W+/g,'_')+'.txt';
    const f=new File([pl],name,{type:'text/plain'});const ok=()=>{markSent(b,L);render();toast('Fichier envoyé')};
    if(navigator.canShare&&navigator.canShare({files:[f]}))return navigator.share({files:[f],title:'Carnet step'}).then(ok).catch(()=>{});dl(name,pl,'text/plain');return ok()}
  if(a==='qr')return qrModal(V.sid);
  if(a==='chcoach')return coachModal();
  if(a==='restore')return restoreScanModal();
  if(a==='rscan')return startScan(restoreRaw);
  if(a==='rpaste')return restoreRaw($('#rpaste').value);
  if(a==='cxok'){const n=$('#cxn').value.trim();if(!n)return toast('Écris le prénom du coach remplaçant.');const w=(document.querySelector('#cxw .on')||{}).dataset?.cxw||'abs';curD().cx={n,why:w};saveS();closeModal();return keepScroll(render)}
  if(a==='cxdel'){delete curD().cx;saveS();closeModal();return keepScroll(render)}
  if(a==='copy'){const ta=$('#qrtxt');ta.select();try{navigator.clipboard.writeText(ta.value)}catch(e){document.execCommand('copy')}return toast('Texte copié')}
  if(a==='closem')return closeModal();
  if(a==='reload')return location.reload();
  if(a==='prof')return modal(`<h2>Mode prof</h2><input class="in" id="pcode" type="password" inputmode="numeric" placeholder="Code"><div class="row"><button class="btn pri" data-act="profok">Entrer</button><button class="btn" data-act="closem">Annuler</button></div>`);
  if(a==='profok'){if($('#pcode').value!==DB.code)return toast('Code incorrect');closeModal();
    if(!DB.opts.dev)return modal(`<h2>Quel est cet appareil ?</h2><p>Les données de toute la classe ne doivent être stockées que sur <b>un seul appareil : celui du prof</b>. Jamais sur une tablette d’élève.</p>
      <div class="row wrap"><button class="btn pri" data-act="devprof">C’est mon appareil (prof)</button><button class="btn" data-act="devstu">C’est une tablette d’élève</button></div><p class="muted small">Sur une tablette d’élève, le mode prof ne donne accès qu’aux réglages de la tablette et au chrono.</p>`);
    return go({v:'prof',ptab:DB.opts.dev==='stu'&&!['data','chrono'].includes(V.ptab)?'data':V.ptab})}
  if(a==='devprof'||a==='devstu'){DB.opts.dev=a==='devprof'?'prof':'stu';save();closeModal();return go({v:'prof',ptab:a==='devprof'?'scan':'data'})}
  if(a==='devreset'){delete DB.opts.dev;save();return go({v:'home'})}
  if(a==='scan')return startScan(handleRaw);
  if(a==='stopscan')return stopScan();
  if(a==='paste'){handleRaw($('#paste').value);$('#paste').value='';return}
  if(a==='csv'){if(!V.pc)return toast('Choisis une classe dans l’onglet Classe.');return csvExport()}
  if(a==='backup')return dl('carnet_step_prof_sauvegarde.json',JSON.stringify(PDB),'application/json');
  if(a==='setcode'){DB.code=$('#newcode').value.trim()||'1275';save();return toast('Code changé')}
  if(a==='applyini'){let n=0;DB.binomes.forEach(b=>b.runners.forEach(r=>{if(r.nom&&r.nom.length>1){r.nom=r.nom.charAt(0).toUpperCase();n++}}));save();return toast(n+' nom(s) réduit(s) à l’initiale')}
  if(a==='wipetok'){const c=V.wipet;DB.binomes=DB.binomes.filter(b=>b.classe!==c);if(V.cls===c)V.cls='';save();closeModal();toast(c+' effacée de la tablette');return render()}
  if(a==='wipecls'){if(!V.pc)return;return modal(`<h2>Effacer ${esc(V.pc)} ?</h2><p>Fais d’abord une sauvegarde.</p><div class="row"><button class="btn ghost" data-act="wipeok">Effacer</button><button class="btn" data-act="closem">Annuler</button></div>`)}
  if(a==='wipeok'){Object.keys(PDB.students).forEach(k=>{if(PDB.students[k].classe===V.pc)delete PDB.students[k]});psave();closeModal();return go({pc:''})}
});
{{keep}}
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.p&&V.v==='sess'){const b=curBin(),r=b.runners[V.ri||0],d=sd(r,V.sid);setPath(d,el.dataset.p,el.value);saveS()}
  if(el.dataset.fm!==undefined){curBin().runners[+el.dataset.fm].fcrM=el.value;save()}
  if(el.dataset.af){const [k,f]=el.dataset.af.split('|');PDB.students[k][f]=el.value;psave()}
});
document.addEventListener('change',e=>{const el=e.target;
  if((el.dataset.p&&V.v==='sess')||el.dataset.fm!==undefined||el.dataset.af)keepScroll(render);
  if(el.id==='chvoice'){CH.voice=el.checked;return}
  if(el.id==='optdark'){DB.opts.dark=el.checked;save();document.documentElement.dataset.theme=el.checked?'dark':'light';return}
  if(el.id==='optini'){DB.opts.ini=el.checked;save();toast(el.checked?'Initiale seulement pour les nouveaux binômes':'Nom complet')}
  if(el.id==='qrphoto'&&el.files[0])decodePhoto(el.files[0]);
  if(el.id==='qrfile')[...el.files].forEach(f=>{const r=new FileReader();r.onload=()=>handleRaw(r.result);r.readAsText(f)});
  if(el.id==='restore'&&el.files[0]){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o.students)throw 0;PDB=Object.assign({students:{},stars:{}},o);psave();toast('Sauvegarde restaurée');render()}catch(x){toast('Fichier invalide')}};r.readAsText(el.files[0])}
});
{{tail}}
/* ===================== MODE DÉMO : classe fictive pour présenter le carnet aux collègues ===================== */
function demoRnd(seed){let s=seed;return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646}}
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
  add('s3',{co:{ronde:'1',annonce:rnd()<.6?'1':'0'},b3:{en:S(3+Math.floor(rnd()*3)),er:S(Math.floor(rnd()*3))},lg:[mes(l1),mes(l2)],lgar:rnd()<.7?'0':'1',bl:BL(2)});
  const lo=at(.58)+E(4),hi=at(.86)+E(4),v1=mid+E(10),v2=inz();
  add('s4',{tri:rnd()<.7?'1':'0',co:{chef:flags.chef||'n'},cu:{lo:{r:{H:'0',B:'0',P:'0',A:'0'},...mes(lo)},hi:{r:{H:'1',B:'2',P:'2',A:'1'},...mes(hi)}},vs:{f:p.f,1:{r:reg(p.f),...mes(v1)},2:{r:reg(p.f),...mes(v2)}},
    es:{f:p.f,m:mesures(p.f,'s4').map(()=>mes(inz()))},ch:{f:p.f,a1:p.f==='A'?'J’aime les efforts courts et forts':'Je tiens longtemps sans m’arrêter',a2:p.f==='A'?'2 mesures sur 3 dans la zone A':'2 mesures sur 2 dans la zone B',a3:J(['Préparer le cross','M’entretenir','Améliorer mon cardio','Préparer un concours']),rep:J(['6/2','4/4','4/4','2/6'])},bl:BL(3)});
  const m5=mesures(p.f,'s5').map(()=>inz()),r1=mid-6+E(4),r2=inz();
  add('s5',{wc:['so','br','bs','ge','b1','b2','b3','fi'].filter(()=>rnd()<.9),co:{chef:flags.chef5||'n'},ps:{b1:reg(p.f),b2:reg(p.f),b3:reg(p.f)},rg:{1:{r:reg(p.f),...mes(r1)},2:{r:reg(p.f),...mes(r2)}},fl:{s:[reg(p.f)],m:m5.map(v=>({...mes(v),ar:rnd()<.85?'0':'1'}))},bl:BL(4,m5[0])});
  const m6=mesures(p.f,'s6').map(()=>inz());
  add('s6',{wc:['so','br','bs','ge','b1','b2','b3','fi','fc'],co:{chef:'n'},fl:{m:m6.map(v=>({...mes(v),ar:'0'}))},ob:{sec:J(['2','1.5','1.5']),pl:J(['1','1','0.5'])},bl:BL(5,m6[0])});
  return se}
function demoInit(){
  if(!DB.demoSeeded){
    const rnd=demoRnd(20261029);
    const mk=(a,b,nsess,sentN,fl)=>{const bin={id:'demo'+uid(),classe:'2nde Démo',runners:[a,b].map((r,i)=>({prenom:r.p,nom:r.n,sexe:r.x,age:r.a,seances:demoRunner(r,rnd,nsess,(fl||[])[i]||{})})),sent:{}};
      SESS.slice(0,sentN).forEach(s=>bin.sent[s.id]=Date.now()-86400e3);return bin};
    const B=[mk({p:'Léa',n:'Martin',x:'F',a:15,rep:66,f:'B',pr:.8,dev:5},{p:'Hugo',n:'Bernard',x:'G',a:16,rep:58,f:'A',pr:.7,dev:8},6,6,[{chef:'1'},{}]),
             mk({p:'Inès',n:'Durand',x:'F',a:15,rep:72,f:'B',pr:.6,dev:9},{p:'Tom',n:'Petit',x:'G',a:15,rep:64,f:'B',pr:.75,dev:6},6,6,[{},{chef5:'1'}]),
             mk({p:'Chloé',n:'Moreau',x:'F',a:16,rep:60,f:'A',pr:.85,dev:4},{p:'Yanis',n:'Robert',x:'G',a:16,rep:62,f:'A',pr:.55,dev:11},6,5),
             mk({p:'Sarah',n:'Faure',x:'F',a:15,rep:70,f:'B',pr:.7,dev:7},{p:'Nathan',n:'Blanc',x:'G',a:15,rep:61,f:'A',pr:.65,dev:8},5,5)];
    /* quelques situations à montrer : absence + coach remplaçant, pratique adaptée */
    B[1].runners[1].seances.s3={st:'abs'};B[1].runners[0].seances.s3.cx={n:'Yanis R.',why:'abs'};
    B[2].runners[0].seances.s4.ad='1';
    DB.binomes=B;DB.opts.dev='prof';DB.demoSeeded=1;save();
    PDB={students:{},stars:{},schema:SCHEMA};
    DB.binomes.forEach(b=>SESS.forEach(s=>{if(b.sent[s.id])try{profAddAny(qrPayload(b,s.id))}catch(e){}}));
    Object.keys(PDB.students).forEach((k,i)=>{PDB.stars[k]={s3:{a2:i%2===0},s6:{a3:i%3===0}}});
    psave();
  }
  const bar=document.createElement('div');bar.id='demobar';
  bar.innerHTML=`<b>DÉMO</b><span>classe fictive, vos vraies données ne sont pas touchées</span><button data-act="demoeleve"><i>Côté&nbsp;</i>élève</button><button data-act="demoprof"><i>Côté&nbsp;</i>prof</button><button data-act="demoreset" title="Réinitialiser la démo">↺<i>&nbsp;Réinitialiser</i></button>${window.CARNET_DEMO?'':`<a href="${location.pathname}" title="Quitter la démo">✕<i>&nbsp;Quitter</i></a>`}`;
  document.body.insertBefore(bar,document.body.firstChild);
  document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act;
    if(a==='demoeleve'){closeModal();go({v:'home'})}
    if(a==='demoprof'){closeModal();if(!DB.opts.dev){DB.opts.dev='prof';save()}go({v:'prof',ptab:'classe',pc:'2nde Démo'})}
    if(a==='demoreset'){try{localStorage.removeItem(SK);localStorage.removeItem(PSK)}catch(x){}location.reload()}},true);
}
if(DEMO)demoInit();
render();
