/* Hors ligne : l'application est mise en cache à la 1re ouverture (Wi-Fi), puis fonctionne sans réseau. */
const C='carnet-step-v7';
// Toutes les applis partagent le même stockage (même adresse github.io) : on n'efface QUE les anciennes versions de CETTE appli.
const MES_CACHES=/^carnet-step-v\d+$/;

// Wi-Fi faible au gymnase : si le réseau ne répond pas en 3 s, on ouvre la copie gardée sur l'appareil.
const sous3s=p=>{p.catch(()=>{});return Promise.race([p,new Promise((_,non)=>setTimeout(()=>non(new Error('réseau lent')),3000))])};
const FILES=['./','index.html','eps-charte-v1.css','polices/archivo.woff2','polices/atkinson-400.woff2','polices/atkinson-700.woff2','manifest.webmanifest','icon-192.png', 'icon-180.png', 'icon-32.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>MES_CACHES.test(k)&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  const net=fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r});
  e.respondWith(sous3s(net).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html')).then(r=>r||net)))});
