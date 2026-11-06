/* =====================================================================
   eps-avatars.js — le prof en personnage dans les applis élèves EPS
   EPSAvatar('bravo','Séance envoyée !') → HTML d'une vignette décorative
   (image img/avatars/<nom>.webp + bulle facultative).
   Règles : 1 personnage par écran au plus, jamais sur un écran de saisie
   rapide, jamais à l'impression, toujours décoratif (alt vide).
   ===================================================================== */
(function(){
  var st=document.createElement('style');
  st.textContent='.eps-av{display:flex;align-items:flex-end;gap:10px;margin:0}'+
    '.eps-av img{width:auto;height:var(--av-h,110px);flex:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,.12))}'+
    '.eps-av .eps-bulle{position:relative;align-self:center;background:var(--card,#fff);color:var(--fg,#1c2128);border:2px solid var(--acc,#6d28d9);border-radius:16px;padding:10px 14px;font-weight:700;font-size:max(15px,var(--fs-min,15px));line-height:1.3;max-width:260px}'+
    '.eps-av .eps-bulle:before{content:"";position:absolute;left:-10px;bottom:14px;border:8px solid transparent;border-right-color:var(--acc,#6d28d9);border-left:0}'+
    '.eps-av.droite{flex-direction:row-reverse}.eps-av.droite .eps-bulle:before{left:auto;right:-10px;border-right-color:transparent;border-left:8px solid var(--acc,#6d28d9);border-right:0}'+
    '@media print{.eps-av{display:none!important}}';
  document.head.appendChild(st);
  window.EPSAvatar=function(nom,bulle,cls){
    return '<figure class="eps-av '+(cls||'')+'" aria-hidden="true"><img src="img/avatars/'+nom+'.webp" alt="" loading="lazy" decoding="async">'+
      (bulle?'<figcaption class="eps-bulle">'+bulle+'</figcaption>':'')+'</figure>';
  };
})();
