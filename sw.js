/* Hors ligne : l'appli élève, l'outil prof (prof/) et l'ancien carnet sont mis en cache à la 1re ouverture (Wi-Fi), puis fonctionnent sans réseau.
   Après une modification : augmenter le numéro de C (carnet-step-v10 → v11…). */
const C='carnet-step-v10';
// Toutes les applis partagent le même stockage (même adresse github.io) : on n'efface QUE les anciennes versions de CETTE appli.
const MES_CACHES=/^carnet-step-v\d+$/;

// Wi-Fi faible au gymnase : si le réseau ne répond pas en 3 s, on ouvre la copie gardée sur l'appareil.
const sous3s=p=>{p.catch(()=>{});return Promise.race([p,new Promise((_,non)=>setTimeout(()=>non(new Error('réseau lent')),3000))])};
const FILES=['./','index.html','style.css','donnees.js','logique.js','qrcode.js','jsqr.js','scan.js','vues.js','chrono.js','app.js','demo-commun.js','demo.js','aide.js','eps-aide.js','eps-charte-v1.css',
  'polices/archivo.woff2','polices/atkinson-400.woff2','polices/atkinson-700.woff2','manifest.webmanifest','icon-192.png','icon-180.png','icon-32.png','icon-512.png',
  'index-old.html','aide-old.js',
  'prof/','prof/index.html','prof/style.css','prof/prof.js','prof/prof-demo.js','prof/aide.js','prof/jszip.js','prof/xlsx.js','prof/manifest.webmanifest','prof/icon-192.png','prof/icon-180.png','prof/icon-32.png','prof/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(FILES.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>MES_CACHES.test(k)&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  const net=fetch(e.request).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r});
  e.respondWith(sous3s(net).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||(e.request.mode==='navigate'?caches.match(new URL(e.request.url).pathname.includes('/prof/')?'prof/index.html':'index.html'):null)).then(r=>r||net)))});
