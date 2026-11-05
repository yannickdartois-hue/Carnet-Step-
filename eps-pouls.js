/* eps-pouls.js · Prise de pouls assistée, commune aux applis EPS de Pompidou (v1)
   Reprise de l'appli élève de cross training : 15 s comptées au bip, battements × 4,
   cœur qui bat et électrocardiogramme, FC de récupération à 1 min (facultative).
   Fichier autonome (styles inclus). Même fichier dans chaque dépôt : le modifier ici, puis le recopier.

   Utilisation :
     EPSPouls.ouvrir({
       titre:'FC en fin de série',        // facultatif
       note:'…',                          // facultatif : phrase sous le titre
       recup:true,                        // propose la FC de récupération après la 1re mesure
       onFC:v=>{…},                       // FC validée (pulsations/min)
       onRecup:v=>{…}                     // FC de récupération validée
     });
*/
(function(){
  'use strict';
  if(window.EPSPouls)return;
  const CSS=`
#eps-pouls{position:fixed;inset:0;z-index:9000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;
  font-family:"Atkinson Hyperlegible",system-ui,sans-serif;color:#1c2128;-webkit-tap-highlight-color:transparent}
#eps-pouls .ep-c{background:#fff;border-radius:16px;max-width:460px;width:100%;max-height:100%;overflow:auto;padding:18px 18px 16px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.3)}
#eps-pouls h2{margin:0 0 4px;font:800 24px/1.2 Archivo,system-ui,sans-serif;color:#7f1d1d}
#eps-pouls .ep-n{margin:0 0 10px;font-size:16px;color:#5b6470}
#eps-pouls .ep-p{margin:6px 0 10px;font-size:18px;line-height:1.4}
#eps-pouls .ep-coeur svg{width:84px;height:76px;fill:#dc2626;animation:ep-bat .8s ease-in-out infinite;filter:drop-shadow(0 4px 8px rgba(220,38,38,.35))}
#eps-pouls .ep-coeur.calme svg{animation:none}
#eps-pouls .ep-t{font:800 72px/1 Archivo,system-ui,sans-serif;color:#1c2128;margin:4px 0}
#eps-pouls .ep-ecg{width:100%;height:56px;display:block;background:linear-gradient(#fde2e2 1px,transparent 1px) 0 0/100% 10px,#fff;border-radius:8px;margin:6px 0 10px}
#eps-pouls .ep-ecg path{fill:none;stroke:#dc2626;stroke-width:2.2;stroke-linejoin:round;vector-effect:non-scaling-stroke}
#eps-pouls .ep-defile{animation:ep-ecg 1.6s linear infinite}
#eps-pouls input{width:100%;min-height:64px;border-radius:12px;border:1.5px solid #cbd5e1;text-align:center;font:800 34px Archivo,system-ui,sans-serif;color:#1c2128;background:#fff}
#eps-pouls .ep-res{margin:8px 0;font-size:18px;color:#5b6470;min-height:26px}
#eps-pouls .ep-res b{color:#15803d}
#eps-pouls .ep-l{display:flex;gap:10px;margin-top:10px}
#eps-pouls button{font:700 18px "Atkinson Hyperlegible",system-ui,sans-serif;min-height:56px;border-radius:14px;border:1.5px solid #dde2e8;background:#fff;color:#1c2128;padding:8px 14px;flex:1;cursor:pointer}
#eps-pouls button.pl{background:#dc2626;border-color:#dc2626;color:#fff}
#eps-pouls button.go{width:100%;min-height:72px;font-size:22px}
#eps-pouls button.rec{background:#e0f2fe;border-color:#bae6fd;color:#0c4a6e}
#eps-pouls button:disabled{opacity:.45}
#eps-pouls .ep-lien{background:none;border:0;min-height:48px;color:#5b6470;text-decoration:underline;font-weight:400;width:100%;margin-top:6px}
#eps-pouls .ep-ok{margin:8px 0;padding:10px 14px;border-radius:12px;background:#f0fdf4;color:#14532d;font-size:18px}
#eps-pouls .ep-rec{margin:8px 0;padding:10px 14px;border-radius:12px;background:#f0f9ff;color:#0c4a6e;font-size:18px}
#eps-pouls .ep-c.rec{background:#f8fcff}
#eps-pouls .ep-av{margin:8px 0 0;font-size:15px;color:#92400e;background:#fffbeb;border-radius:10px;padding:8px 10px}
.eps-pouls-bt{display:inline-flex;align-items:center;gap:6px;min-height:48px;padding:6px 12px;margin:4px 0;border-radius:12px;border:1.5px solid #fecaca;background:#fee2e2;color:#7f1d1d;
  font:700 max(15px,var(--fs-min,15px))/1.2 "Atkinson Hyperlegible",system-ui,sans-serif;cursor:pointer;vertical-align:middle}
.eps-pouls-bt{align-self:flex-start}
.eps-pouls-bt span{color:#dc2626;font-size:20px}
.eps-pouls-bt.secours{background:#fff;border-color:#dde2e8;color:#5b6470;font-weight:400}
.eps-pouls-info{display:block;font-size:max(15px,var(--fs-min,15px));color:#0c4a6e;margin:2px 0 4px}
.eps-pouls-tag{display:inline-block;font-size:max(15px,var(--fs-min,15px));color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:1px 8px;margin:2px 0}
@keyframes ep-bat{0%,100%{transform:scale(1)}15%{transform:scale(1.18)}30%{transform:scale(.96)}45%{transform:scale(1.1)}}
@keyframes ep-ecg{from{transform:translateX(0)}to{transform:translateX(-200px)}}
@media (prefers-reduced-motion:reduce){#eps-pouls .ep-coeur svg,#eps-pouls .ep-defile{animation:none}}
@media print{#eps-pouls,.eps-pouls-bt{display:none!important}}`;
  const st=document.createElement('style');st.id='eps-pouls-css';st.textContent=CSS;(document.head||document.documentElement).appendChild(st);

  const COEUR='<svg viewBox="0 0 32 29"><path d="M16 29 2.6 15.4A8 8 0 0 1 14 4.2L16 6.2l2-2A8 8 0 0 1 29.4 15.4Z"/></svg>';
  const ECG='M0 20H28L33 17L38 20H44L47 25L51 3L55 34L59 20H68Q74 13 80 20H100';
  const ecg=()=>`<svg class="ep-ecg" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><g class="ep-defile">${[0,100,200,300].map(x=>`<path d="${ECG}" transform="translate(${x} 0)"/>`).join('')}</g></svg>`;
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let AC=null;
  function son(f,dur,vol){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
    const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.connect(g);g.connect(AC.destination);
    const t=AC.currentTime;g.gain.setValueAtTime(vol||.5,t);g.gain.exponentialRampToValueAtTime(.001,t+(dur||.2));o.start(t);o.stop(t+(dur||.2)+.02)}catch(e){}}
  const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
  const appreciation=d=>d>=30?'très bonne récupération':d>=20?'bonne récupération':'récupération lente';

  let S=null,T=null,boite=null;
  function fermer(){clearInterval(T);T=null;S=null;if(boite){boite.remove();boite=null}document.removeEventListener('keydown',clavier,true)}
  function clavier(e){if(!S)return;if(e.key==='Escape'){e.preventDefault();fermer()}
    else if(e.key==='Enter'&&S.etat==='saisie'){e.preventDefault();valider()}}

  function peindre(){if(!boite||!S)return;const o=S.o,rec=S.rec;let h='';
    const titre=`<h2>${rec?'FC de récupération':esc(o.titre||'Prendre mon pouls')}</h2>${!rec&&o.note?`<p class="ep-n">${esc(o.note)}</p>`:''}`;
    if(S.etat==='pret')h=`${titre}<div class="ep-coeur calme" aria-hidden="true">${COEUR}</div>
      <p class="ep-p"><b>Pose deux doigts</b> sur le cou ou le poignet (jamais le pouce), sens les battements, puis touche Départ.</p>
      <button type="button" class="pl go" data-ep="go">❤ Départ : 15 s</button><button type="button" class="ep-lien" data-ep="x">Annuler</button>`;
    else if(S.etat==='attente'){const r=Math.max(0,Math.ceil(60-(Date.now()-S.debut)/1000));
      h=`${titre}<p class="ep-p"><b>Récupère, reste debout et marche doucement.</b></p><div class="ep-t" aria-live="off">${r}</div>
      <p class="ep-p">Au bip, pose tes doigts et compte 15 s.</p><button type="button" class="ep-lien" data-ep="x">Annuler</button>`}
    else if(S.etat==='compte'){const r=Math.max(0,Math.ceil(15-(Date.now()-S.debut)/1000));
      h=`${titre}<div class="ep-coeur" aria-hidden="true">${COEUR}</div><div class="ep-t" aria-live="off">${r}</div>
      <p class="ep-p">Compte tes battements… le bip te dira d’arrêter.</p>${ecg()}<button type="button" class="ep-lien" data-ep="x">Annuler</button>`}
    else if(S.etat==='saisie'){const n=+S.n,ok=n>=10&&n<=58;
      h=`${titre}<label for="ep-n" class="ep-p" style="display:block"><b>Combien de battements as-tu comptés ?</b></label>
      <input id="ep-n" type="number" inputmode="numeric" min="5" max="60" placeholder="ex. 38" value="${esc(S.n)}" autocomplete="off">
      <p class="ep-res">${ok?`${n} × 4 = <b>${n*4} pulsations/min</b>`:S.n!==''?'Entre 10 et 58 battements en 15 s : recompte.':'Tape le nombre compté : l’appli le multiplie par 4.'}</p>
      <div class="ep-l"><button type="button" data-ep="re">Recommencer</button><button type="button" class="pl" data-ep="ok"${ok?'':' disabled'}>Valider${ok?' '+n*4:''}</button></div>
      <button type="button" class="ep-lien" data-ep="x">Annuler</button>`}
    else if(S.etat==='apres')h=`${titre}<p class="ep-ok">FC notée : <b>${S.fc} pulsations/min</b></p>
      <button type="button" class="rec go" data-ep="rec">⏱ FC de récupération<br><small style="font-weight:400;font-size:15px">Reprends ton pouls dans 1 min : on mesure combien il a baissé</small></button>
      <button type="button" class="ep-lien" data-ep="x">Terminé</button>`;
    else if(S.etat==='fin'){const d=Math.max(0,S.fc-S.fcRec);
      h=`${titre}<p class="ep-rec">Récupération : <b>${S.fc} → ${S.fcRec}</b><br><b>−${d}</b> pulsations en 1 min : ${appreciation(d)}</p>
      <button type="button" class="pl go" data-ep="x">Terminé</button>`}
    if(o.avertissement&&!rec&&S.etat!=='apres'&&S.etat!=='fin')h+=`<p class="ep-av">${esc(o.avertissement)}</p>`;
    boite.innerHTML=`<div class="ep-c${rec?' rec':''}" role="dialog" aria-modal="true" aria-label="Prise de pouls">${h}</div>`;
    const i=boite.querySelector('#ep-n');if(i){i.focus();const L=i.value.length;try{i.setSelectionRange(L,L)}catch(e){}}}

  function majTexte(){const r=S.etat==='attente'?60-(Date.now()-S.debut)/1000:15-(Date.now()-S.debut)/1000;
    const t=boite&&boite.querySelector('.ep-t');if(t)t.textContent=Math.max(0,Math.ceil(r));return r}
  function tick(){if(!S){clearInterval(T);T=null;return}
    if(S.etat==='attente'){if(majTexte()<=0){S.etat='compte';S.debut=Date.now();son(880,.15,.5);vib(120);peindre()}return}
    if(S.etat!=='compte'){clearInterval(T);T=null;return}
    if(majTexte()<=0){clearInterval(T);T=null;S.etat='saisie';S.n='';son(660,.3,.6);setTimeout(()=>son(660,.3,.6),350);vib([200,100,200]);peindre()}}
  function demarrer(etat){S.etat=etat;S.debut=Date.now();if(etat==='compte'){son(880,.15,.5);vib(80)}peindre();clearInterval(T);T=setInterval(tick,200)}
  function valider(){const n=+S.n;if(!(n>=10&&n<=58))return;const b=n*4;
    if(S.rec){S.fcRec=b;try{S.o.onRecup&&S.o.onRecup(b)}catch(e){console.error(e)}S.etat='fin';peindre();return}
    S.fc=b;try{S.o.onFC&&S.o.onFC(b)}catch(e){console.error(e)}
    if(S.o.recup){S.etat='apres';peindre()}else fermer()}

  function ouvrir(o){fermer();o=o||{};S={o,etat:'pret',n:'',rec:false,fc:null,fcRec:null,debut:0};
    boite=document.createElement('div');boite.id='eps-pouls';document.body.appendChild(boite);
    // Les gestes dans la fenêtre ne doivent pas faire tourner les pages de l'appli derrière (balayage).
    ['touchstart','touchend'].forEach(ev=>boite.addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
    boite.addEventListener('click',e=>{const b=e.target.closest('[data-ep]');if(!b){if(e.target===boite&&(S.etat==='pret'||S.etat==='apres'||S.etat==='fin'))fermer();return}
      const a=b.dataset.ep;
      if(a==='x')fermer();
      else if(a==='go')demarrer('compte');
      else if(a==='re'){S.n='';demarrer('compte')}
      else if(a==='ok')valider();
      else if(a==='rec'){S.rec=true;S.n='';demarrer('attente')}});
    boite.addEventListener('input',e=>{if(e.target.id!=='ep-n')return;S.n=e.target.value;const n=+S.n,ok=n>=10&&n<=58,
      r=boite.querySelector('.ep-res'),bt=boite.querySelector('[data-ep="ok"]');
      if(r)r.innerHTML=ok?`${n} × 4 = <b>${n*4} pulsations/min</b>`:S.n!==''?'Entre 10 et 58 battements en 15 s : recompte.':'Tape le nombre compté : l’appli le multiplie par 4.';
      if(bt){bt.disabled=!ok;bt.textContent='Valider'+(ok?' '+n*4:'')}});
    document.addEventListener('keydown',clavier,true);
    peindre()}

  window.EPSPouls={ouvrir,fermer,appreciation,version:1};
})();
