/* pouls-step.js · Prise de pouls assistée (eps-pouls.js) en SECOURS de l'oxymètre, dans le carnet step.
   Ne modifie ni les séances ni vues.js : ajoute un petit bouton « Pas d'oxymètre ? Compter » sous chaque case « FC lue ».
   La FC comptée remplit la case comme une saisie à la main. Elle est aussi notée à côté (chemin + "c", ex. m1.0.fcc)
   pour que le prof sache qu'elle a été comptée : le repère tombe tout seul si la case est ensuite corrigée
   (oxymètre), puisqu'il ne vaut que si la FC lue est égale à la FC comptée. */
(function(){
  'use strict';
  if(!window.EPSPouls)return;
  const main=document.getElementById('main');if(!main)return;
  const donnees=()=>{try{if(!G||V.tab!=='seance'||!V.sid)return null;return sd(G.runners[V.ri||0],V.sid)}catch(e){return null}};
  const estFC=p=>/\.fc$/.test(p);

  function poser(){
    main.querySelectorAll('input[data-p]').forEach(inp=>{
      const p=inp.dataset.p;if(!estFC(p))return;
      const stp=inp.closest('.stp')||inp;if(stp.dataset.pouls)return;stp.dataset.pouls='1';
      const bt=document.createElement('button');bt.type='button';bt.className='eps-pouls-bt secours';bt.dataset.poulsP=p;
      bt.innerHTML='<span aria-hidden="true">❤</span> Pas d’oxymètre ? Compter';
      const apres=stp.nextElementSibling&&stp.nextElementSibling.classList.contains('vw')?stp.nextElementSibling:stp;
      apres.insertAdjacentElement('afterend',bt);
      const d=donnees(),fc=d&&num(getPath(d,p)),c=d&&num(getPath(d,p+'c'));
      if(fc!=null&&c!=null&&fc===c){const t=document.createElement('span');t.className='eps-pouls-tag';
        t.textContent='compté à la main (± 4 à 8)'+(typeof DEFI_S!=='undefined'&&DEFI_S.includes(V.sid)?' : points de défi indicatifs':'');bt.insertAdjacentElement('afterend',t)}
    })}

  main.addEventListener('click',e=>{const bt=e.target.closest('.eps-pouls-bt');if(!bt)return;e.preventDefault();e.stopPropagation();
    const p=bt.dataset.poulsP;
    EPSPouls.ouvrir({
      titre:'Compter mon pouls',
      note:'Seulement s’il n’y a pas d’oxymètre libre : mesure dès l’arrêt.',
      avertissement:'Le comptage est moins précis que l’oxymètre (un battement de travers = 4 pulsations). La mesure sera marquée « comptée » pour le prof.',
      recup:false,
      onFC:v=>{const d=donnees();if(d)setPath(d,p+'c',String(v));
        const inp=main.querySelector(`input[data-p="${p}"]`);if(!inp)return;inp.value=String(v);
        inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}
    })},true);

  new MutationObserver(poser).observe(main,{childList:true,subtree:true});
  poser();
})();
